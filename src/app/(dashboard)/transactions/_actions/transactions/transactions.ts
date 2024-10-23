"use server"

import { redirect } from "next/navigation"

import { currentUser } from "@clerk/nextjs/server"

import prisma from "@/lib/db"

import { CreateTransactionSchemaType, CreateTransactionSchema } from "@/schema/transaction"

export async function CreateTransaction(form: CreateTransactionSchemaType) {
    const parsedBody = CreateTransactionSchema.safeParse(form)
    
    // throw new Error("teste")

    if (!parsedBody.success) throw new Error(parsedBody.error.message)

    const user = await currentUser();
    if (!user) {
        redirect("/sign-in")
    }

    //FIND EXISTS FOLLOWING CATEGORY NAME
    const { amount, category, date, type, description } = parsedBody.data

    const categoryRow = await prisma.category.findFirst({
        where: {
            userId: user.id,
            name: category
        }
    })

    if (!categoryRow) throw new Error("Category not found")

    await prisma.$transaction([
        prisma.transaction.create({
            data: {
                userId: user.id,
                amount,
                date,
                description: description || "",
                type,
                category,
                categoryIcon: categoryRow.icon,
            },
        }),

        prisma.monthHistory.upsert({
            where: {
                day_month_year_userId: {
                    userId: user.id,
                    day: date.getUTCDate(),
                    month: date.getUTCMonth(),
                    year: date.getUTCFullYear(),
                },
            },
            create: {
                userId: user.id,
                day: date.getUTCDate(),
                month: date.getUTCMonth(),
                year: date.getUTCFullYear(),
                expanse: type === "expanse" ? amount : 0,
                income: type === "income" ? amount : 0,
            },
            update: {
                expanse: {
                    increment: type === "expanse" ? amount : 0,
                },
                income: {
                    increment: type === "income" ? amount : 0,
                }
            }
        }),

        prisma.yearHistory.upsert({
            where: {
                month_year_userId: {
                    userId: user.id,
                    month: date.getUTCMonth(),
                    year: date.getUTCFullYear(),
                },
            },
            create: {
                userId: user.id,
                month: date.getUTCMonth(),
                year: date.getUTCFullYear(),
                expanse: type === "expanse" ? amount : 0,
                income: type === "income" ? amount : 0,
            },
            update: {
                expanse: {
                    increment: type === "expanse" ? amount : 0,
                },
                income: {
                    increment: type === "income" ? amount : 0,
                }
            }
        }),
    ])

}