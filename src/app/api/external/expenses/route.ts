import crypto from "crypto"

import { prisma } from "@/lib/prisma"

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex")
}

async function authenticateOAuth(request: Request, requiredScope: string) {
  const authorization = request.headers.get("authorization")

  if (!authorization?.startsWith("Bearer ")) {
    return {
      ok: false as const,
      response: Response.json(
        { error: "invalid_token" },
        { status: 401 }
      ),
    }
  }

  const token = authorization.slice("Bearer ".length).trim()

  if (!token) {
    return {
      ok: false as const,
      response: Response.json(
        { error: "invalid_token" },
        { status: 401 }
      ),
    }
  }

  const tokenHash = hashToken(token)

  const accessToken = await prisma.oAuthAccessToken.findUnique({
    where: {
      accessToken: tokenHash,
    },
    include: {
      user: true,
      client: true,
    },
  })

  if (!accessToken) {
    return {
      ok: false as const,
      response: Response.json(
        { error: "invalid_token" },
        { status: 401 }
      ),
    }
  }

  if (accessToken.revokedAt) {
    return {
      ok: false as const,
      response: Response.json(
        { error: "invalid_token" },
        { status: 401 }
      ),
    }
  }

  if (accessToken.accessExpiresAt <= new Date()) {
    return {
      ok: false as const,
      response: Response.json(
        { error: "invalid_token" },
        { status: 401 }
      ),
    }
  }

  if (!accessToken.scopes.includes(requiredScope)) {
    return {
      ok: false as const,
      response: Response.json(
        {
          error: "insufficient_scope",
          requiredScope,
        },
        { status: 403 }
      ),
    }
  }

  return {
    ok: true as const,
    token: accessToken,
  }
}

export async function GET(request: Request) {
  const auth = await authenticateOAuth(request, "expenses:read")

  if (!auth.ok) {
    return auth.response
  }

  const { searchParams } = new URL(request.url)

  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  const from = fromParam ? new Date(fromParam) : undefined
  const to = toParam ? new Date(toParam) : undefined

  if (from && Number.isNaN(from.getTime())) {
    return Response.json(
      { error: "invalid_from" },
      { status: 400 }
    )
  }

  if (to && Number.isNaN(to.getTime())) {
    return Response.json(
      { error: "invalid_to" },
      { status: 400 }
    )
  }

  if (from && to && from > to) {
    return Response.json(
      { error: "invalid_date_range" },
      { status: 400 }
    )
  }

  const expenses = await prisma.transaction.findMany({
    where: {
      userId: auth.token.userId,
      type: "expanse",

      ...(from || to
        ? {
            date: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },

    include: {
      category: true,
    },

    orderBy: {
      date: "desc",
    },
  })

  return Response.json(expenses)
}