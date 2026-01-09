'use server'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { currentUser } from '@clerk/nextjs/server'

import { prisma } from '@/lib/prisma'

import {
  CreateTransactionSchemaType,
  CreateTransactionSchema,
} from '@/schema/transaction'
import { calculateNextOcurrence } from '@/lib/helpers'

export async function CreateTransaction(form: CreateTransactionSchemaType) {
  const parsedBody = CreateTransactionSchema.safeParse(form)

  if (!parsedBody.success) throw new Error(parsedBody.error.message)

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

  // FIND EXISTS FOLLOWING CATEGORY NAME
  if(userDb) {
    const {
      amount,
      category,
      date,
      type,
      description,
      installments,
      isRecurring,
      recurrenceInterval
    } = parsedBody.data

    const categoryRow = await prisma.category.findFirst({
      where: {
        userId: userDb.id,
        name: category,
        type: type,
      },
    })
    if (!categoryRow) throw new Error('Category not found')

    if (isRecurring && recurrenceInterval) {
      let nextRecurringDate: Date | undefined;
      const currentDate = new Date();
      
      const calculatedDate = calculateNextOcurrence(
        date,
        recurrenceInterval
      )

      nextRecurringDate = 
        calculatedDate < currentDate 
        ? calculateNextOcurrence(
          currentDate,
          recurrenceInterval
        ) : calculatedDate;

        // CREATE ON DB
        // ISRECURRING: ISRECURRING || FALSE
        // RECURRINGINTERVAL: RECURRINGINTERVAL || NULL
        // NEXTRECURRINGDATE,
        // LSATPROCESSED: NULL,
    }

    return await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: userDb.id,
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
            userId: userDb.id,
            day: date.getUTCDate(),
            month: date.getUTCMonth(),
            year: date.getUTCFullYear(),
          },
        },
        create: {
          userId: userDb.id,
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
            userId: userDb.id,
            month: date.getUTCMonth(),
            year: date.getUTCFullYear(),
          },
        },
        create: {
          userId: userDb.id,
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

// 'use server'

// import { revalidateTag } from 'next/cache'
// import { redirect } from 'next/navigation'

// import { currentUser } from '@clerk/nextjs/server'
// import { addMonths } from 'date-fns'

// import { prisma } from '@/lib/prisma'
// import {
//   CreateTransactionSchemaType,
//   CreateTransactionSchema,
// } from '@/schema/transaction'

// export async function CreateTransaction(form: CreateTransactionSchemaType) {
//   const parsedBody = CreateTransactionSchema.safeParse(form)
//   if (!parsedBody.success) {
//     throw new Error(parsedBody.error.message)
//   }

//   const user = await currentUser()
//   if (!user) {
//     redirect('/sign-in')
//   }

//   const userDb = await prisma.user.findFirst({
//     where: { clerkUserId: user.id },
//   })

//   if (!userDb) {
//     throw new Error('User not found')
//   }

//   const {
//     amount,
//     category,
//     date,
//     type,
//     description,
//     installments = 1,
//     isRecurring,
//   } = parsedBody.data

//   const categoryRow = await prisma.category.findFirst({
//     where: {
//       userId: userDb.id,
//       name: category,
//       type,
//     },
//   })

//   if (!categoryRow) throw new Error('Category not found')

//   const totalInstallments =
//     isRecurring && installments > 1 ? installments : 1

//   const installmentAmount = amount / totalInstallments

//   const operations = []

//   for (let i = 0; i < totalInstallments; i++) {
//     const installmentDate = addMonths(date, i)

//     operations.push(
//       prisma.transaction.create({
//         data: {
//           userId: userDb.id,
//           amount: installmentAmount,
//           date: installmentDate,
//           description:
//             totalInstallments > 1
//               ? `${description || ''} (${i + 1}/${totalInstallments})`
//               : description || '',
//           type,
//           categoryIcon: categoryRow.icon,
//           categoryId: categoryRow.id,
//         },
//       }),

//       prisma.monthHistory.upsert({
//         where: {
//           day_month_year_userId: {
//             userId: userDb.id,
//             day: installmentDate.getUTCDate(),
//             month: installmentDate.getUTCMonth(),
//             year: installmentDate.getUTCFullYear(),
//           },
//         },
//         create: {
//           userId: userDb.id,
//           day: installmentDate.getUTCDate(),
//           month: installmentDate.getUTCMonth(),
//           year: installmentDate.getUTCFullYear(),
//           expanse: type === 'expanse' ? installmentAmount : 0,
//           income: type === 'income' ? installmentAmount : 0,
//         },
//         update: {
//           expanse: {
//             increment: type === 'expanse' ? installmentAmount : 0,
//           },
//           income: {
//             increment: type === 'income' ? installmentAmount : 0,
//           },
//         },
//       }),

//       prisma.yearHistory.upsert({
//         where: {
//           month_year_userId: {
//             userId: userDb.id,
//             month: installmentDate.getUTCMonth(),
//             year: installmentDate.getUTCFullYear(),
//           },
//         },
//         create: {
//           userId: userDb.id,
//           month: installmentDate.getUTCMonth(),
//           year: installmentDate.getUTCFullYear(),
//           expanse: type === 'expanse' ? installmentAmount : 0,
//           income: type === 'income' ? installmentAmount : 0,
//         },
//         update: {
//           expanse: {
//             increment: type === 'expanse' ? installmentAmount : 0,
//           },
//           income: {
//             increment: type === 'income' ? installmentAmount : 0,
//           },
//         },
//       }),
//     )
//   }

//   const result = await prisma.$transaction(operations)

//   revalidateTag('overview')

//   return result
// }
