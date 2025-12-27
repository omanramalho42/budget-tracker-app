import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const user = await currentUser()
  
  // VERIFICAR SE O USUARIO EXISTE NO CLERK
  if (!user) {
    redirect('/sign-in?redirect=user-settings')
  }

  // VERIFICAR SE O USUARIO EXISTE NO BD
  const userDb = await prisma.user.findFirst({
    where: {
      clerkUserId: user.id,
    },
  })

  // USUARIO EXISTE NO BANCO DE DADOS
  if(userDb) {
    let userSettings = await prisma.userSettings.findUnique({
      where: {
        userId: userDb.id,
      },
    })

    if (!userSettings) {
      userSettings = await prisma.userSettings.create({
        data: {
          userId: userDb.id,
          currency: 'USD',
        },
      })
    }

    revalidatePath('/')
    return Response.json(userSettings)
  }

  throw new Error("error find user on databse")
}
