import { z } from "zod"

export const CreateCategoriesSchema = z.object({
    name: z.string().min(3).max(20),
    icon: z.string().max(20),
    type: z.enum(["income", "expanse"]),
})

export type CreateCategoriesSchemaType = z.infer<typeof CreateCategoriesSchema>

export const DeleteCategorySchema = z.object({
    name: z.string().min(3).max(20),
    type: z.enum(["income", "expanse"]),
})

export type DeleteCategorySchemaType = z.infer<typeof DeleteCategorySchema>