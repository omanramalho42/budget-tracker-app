import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireInternalAuth } from '@/lib/internal-auth'
import { startOfDay, endOfDay } from 'date-fns'

const QuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  sourceApp: z.string().optional(),
  sourceRefId: z.string().optional(), // filtra por hábito específico, se quiser
})

export async function GET(request: Request) {
  const auth = await requireInternalAuth(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    from: searchParams.get('from'),
    to: searchParams.get('to'),
    sourceApp: searchParams.get('sourceApp') ?? undefined,
    sourceRefId: searchParams.get('sourceRefId') ?? undefined,
  })

  if (!parsed.success) return Response.json(parsed.error, { status: 400 })

  const { from, to, sourceApp, sourceRefId } = parsed.data

  const [transactions, totals] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: auth.userDb.id,
        date: { gte: startOfDay(from), lte: endOfDay(to) },
        ...(sourceApp ? { sourceApp } : {}),
        ...(sourceRefId ? { sourceRefId } : {}),
      },
      orderBy: { date: 'desc' },
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId: auth.userDb.id,
        date: { gte: startOfDay(from), lte: endOfDay(to) },
        ...(sourceApp ? { sourceApp } : {}),
        ...(sourceRefId ? { sourceRefId } : {}),
      },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  return Response.json({
    transactions,
    expense: totals.find((t) => t.type === 'expanse')?._sum.amount ?? 0,
    income: totals.find((t) => t.type === 'income')?._sum.amount ?? 0,
    count: totals.reduce((acc, t) => acc + t._count, 0),
  })
}