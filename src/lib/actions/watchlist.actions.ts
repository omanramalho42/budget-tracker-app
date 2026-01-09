'use server'

import { prisma } from "../prisma"

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return []

  try {
    // Better Auth stores users in the "user" collection
    const user =
      await prisma.user.findFirst({
        where: {
          email
        }
      })

    // const items =
    //   await prisma.watchlist.findMany({
    //     where: {
    //       clerkUserId: user.id
    //     }
    //   },
    //   { symbol: 1 }).lean()
    
    // return items.map((i) => String(i.symbol))
    
    const items: Array<{ symbol: string }> = [ { symbol: 'BRL' }]

    return items.map((i) => String(i?.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err)
    return []
  }
}