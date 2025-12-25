'use server'

import { redirect } from 'next/navigation'

import { currentUser } from '@clerk/nextjs/server'

import { prisma } from '@/lib/prisma'

import { UpdateUserCurrencySchema } from '@/schema/user-settings'

export async function updateUserCurrency(currency: string) {
  const parsedBody = UpdateUserCurrencySchema.safeParse({
    currency,
  })

  if (!parsedBody.success) throw parsedBody.error

  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }

  // VERIFICAR SE O USUARIO EXISTE NO BD
  const existUserOnDb = await prisma.user.findFirst({
    where: {
      clerkUserId: user.id,
    },
  });

  //USUARIO EXISTE NO BANCO DE DADOS
  if(existUserOnDb) {
    console.log("user on db check")

    //PROCURAR AS CONFIGURAÇÕES DO USUÁRIO
    let userSettings = await prisma.userSettings.findUnique({
      where: {
        userId: existUserOnDb?.id,
      },
    })

    
    if (userSettings) {
      console.log("user settings check")
      
      const userSettigs = await prisma.userSettings.update({
        where: {
          userId: existUserOnDb.id,
        },
        data: {
          currency,
        },
      })

      return userSettigs
    }
  }

}
