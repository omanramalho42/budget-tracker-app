import { z } from "zod"

import { redirect } from "next/navigation"

import { currentUser } from "@clerk/nextjs/server"

import prisma from "@/lib/db";
import { OverviewQuerySchema } from "../stats/overview/route";
import { GetFormatterForCurrency } from "@/lib/helpers";

export async function GET(request: Request) {
    const user = await currentUser();
    
    if (!user) {
        redirect("/sign-in")
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const queryParams = OverviewQuerySchema.safeParse({
        from,
        to
    })

    if (!queryParams.success) {
        return Response.json(queryParams.error, {
            status: 400
        })
    }

    const transaction = await getTransactionHistory(
        user.id,
        queryParams.data.from,
        queryParams.data.to,
    )

    return Response.json(transaction)
}

export type GetTransactionHistoryResponseType =
    Awaited<
        ReturnType<typeof getTransactionHistory>
    >

async function getTransactionHistory(userId: string, from: Date, to: Date) {
    const userSettings = await prisma.userSettings.findUnique({
        where: {
            userId
        }
    })

    if (!userSettings) throw new Error("User settings not found")

    const formatter = GetFormatterForCurrency(userSettings.currency)


    const transactions = await prisma.transaction.findMany({
        where: {
            userId,
            date: {
                gte: from,
                lte: to,
            },
        },
        orderBy: {
            date: "desc"
        }
    })

    return transactions.map(transaction => ({
        ...transaction,
        formattedAmount: formatter.format(transaction.amount)
    }))
}