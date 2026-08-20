import { prisma } from '@/lib/prisma'

// Chave compartilhada entre os dois apps — nunca exposta ao browser
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET!

export async function requireInternalAuth(request: Request) {
  const secret = request.headers.get('x-internal-secret')

  if (!secret || secret !== INTERNAL_SECRET) {
    return { ok: false as const, response: new Response('Unauthorized', { status: 401 }) }
  }

  const { searchParams } = new URL(request.url)
  const clerkUserId =
    searchParams.get('clerkUserId') ?? (await request.clone().json().catch(() => null))?.clerkUserId

  if (!clerkUserId) {
    return { ok: false as const, response: Response.json({ error: 'clerkUserId ausente' }, { status: 400 }) }
  }

  const userDb = await prisma.user.findFirst({ where: { clerkUserId } })

  if (!userDb) {
    return { ok: false as const, response: Response.json({ error: 'Usuário não encontrado' }, { status: 404 }) }
  }

  return { ok: true as const, userDb }
}