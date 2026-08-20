import { z } from "zod"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { verifyLinkTicket } from "@/lib/integration-ticket"

const HABITS_URL = process.env.HABITS_APP_URL!
const SECRET = process.env.INTERNAL_API_SECRET!

const BodySchema = z.object({ ticket: z.string() })

export async function POST(request: Request) {
  const user = await currentUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const parsed = BodySchema.safeParse(await request.json())
  if (!parsed.success) return Response.json(parsed.error, { status: 400 })

  const payload = verifyLinkTicket(parsed.data.ticket)
  if (!payload) return Response.json({ error: "Ticket inválido ou expirado" }, { status: 400 })

  const userDb = await prisma.user.findFirst({ where: { clerkUserId: user.id } })
  if (!userDb) return Response.json({ error: "Usuário não encontrado" }, { status: 404 })

  await prisma.user.update({
    where: { id: userDb.id },
    data: {
      habitsUserId: payload.habitsUserId,
      habitsClerkUserId: payload.habitsClerkUserId,
      habitsLinkedAt: new Date(),
    },
  })

  const res = await fetch(`${HABITS_URL}/api/internal/link-account`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-internal-secret": SECRET },
    body: JSON.stringify({
      habitsUserId: payload.habitsUserId,
      budgetTrackerUserId: userDb.id,
      budgetTrackerClerkUserId: user.id,
    }),
  })

  if (!res.ok) {
  const detail = await res.text().catch(() => "")
  console.error("Falha ao confirmar no Habits:", res.status, detail)
  return Response.json({ error: "Falha ao confirmar no Habits", status: res.status, detail }, { status: 502 })
}
  return Response.json({ ok: true })
}