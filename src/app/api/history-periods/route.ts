import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

// @typescript-eslint/no-unused-vars
export async function GET(request: Request) {
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

  if (request.method !== 'GET') return

  if(existUserOnDb) {
    const periods = await getHistoryPeriods(existUserOnDb.id)
  
    return Response.json(periods)
  }
}

export type GetHistoryPeriodsResponseType = Awaited<
  ReturnType<typeof getHistoryPeriods>
>

async function getHistoryPeriods(userId: string) {
  const result = await prisma.monthHistory.findMany({
    where: {
      userId,
    },
    select: {
      year: true,
    },
    distinct: ['year'],
    orderBy: [
      {
        year: 'asc',
      },
    ],
  })

  const years = result.map((el) => el.year)

  if (years.length === 0) {
    return [new Date().getFullYear()]
  }

  return years
}
