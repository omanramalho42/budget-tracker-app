import { prisma } from "@/lib/prisma"
import { generateOpaqueToken } from "@/lib/oauth"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  if (!token) return new Response("Token ausente", { status: 400 })

  const confirmation = await prisma.accountLinkConfirmation.findUnique({ where: { token } })

  if (!confirmation || confirmation.status !== "pending" || confirmation.expiresAt < new Date()) {
    return new Response("Este link expirou ou já foi usado.", { status: 410 })
  }

  await prisma.accountLinkConfirmation.update({
    where: { id: confirmation.id },
    data: { status: "confirmed", respondedAt: new Date() },
  })

  // gera o authorization code SÓ agora, depois da confirmação humana
  const code = generateOpaqueToken()
  await prisma.oAuthAuthorizationCode.create({
    data: {
      code,
      clientId: confirmation.requestClientId,
      userId: confirmation.userId,
      redirectUri: confirmation.redirectUri,
      scopes: confirmation.scopes,
      codeChallenge: "", // ver nota abaixo
      expiresAt: new Date(Date.now() + 90 * 1000),
    },
  })

  // NOTA IMPORTANTE: PKCE original foi gerado pelo Lab Habits e o code_verifier
  // não foi persistido aqui (é secreto do lado do Habits). Duas opções:
  //  (a) o Lab Habits reenvia o code_verifier salvo em cookie httpOnly quando
  //      processar o retorno assíncrono (webhook/polling), OU
  //  (b) trocar PKCE por client_secret confidencial neste ramo específico,
  //      já que o fluxo passou por confirmação humana fora do browser do usuário.
  // Recomendo (b): sem code_challenge aqui, e o /oauth/token aceita o code
  // sem checar PKCE quando authCode.codeChallenge === "" MAS exige client_secret
  // sempre (já exige). Ajustar o /oauth/token pra pular verifyPkce se vazio.

  const redirectUrl = new URL(confirmation.redirectUri)
  redirectUrl.searchParams.set("code", code)
  redirectUrl.searchParams.set("state", confirmation.state)

  // como isso roda no clique de um link de e-mail (navegador do dono da conta,
  // não necessariamente a mesma sessão do Lab Habits), o mais seguro é mostrar
  // uma página de sucesso simples, NÃO redirecionar automaticamente pro Habits
  return new Response(
    `<html><body><h1>Vínculo confirmado!</h1><p>Volte ao Lab Habits — a conexão será concluída automaticamente em instantes.</p></body></html>`,
    { headers: { "content-type": "text/html" } }
  )
}