'use server'

import { redirect } from 'next/navigation'

import { currentUser } from '@clerk/nextjs/server'

import { prisma } from '@/lib/prisma'

export async function DeleteTransaction(id: string) {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }
  
  // VERIFICAR SE O USUARIO EXISTE NO BD
  const existUserOnDb = await prisma.user.findFirst({
    where: {
      clerkUserId: user.id,
    },
  })

  if(existUserOnDb) {
    const transaction = await prisma.transaction.findUnique({
      where: {
        userId: existUserOnDb.id,
        id,
      },
      include: {
        category: true
      }
    })
  
    if (!transaction) throw new Error('Bad request');

    await prisma.$transaction([
      prisma.transaction.delete({
        where: {
          userId: existUserOnDb.id,
          id,
        },
      }),
  
      prisma.monthHistory.update({
        where: {
          day_month_year_userId: {
            userId: existUserOnDb.id,
            day: transaction.date.getUTCDate(),
            month: transaction.date.getUTCMonth(),
            year: transaction.date.getUTCFullYear(),
          },
        },
        data: {
          ...(transaction.type === 'expanse' && {
            expanse: {
              decrement: transaction.amount,
            },
          }),
          ...(transaction.type === 'income' && {
            income: {
              decrement: transaction.amount,
            },
          }),
        },
      }),
  
      prisma.yearHistory.update({
        where: {
          month_year_userId: {
            userId: existUserOnDb.id,
            month: transaction.date.getUTCMonth(),
            year: transaction.date.getUTCFullYear(),
          },
        },
        data: {
          ...(transaction.type === 'expanse' && {
            expanse: {
              decrement: transaction.amount,
            },
          }),
          ...(transaction.type === 'income' && {
            income: {
              decrement: transaction.amount,
            },
          }),
        },
      }),
    ])
  }


}
