import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

import { redirect } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: Request) {
  const user = await currentUser()
  
  // VERIFICAR SE O USUARIO EXISTE NO CLERK
  if (!user) {
    redirect('/sign-in?redirect=user-settings')
  }

  // VERIFICAR SE O USUARIO EXISTE NO BD
  const existUserOnDb = await prisma.user.findFirst({
    where: {
      clerkUserId: user.id,
    },
  })

  if(existUserOnDb) {
    let userSettings = await prisma.userSettings.findUnique({
      where: {
        userId: existUserOnDb?.id,
      },
    })

    if (!userSettings) {
      userSettings = await prisma.userSettings.create({
        data: {
          userId: existUserOnDb?.id,
          currency: 'USD',
        },
      })
    }

    revalidatePath('/')
    return Response.json(userSettings)
  }
}
