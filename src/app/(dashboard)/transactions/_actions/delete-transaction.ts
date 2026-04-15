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
  const userDb = await prisma.user.findFirst({
    where: {
      clerkUserId: user.id,
    },
  })

  if(userDb) {
    const transaction = await prisma.transaction.findUnique({
      where: {
        id
      },
      include: { category: true }
    })

    if (!transaction || transaction.userId !== userDb.id) {
      throw new Error('Unauthorized')
    }
    await prisma.$transaction([
      prisma.transaction.delete({
        where: { id },
      }),

      prisma.monthHistory.upsert({
        where: {
          day_month_year_userId: {
            userId: userDb.id,
            day: transaction.date.getUTCDate(),
            month: transaction.date.getUTCMonth(),
            year: transaction.date.getUTCFullYear(),
          },
        },
        create: {
          userId: userDb.id,
          day: transaction.date.getUTCDate(),
          month: transaction.date.getUTCMonth(),
          year: transaction.date.getUTCFullYear(),
          expanse: transaction.type === 'expanse' ? -transaction.amount : 0,
          income: transaction.type === 'income' ? -transaction.amount : 0,
        },
        update: {
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

      prisma.yearHistory.upsert({
        where: {
          month_year_userId: {
            userId: userDb.id,
            month: transaction.date.getUTCMonth(),
            year: transaction.date.getUTCFullYear(),
          },
        },
        create: {
          userId: userDb.id,
          month: transaction.date.getUTCMonth(),
          year: transaction.date.getUTCFullYear(),
          expanse: transaction.type === 'expanse' ? -transaction.amount : 0,
          income: transaction.type === 'income' ? -transaction.amount : 0,
        },
        update: {
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
