import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireInternalAuth } from '@/lib/internal-auth'

const CreateInternalTransactionSchema = z.object({
  clerkUserId: z.string(),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
  date: z.coerce.date(),
  type: z.enum(['expanse', 'income']),
  category: z.string(),         // nome da categoria (mesmo formato usado no resto do app)
  categoryIcon: z.string().optional(),
  paymentMethod: z.enum(['credit', 'debit', 'pix']).optional(),
  sourceApp: z.literal('habits'),
  sourceRefId: z.string(),       // id do hábito no Habits
  sourceRefLabel: z.string().optional(), // nome do hábito, pra exibir sem precisar de outro fetch
})

export async function POST(request: Request) {
  const auth = await requireInternalAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const parsed = CreateInternalTransactionSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(parsed.error, { status: 400 })
  }

  const data = parsed.data

  const category = await prisma.category.findFirst({
    where: { userId: auth.userDb.id, name: data.category, type: data.type },
  })

  if (!category) {
    return Response.json({ error: 'Categoria inválida para este usuário' }, { status: 400 })
  }

  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        userId: auth.userDb.id,
        amount: data.amount,
        description: data.description ?? '',
        date: data.date,
        type: data.type,
        categoryId: category.id,
        categoryIcon: category.icon, // 👈 obrigatório no schema — faltava aqui
        // paymentMethod: data.paymentMethod,
        sourceApp: data.sourceApp,
        sourceRefId: data.sourceRefId,
        sourceRefLabel: data.sourceRefLabel,
      },
    })

    // mantém o agregado mensal/anual como o resto do app já faz
    const date = new Date(data.date)
    await tx.monthHistory.upsert({
      where: { day_month_year_userId: { day: date.getUTCDate(), month: date.getUTCMonth(), year: date.getUTCFullYear(), userId: auth.userDb.id } },
      create: {
        userId: auth.userDb.id,
        day: date.getUTCDate(), month: date.getUTCMonth(), year: date.getUTCFullYear(),
        expanse: data.type === 'expanse' ? data.amount : 0,
        income: data.type === 'income' ? data.amount : 0,
      },
      update: {
        expanse: { increment: data.type === 'expanse' ? data.amount : 0 },
        income: { increment: data.type === 'income' ? data.amount : 0 },
      },
    })

    return created
  })

  return Response.json(transaction, { status: 201 })
}