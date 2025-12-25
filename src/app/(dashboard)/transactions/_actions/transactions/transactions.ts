'use server'

import { redirect } from 'next/navigation'

import { currentUser } from '@clerk/nextjs/server'

import { prisma } from '@/lib/prisma'

import {
  CreateTransactionSchemaType,
  CreateTransactionSchema,
} from '@/schema/transaction'

export async function CreateTransaction(form: CreateTransactionSchemaType) {
  const parsedBody = CreateTransactionSchema.safeParse(form)

  if (!parsedBody.success) throw new Error(parsedBody.error.message)

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

  // FIND EXISTS FOLLOWING CATEGORY NAME
  if(existUserOnDb) {
    const { amount, category, date, type, description } = parsedBody.data
  

    const categoryRow = await prisma.category.findFirst({
      where: {
        userId: existUserOnDb.id,
        name: category,
        type: type,
      },
    })
    if (!categoryRow) throw new Error('Category not found')

    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: existUserOnDb.id,
          amount,
          date,
          description: description || '',
          type,
          categoryIcon: categoryRow.icon,
          categoryId: categoryRow.id
        }, include: {
          category: true
        }
      }),
  
      prisma.monthHistory.upsert({
        where: {
          day_month_year_userId: {
            userId: existUserOnDb.id,
            day: date.getUTCDate(),
            month: date.getUTCMonth(),
            year: date.getUTCFullYear(),
          },
        },
        create: {
          userId: existUserOnDb.id,
          day: date.getUTCDate(),
          month: date.getUTCMonth(),
          year: date.getUTCFullYear(),
          expanse: type === 'expanse' ? amount : 0,
          income: type === 'income' ? amount : 0,
        },
        update: {
          expanse: {
            increment: type === 'expanse' ? amount : 0,
          },
          income: {
            increment: type === 'income' ? amount : 0,
          },
        },
      }),
  
      prisma.yearHistory.upsert({
        where: {
          month_year_userId: {
            userId: existUserOnDb.id,
            month: date.getUTCMonth(),
            year: date.getUTCFullYear(),
          },
        },
        create: {
          userId: existUserOnDb.id,
          month: date.getUTCMonth(),
          year: date.getUTCFullYear(),
          expanse: type === 'expanse' ? amount : 0,
          income: type === 'income' ? amount : 0,
        },
        update: {
          expanse: {
            increment: type === 'expanse' ? amount : 0,
          },
          income: {
            increment: type === 'income' ? amount : 0,
          },
        },
      }),
    ])
  }
}
