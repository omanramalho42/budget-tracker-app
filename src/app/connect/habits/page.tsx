import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { verifyLinkTicket } from "@/lib/integration-ticket"
import ConnectHabitsConfirm from "./confirm-client"

export default async function ConnectHabitsPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>
}) {
  const { ticket } = await searchParams
  if (!ticket) return <p className="p-6 text-center text-sm">Link de integração inválido.</p>

  const payload = verifyLinkTicket(ticket)
  if (!payload) {
    return <p className="p-6 text-center text-sm">Link expirado. Volte ao Habits e tente de novo.</p>
  }

  const user = await currentUser()
  if (!user) return null // middleware já deveria ter redirecionado pro sign-in

  // cria o User local na hora, sem depender do webhook já ter processado
  let userDb = await prisma.user.findFirst({ where: { clerkUserId: user.id } })
  if (!userDb) {
    userDb = await prisma.user.create({
      data: {
        clerkUserId: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? "",
        firstName: user.firstName,
        imageUrl: user.imageUrl,
      },
    })
  }

  return (
    <ConnectHabitsConfirm
      ticket={ticket}
      userName={userDb.firstName ?? user.emailAddresses[0]?.emailAddress ?? "sua conta"}
      returnUrl={payload.returnUrl}
    />
  )
}