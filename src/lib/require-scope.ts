import { prisma } from "@/lib/prisma"
import { sha256 } from "@/lib/oauth"

export async function requireOAuthScope(request: Request, scope: string) {
  const authHeader = request.headers.get("authorization") ?? ""
  const token = authHeader.replace(/^Bearer\s+/i, "")
  if (!token) return { ok: false as const, response: new Response("Unauthorized", { status: 401 }) }

  const record = await prisma.oAuthAccessToken.findFirst({
    where: { accessToken: sha256(token), revokedAt: null },
  })

  if (!record || record.accessExpiresAt < new Date()) {
    return { ok: false as const, response: new Response("Token expired", { status: 401 }) }
  }
  if (!record.scopes.includes(scope)) {
    return { ok: false as const, response: Response.json({ error: "insufficient_scope" }, { status: 403 }) }
  }

  return { ok: true as const, userId: record.userId }
}