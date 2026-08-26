import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireInternalAuth } from "@/lib/internal-auth"

export async function GET(request: Request) {
  const auth = await requireInternalAuth(request)

  if (!auth.ok) {
    return auth.response
  }

  const { searchParams } = new URL(request.url)

  const type = z
    .enum(["expanse", "income"])
    .nullable()
    .safeParse(searchParams.get("type"))

  const categories = await prisma.category.findMany({
    where: {
      userId: auth.userDb.id,
      ...(type.success && type.data
        ? { type: type.data }
        : {}),
    },
    orderBy: {
      name: "asc",
    },
  })

  return Response.json(categories)
}