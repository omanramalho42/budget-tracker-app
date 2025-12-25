import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { OverviewQuerySchema } from '../../../../schema/overview'
import { prisma } from '@/lib/prisma'

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

  if(existUserOnDb) {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
  
    const queryParams = OverviewQuerySchema.safeParse({
      from,
      to,
    })
  
    if (!queryParams.success) {
      throw new Error(queryParams.error.message)
    }
  
    const stats = await getCategoriesStats(
      existUserOnDb.id,
      queryParams.data.from,
      queryParams.data.to,
    )
  
    return Response.json(stats)
  }
}

export type GetCategoriesStatsResponseType = Awaited<
  ReturnType<typeof getCategoriesStats>
>

async function getCategoriesStats(userId: string, from: Date, to: Date) {
  const stats = await prisma.transaction.groupBy({
    by: ['type', 'categoryId', 'categoryIcon'],
    where: {
      userId,
      date: {
        gte: from,
        lte: to,
      },
    },
    _sum: {
      amount: true,
    },
    orderBy: {
      _sum: {
        amount: 'desc',
      },
    },
  })

  const categoryIds = stats.map((s) => s.categoryId)

  const categories = await prisma.category.findMany({
    where: {
      id: { in: categoryIds },
    },
    select: {
      id: true,
      name: true,
      icon: true,
    },
  })

  const categoriesMap = new Map(
    categories.map((c) => [c.id, c]),
  )

  const enrichedStats = stats.map((stat) => ({
    ...stat,
    category: categoriesMap.get(stat.categoryId),
  }))

  return enrichedStats
}
