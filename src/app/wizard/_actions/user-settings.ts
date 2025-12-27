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
    redirect('/sign-in?redirect=user-settings')
  }

  // VERIFICAR SE O USUARIO EXISTE NO BD
  const userDb = await prisma.user.findFirst({
    where: {
      clerkUserId: user.id,
    },
  });

  //USUARIO EXISTE NO BANCO DE DADOS
  if(userDb) {
    //PROCURAR AS CONFIGURAÇÕES DO USUÁRIO
    let userSettings = await prisma.userSettings.findUnique({
      where: {
        userId: userDb.id,
      },
    })

    
    if (!userSettings) {
      // Create settings if they don't exist
      userSettings = await prisma.userSettings.create({
        data: {
          userId: userDb.id,
          currency,
        },
      })
      return userSettings
     }

    return await prisma.userSettings.update({
      where: {
        userId: userDb.id,
      },
      data: {
        currency,
      },
    })
  } 
  // else {
  //   return await prisma.user.create({
  //     data: {
  //       email: user.emailAddresses[0].emailAddress,
  //       firstName: user.firstName,
  //       lastName: user.lastName,
  //       imageUrl: user.imageUrl,
  //       clerkUserId: user.id,
  //       settings: {
  //         create: {
  //           currency,
  //         },
  //       },
  //     }
  //   })
  // }
  
  throw new Error('User not found in database')
}
