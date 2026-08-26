import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ALLOWED_SCOPES } from "@/lib/oauth"
import ConsentForm from "./consent-form"

export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const { client_id, redirect_uri, scope, state, code_challenge, code_challenge_method } = params

  const user = await currentUser()
  if (!user) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(`/oauth/authorize?${new URLSearchParams(params)}`)}`)
  }

  const client = await prisma.oAuthClient.findUnique({ where: { clientId: client_id } })

  // valida client_id, redirect_uri (igualdade EXATA, não startsWith), scopes e PKCE method
  if (!client || !client.redirectUris.includes(redirect_uri)) {
    return <p>Requisição de integração inválida.</p>
  }
  if (code_challenge_method !== "S256" || !code_challenge) {
    return <p>PKCE obrigatório e deve usar S256.</p>
  }
  const requestedScopes = scope.split(" ").filter((s) => ALLOWED_SCOPES.includes(s as any))
  if (requestedScopes.length === 0) {
    return <p>Nenhum escopo válido solicitado.</p>
  }

  const userDb = await prisma.user.findFirst({ where: { clerkUserId: user!.id } })

  return (
    <ConsentForm
      clientName={client.name}
      scopes={requestedScopes}
      clientId={client_id}
      redirectUri={redirect_uri}
      state={state}
      codeChallenge={code_challenge}
      userEmail={userDb?.email ?? user!.emailAddresses[0]?.emailAddress ?? ""}
      userExists={!!userDb}
    />
  )
}