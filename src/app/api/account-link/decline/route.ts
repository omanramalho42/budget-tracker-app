import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")
  const confirmation = await prisma.accountLinkConfirmation.findUnique({ where: { token: token! } })

  if (confirmation && confirmation.status === "pending") {
    await prisma.accountLinkConfirmation.update({
      where: { id: confirmation.id },
      data: { status: "declined", respondedAt: new Date() },
    })
  }
  return new Response("<html><body><h1>Solicitação recusada.</h1></body></html>", {
    headers: { "content-type": "text/html" },
  })
}