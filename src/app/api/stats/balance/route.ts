import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { OverviewQuerySchema } from '@/schema/overview'
import { prisma } from '@/lib/prisma'
import { endOfDay, startOfDay } from 'date-fns'

export async function GET(request: Request) {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in?redirect=stats-balance')
  }

  // VERIFICAR SE O USUARIO EXISTE NO BD
  const userDb = await prisma.user.findFirst({
    where: {
      clerkUserId: user.id,
    },
  })

  if(userDb) {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
  
    const queryParams = OverviewQuerySchema.safeParse({
      from,
      to,
    })
  
    if (!queryParams.success) {
      return Response.json(queryParams.error.message, {
        status: 400,
      })
    }
  
    const stats = await getBalanceStats(
      userDb.id,
      queryParams.data.from,
      queryParams.data.to,
    )
  
    return Response.json(stats)
  }
}


export type GetBalanceStatsResponseType = Awaited<
  ReturnType<typeof getBalanceStats>
>

async function getBalanceStats(userId: string, from: Date, to: Date) {
  const totals = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      userId,
      date: {
        gte: startOfDay(from),
        lte: endOfDay(to),
      },
    },
    _sum: {
      amount: true,
    },
  })

  return {
    expense: totals.find((t) => t.type === 'expanse')?._sum.amount || 0,
    income: totals.find((t) => t.type === 'income')?._sum.amount || 0,
  }
}
