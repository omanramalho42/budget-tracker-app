import { z } from 'zod'

export const CreateTransactionSchema = z.object({
  amount: z.coerce.number().positive().multipleOf(0.01),
  description: z.string().optional(),
  date: z.coerce.date(),

  category: z.string(),
  type: z.union([z.literal('income'), z.literal('expanse')]),

  isRecurring: z.boolean().default(false).optional(),
  recurrenceInterval: z.enum(["DAILY","WEEKLY","MONTHLY","YEARLY"]).optional(),
  installments: z.coerce.number().min(1).max(36).default(1).optional(),
  paymentMethod: z.enum(['credit', 'debit', 'pix']).optional(),
  
  // receiptFiles: z
  //   .instanceof(FileList)
  //   .optional()
  //   .refine(files => !files || files.length === 0 || Array.from(files).every(file => file instanceof File), {
  //     message: "Expected file(s)"
  //   })
  //   .refine(files => !files || Array.from(files).every(file => ACCEPTED_IMAGE_TYPES.includes(file.type)), {
  //     message: "Only .jpg, .jpeg, .png, .webp allowed"
  //   })
  receiptUrl: z.any().optional().nullable(),
  imageUrl: z.string().optional(),
})

export type CreateTransactionSchemaType = z.infer<
  typeof CreateTransactionSchema
>
