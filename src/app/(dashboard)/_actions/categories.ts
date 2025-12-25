'use server'

import { redirect } from 'next/navigation'

import { currentUser } from '@clerk/nextjs/server'

import { prisma } from '@/lib/prisma'

import {
  CreateCategoriesSchemaType,
  CreateCategoriesSchema,
  DeleteCategorySchemaType,
  DeleteCategorySchema,
} from '@/schema/categories'

export async function CreateCategory(form: CreateCategoriesSchemaType) {
  const parsedBody = CreateCategoriesSchema.safeParse(form)

  if (!parsedBody.success) throw parsedBody.error

  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }

  const { name, icon, type } = parsedBody.data
  
  const existCategoryName = await prisma.category.findMany({
    where: {
      name,
      userId: user.id
    },
  })
  if (existCategoryName.length > 0) {
    throw new Error('Already exists category with same name...')
  }

  return await prisma.category.create({
    data: {
      userId: user.id,
      name,
      icon,
      type,
    } as {
      userId: string;
      name: string;
      icon: string;
      type: "income" | "expanse";
    }
  })
}

export async function DeleteCategory(form: DeleteCategorySchemaType) {
  const parsedBody = DeleteCategorySchema.safeParse(form)

  if (!parsedBody.success) throw new Error(parsedBody.error.message)

  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }

  return await prisma.category.delete({
    where: {
      name_userId_type: {
        userId: user.id,
        name: parsedBody.data.name,
        type: parsedBody.data.type,
      },
    },
  })
}
