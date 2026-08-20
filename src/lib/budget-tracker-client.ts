const BASE_URL = process.env.BUDGET_TRACKER_URL! // ex: https://www.budget-tracker.com.br
const SECRET = process.env.INTERNAL_API_SECRET!

async function internalFetch(path: string, opts: { clerkUserId: string; init?: RequestInit }) {
  const url = new URL(`${BASE_URL}/api/internal${path}`)

  const res = await fetch(url.toString(), {
    ...opts.init,
    headers: {
      "content-type": "application/json",
      "x-internal-secret": SECRET,
      ...(opts.init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => "")
    throw new Error(`Budget Tracker error ${res.status}: ${errBody}`)
  }

  return res.json()
}

export type BudgetCategory = {
  id: string
  name: string
  icon: string
  type: "expanse" | "income"
}

export function fetchBudgetCategories(clerkUserId: string, type?: "expanse" | "income") {
  const qs = new URLSearchParams({ clerkUserId, ...(type ? { type } : {}) })
  return internalFetch(`/categories?${qs}`, { clerkUserId, init: { method: "GET" } }) as Promise<BudgetCategory[]>
}

export function createBudgetTransaction(clerkUserId: string, payload: {
  amount: number
  description?: string
  date: Date
  type: "expanse" | "income"
  category: string
  categoryIcon?: string
  paymentMethod?: "credit" | "debit" | "pix"
  sourceRefId: string
  sourceRefLabel?: string
}) {
  return internalFetch(`/transactions`, {
    clerkUserId,
    init: {
      method: "POST",
      body: JSON.stringify({ clerkUserId, sourceApp: "habits", ...payload }),
    },
  })
}

export function fetchBudgetHabitHistory(clerkUserId: string, from: Date, to: Date, sourceRefId?: string) {
  const qs = new URLSearchParams({
    clerkUserId,
    from: from.toISOString(),
    to: to.toISOString(),
    sourceApp: "habits",
    ...(sourceRefId ? { sourceRefId } : {}),
  })
  return internalFetch(`/transaction-history?${qs}`, { clerkUserId, init: { method: "GET" } })
}