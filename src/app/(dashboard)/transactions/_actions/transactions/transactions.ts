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
import { PAYMENTMETHOD } from '@prisma/client'

const mapPaymentMethod = (method?: string | null): PAYMENTMETHOD | null => {
  if (!method) return null

  const map: Record<string, PAYMENTMETHOD> = {
    credit: PAYMENTMETHOD.CARD,
    debit: PAYMENTMETHOD.BANK_TRANSFER,
    pix: PAYMENTMETHOD.MOBILE_PAYMENT,
  }

  return map[method] || null
}

export async function CreateTransaction(form: CreateTransactionSchemaType) {
  const log = (step: string, data?: any) => {
    console.log(`\n🧠 [${step}]`)
    if (data !== undefined) {
      console.log(JSON.stringify(data, null, 2))
    }
  }

  log('START')

  // =============================
  // ✅ VALIDATION
  // =============================
  const parsedBody = CreateTransactionSchema.safeParse(form)

  if (!parsedBody.success) {
    log('❌ VALIDATION ERROR', parsedBody.error.format())
    throw new Error(parsedBody.error.message)
  }

  log('✅ VALIDATION OK', parsedBody.data)

  // =============================
  // 👤 USER
  // =============================
  const user = await currentUser()

  if (!user) {
    log('❌ NO USER')
    redirect('/sign-in')
  }

  log('👤 USER AUTHENTICATED', { clerkId: user.id })

  // =============================
  // 🗄️ USER DB
  // =============================
  const userDb = await prisma.user.findFirst({
    where: { clerkUserId: user.id },
  })

  if (!userDb) {
    log('❌ USER NOT FOUND IN DB')
    throw new Error('User not found')
  }

  log('✅ USER DB FOUND', { userId: userDb.id })

  // =============================
  // 📦 DATA EXTRACTION
  // =============================
  const {
    amount,
    category,
    date,
    type,
    description,
    receiptUrl,
    isRecurring,
    recurrenceInterval,
    installments,
    paymentMethod, // 👈 ADD
  } = parsedBody.data

  log('📦 RAW DATA', parsedBody.data)

  // =============================
  // 📂 CATEGORY
  // =============================
  const categoryRow = await prisma.category.findFirst({
    where: {
      userId: userDb.id,
      name: category,
      type,
    },
  })

  if (!categoryRow) {
    log('❌ CATEGORY NOT FOUND', { category })
    throw new Error('Category not found')
  }

  log('✅ CATEGORY FOUND', categoryRow)

  // =============================
  // 🔢 INSTALLMENTS LOGIC
  // =============================
  const finalInstallments =
    recurrenceInterval === 'DAILY' ? 1 : installments || 1

  log('🔢 INSTALLMENTS CALCULATED', {
    original: installments,
    final: finalInstallments,
    recurrenceInterval,
  })

  // =============================
  // 📆 TRANSACTION GENERATION
  // =============================
  let currentDate = new Date(date)

  const transactionsToCreate = []

  for (let i = 0; i < finalInstallments; i++) {
    const nextDate =
      i === 0
        ? currentDate
        : calculateNextOcurrence(
            currentDate,
            recurrenceInterval || 'MONTHLY'
          )

    log(`📆 CALCULATING DATE [${i}]`, {
      previousDate: currentDate,
      nextDate,
    })

    currentDate = nextDate

  const tx = {
    userId: userDb.id,
    amount: amount / finalInstallments,
    date: nextDate,
    description: description || '',
    type,
    receiptUrl,
    categoryIcon: categoryRow.icon,
    categoryId: categoryRow.id,

    isRecurring: isRecurring || false,
    recurrenceInterval: recurrenceInterval || null,
    nextRecurringDate:
      isRecurring && recurrenceInterval
        ? calculateNextOcurrence(nextDate, recurrenceInterval)
        : null,

    paymentMethod: mapPaymentMethod(paymentMethod), // ✅ FIX
  }

    log(`🧾 TRANSACTION BUILT [${i}]`, tx)

    transactionsToCreate.push(tx)
  }

  log('📦 FINAL TRANSACTIONS ARRAY', transactionsToCreate)

  // =============================
  // 💾 DATABASE TRANSACTION
  // =============================
  try {
    log('🚀 SENDING TO DATABASE')

    const result = await prisma.$transaction([
      ...transactionsToCreate.map((tx, index) => {
        log(`💾 INSERTING TRANSACTION [${index}]`, tx)
        return prisma.transaction.create({ data: tx })
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

    log('🎉 SUCCESS - TRANSACTIONS CREATED', result)

    return result
  } catch (error) {
    log('💥 DATABASE ERROR', error)
    throw error
  }
}