import React from 'react'

import { redirect } from 'next/navigation'

import { currentUser } from '@clerk/nextjs/server'

import { Button } from '@/components/ui/button'
import CreateTransactionDialog from './_components/create-transaction-dialog'
import Overview from './_components/overview'
import History from './_components/history'

import { prisma } from '@/lib/prisma'

export default async function page() {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  const userOnDb = await prisma.user.findFirst({
    where: {
      clerkUserId: user.id
    },
  })

  if (!userOnDb) {
    redirect('/sign-in')
  }

  const userSettings = await prisma.userSettings.findUnique({
    where: {
      userId: userOnDb.id,
    },
  })

  if (!userSettings) {
    redirect('/wizard')
  }

  return (
    <div className="h-full border-2 py-6">
      <div className="mx-6 border-b bg-card">
        <div className="flex flex-wrap items-center justify-between gap-6 py-8">
          <p className="text-3xl font-bold">Olá, {user.firstName}! 👋</p>
          <div className="flex items-center gap-3">
            <CreateTransactionDialog
              trigger={
                <Button
                  variant={'outline'}
                  className="border-emerald-500 bg-emerald-950 text-white hover:bg-emerald-900 hover:text-white"
                >
                  Novo depósito 🤑
                </Button>
              }
              type="income"
            />
            <CreateTransactionDialog
              trigger={
                <Button
                  variant={'outline'}
                  className="border-rose-500 bg-rose-950 text-white hover:bg-rose-900 hover:text-white"
                >
                  Nova Retirada 😡
                </Button>
              }
              type="expanse"
            />
          </div>
        </div>
      </div>
      <div className="mx-8">
        <Overview userSettings={userSettings} />
        <History userSettings={userSettings} />
      </div>
    </div>
  )
}
