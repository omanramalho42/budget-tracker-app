import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateOpaqueToken, sha256, verifyPkce } from "@/lib/oauth"

const Schema = z.discriminatedUnion("grant_type", [
  z.object({
    grant_type: z.literal("authorization_code"),
    code: z.string(),
    redirect_uri: z.string().url(),
    client_id: z.string(),
    client_secret: z.string(),
    code_verifier: z.string(),
  }),
  z.object({
    grant_type: z.literal("refresh_token"),
    refresh_token: z.string(),
    client_id: z.string(),
    client_secret: z.string(),
  }),
])

export async function POST(request: Request) {
  const body = Schema.parse(await request.json())

  const client = await prisma.oAuthClient.findUnique({ where: { clientId: body.client_id } })
  if (!client || !(await bcrypt.compare(body.client_secret, client.clientSecret))) {
    return Response.json({ error: "invalid_client" }, { status: 401 })
  }

  if (body.grant_type === "authorization_code") {
    const authCode = await prisma.oAuthAuthorizationCode.findUnique({ where: { code: body.code } })

    if (
      !authCode ||
      authCode.usedAt ||                       // uso único
      authCode.expiresAt < new Date() ||        // expirado
      authCode.clientId !== client.id ||
      authCode.redirectUri !== body.redirect_uri || // deve bater exatamente
      !verifyPkce(body.code_verifier, authCode.codeChallenge)
    ) {
      return Response.json({ error: "invalid_grant" }, { status: 400 })
    }

    // marca uso único ANTES de emitir — evita corrida (double-spend)
    await prisma.oAuthAuthorizationCode.update({
      where: { id: authCode.id },
      data: { usedAt: new Date() },
    })

    return issueTokens(client.id, authCode.userId, authCode.scopes)
  }

  // refresh_token
  const hashed = sha256(body.refresh_token)
  const existing = await prisma.oAuthAccessToken.findFirst({
    where: { refreshToken: hashed, clientId: client.id, revokedAt: null },
  })
  if (!existing || existing.refreshExpiresAt < new Date()) {
    return Response.json({ error: "invalid_grant" }, { status: 400 })
  }
  await prisma.oAuthAccessToken.update({ where: { id: existing.id }, data: { revokedAt: new Date() } })
  return issueTokens(client.id, existing.userId, existing.scopes)
}

async function issueTokens(
  clientId: string,
  userId: string,
  scopes: string[]
) {
  const accessToken = generateOpaqueToken()
  const refreshToken = generateOpaqueToken()

  await prisma.oAuthAccessToken.create({
    data: {
      accessToken: sha256(accessToken),
      refreshToken: sha256(refreshToken),
      clientId,
      userId,
      scopes,
      accessExpiresAt: new Date(
        Date.now() + 1000 * 60 * 60
      ),
      refreshExpiresAt: new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 30
      ),
    },
  })

  return Response.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "Bearer",
    expires_in: 3600,
    scope: scopes.join(" "),
    user_id: userId,
  })
}