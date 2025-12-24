'use server'

import { redirect } from 'next/navigation'

import { currentUser } from '@clerk/nextjs/server'

import { prisma } from '@/lib/prisma'

import { UpdateUserCurrencySchema } from '@/schema/user-settings'

export async function updateUserCurrency(currency: string) {
  const parsedBody = UpdateUserCurrencySchema.safeParse({
    currency,
  })

  // throw new Error("teste")

  if (!parsedBody.success) throw parsedBody.error

  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }

  const userSettigs = await prisma.userSettings.update({
    where: {
      userId: user.id,
    },
    data: {
      currency,
    },
  })

  return userSettigs
}
