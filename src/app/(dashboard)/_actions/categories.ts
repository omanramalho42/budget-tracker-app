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

  // VERIFICAR SE O USUARIO EXISTE NO BD
  const existUserOnDb = await prisma.user.findFirst({
    where: {
      clerkUserId: user.id,
    },
  })

  const { name, icon, type } = parsedBody.data

  if (existUserOnDb) {
    const existCategoryName = await prisma.category.findMany({
      where: {
        name,
        userId: existUserOnDb.id,
        type
      },
    })
  
    if (existCategoryName.length > 0) {
      throw new Error('Already exists category with same name...')
    }
    
    return await prisma.category.create({
      data: {
        userId: existUserOnDb.id,
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
}

export async function DeleteCategory(form: DeleteCategorySchemaType) {
  const parsedBody = DeleteCategorySchema.safeParse(form)

  if (!parsedBody.success) throw new Error(parsedBody.error.message)

  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }

  // VERIFICAR SE O USUARIO EXISTE NO BD
  const existUserOnDb = await prisma.user.findFirst({
    where: {
      clerkUserId: user.id,
    },
  })

  if(existUserOnDb) {
    return await prisma.category.delete({
      where: {
        name_userId_type: {
          userId: existUserOnDb.id,
          name: parsedBody.data.name,
          type: parsedBody.data.type,
        },
      },
    })
  } else {
    redirect('/sign-in')
  }
}
