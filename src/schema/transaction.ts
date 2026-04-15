import { z } from 'zod'

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const CreateTransactionSchema = z.object({
  amount: z.coerce.number().positive().multipleOf(0.01),
  description: z.string().optional(),
  date: z.coerce.date(),

  category: z.string(),
  type: z.union([z.literal('income'), z.literal('expanse')]),

  receiptUrl: z.string().optional(),
  isRecurring: z.boolean().default(false).optional(),
  recurrenceInterval: z.enum(["DAILY","WEEKLY","MONTHLY","YEARLY"]).optional(),
  installments: z.coerce.number().min(1).max(36).default(1).optional(),
  paymentMethod: z.enum(['credit', 'debit', 'pix']).optional(),
  
  receiptFiles: z.any()   
    .refine(files => {return Array.from(files).every(file => file instanceof File)}, { message: "Expected a file" })
    .refine(files => Array.from(files).every(file => ACCEPTED_IMAGE_TYPES.includes((file as File).type)), "Only these types are allowed .jpg, .jpeg, .png and .webp")
    .default([])
})

export type CreateTransactionSchemaType = z.infer<
  typeof CreateTransactionSchema
>
