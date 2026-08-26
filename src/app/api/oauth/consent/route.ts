import { z } from "zod"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { generateOpaqueToken } from "@/lib/oauth"
import { sendAccountLinkConfirmationEmail } from "@/lib/email/account-link-confirmation"

const Schema = z.object({
  clientId: z.string(),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()),
  state: z.string(),
  codeChallenge: z.string(),
  decision: z.enum(["approve", "deny"]),
})

export async function POST(request: Request) {
  const user = await currentUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const body = Schema.parse(await request.json())

  if (body.decision === "deny") {
    const url = new URL(body.redirectUri)
    url.searchParams.set("error", "access_denied")
    url.searchParams.set("state", body.state)
    return Response.json({ redirectTo: url.toString() })
  }

  const client = await prisma.oAuthClient.findUnique({ where: { clientId: body.clientId } })
  if (!client || !client.redirectUris.includes(body.redirectUri)) {
    return Response.json({ error: "invalid_client" }, { status: 400 })
  }

  const email = user.emailAddresses[0]?.emailAddress
  let userDb = await prisma.user.findFirst({ where: { clerkUserId: user.id } })

  // ── Caso 1: usuário já tem conta no Budget Tracker vinculada a ESTE clerkUserId → segue OAuth normal
  if (userDb) {
    return issueAuthorizationCode(userDb.id, client.id, body)
  }

  // ── Caso 2: não existe conta com esse clerkUserId. Existe conta com o MESMO E-MAIL?
  const existingByEmail = await prisma.user.findFirst({ where: { email } })

  if (existingByEmail) {
    // 🔒 REGRA DE SEGURANÇA: nunca vincula automaticamente por e-mail.
    // Envia confirmação pro dono da conta existente.
    const token = generateOpaqueToken()
    const confirmation = await prisma.accountLinkConfirmation.create({
      data: {
        token,
        userId: existingByEmail.id,
        requestingApp: "lab-habits",
        requestClientId: client.id,
        scopes: body.scopes,
        redirectUri: body.redirectUri,
        state: body.state,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
      },
    })

    await sendAccountLinkConfirmationEmail({
      to: existingByEmail.email,
      confirmToken: confirmation.token,
      requestingAppName: "Lab Habits",
      scopes: body.scopes,
    })

    // Lab Habits recebe isso via erro OAuth customizado — não é um "code"
    const url = new URL(body.redirectUri)
    url.searchParams.set("error", "confirmation_required")
    url.searchParams.set("state", body.state)
    return Response.json({ redirectTo: url.toString() })
  }

  // ── Caso 3: nenhuma conta existe. Cria uma nova no Budget Tracker automaticamente
  // (sem senha — a identidade já foi provada pelo Clerk do Budget Tracker nesta sessão)
  userDb = await prisma.user.create({
    data: { clerkUserId: user.id, email: email!, firstName: user.firstName },
  })

  return issueAuthorizationCode(userDb.id, client.id, body)
}

async function issueAuthorizationCode(
  userId: string,
  clientDbId: string,
  body: z.infer<typeof Schema>
) {
  const code = generateOpaqueToken()
  await prisma.oAuthAuthorizationCode.create({
    data: {
      code,
      clientId: clientDbId,
      userId,
      redirectUri: body.redirectUri,
      scopes: body.scopes,
      codeChallenge: body.codeChallenge,
      expiresAt: new Date(Date.now() + 90 * 1000), // 90s — janela curta
    },
  })

  const url = new URL(body.redirectUri)
  url.searchParams.set("code", code)
  url.searchParams.set("state", body.state)
  return Response.json({ redirectTo: url.toString() })
}