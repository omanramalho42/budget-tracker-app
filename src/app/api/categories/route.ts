import { z } from 'zod'

import { redirect } from 'next/navigation'

import { currentUser } from '@clerk/nextjs/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const user = await currentUser()
  
  // VERIFICAR SE O USUARIO EXISTE NO CLERK
  if (!user) {
    redirect('/sign-in?redirect=categories')
  }

  // VERIFICAR SE O USUARIO EXISTE NO BD
  const userDb = await prisma.user.findFirst({
    where: {
      clerkUserId: user.id,
    },
  })

  const { searchParams } = new URL(request.url)
  const paramType = searchParams.get('type')

  const validator = z.enum(['expanse', 'income']).nullable()
  const queryParams = validator.safeParse(paramType)

  if (!queryParams.success) {
    return Response.json(queryParams.error, {
      status: 400,
    })
  }

  const type = queryParams.data
  if(userDb) {
    const categories = await prisma.category.findMany({
      where: {
        userId: userDb.id,
        ...(type && { type }), // inclui o type no filtro caso se ele estiver definido
      },
      orderBy: {
        name: 'asc',
      },
    })
    return Response.json(categories)
  }
}
