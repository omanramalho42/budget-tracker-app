import { prisma } from "@/lib/prisma"
import { requireOAuthScope } from "@/lib/require-scope"

export async function GET(request: Request) {
  const auth = await requireOAuthScope(request, "categories:read")
  if (!auth.ok) return auth.response

  const categories = await prisma.category.findMany({
    where: { userId: auth.userId },
    select: { id: true, name: true, icon: true, type: true },
    orderBy: { name: "asc" },
  })
  return Response.json(categories)
}