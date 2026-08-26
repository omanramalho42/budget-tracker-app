// app/api/oauth/link-status/route.ts
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const state = new URL(request.url).searchParams.get("state")
  const confirmation = await prisma.accountLinkConfirmation.findFirst({ where: { state: state! } })

  if (!confirmation) return Response.json({ status: "not_found" })
  if (confirmation.status === "confirmed") {
    const code = await prisma.oAuthAuthorizationCode.findFirst({
      where: { userId: confirmation.userId, clientId: confirmation.requestClientId, usedAt: null },
      orderBy: { expiresAt: "desc" },
    })
    return Response.json({ status: "confirmed", code: code?.code ?? null })
  }
  return Response.json({ status: confirmation.status }) // pending | declined | expired
}