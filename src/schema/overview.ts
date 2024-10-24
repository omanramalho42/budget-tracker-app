import { z } from 'zod'
// import { currentUser } from "@clerk/nextjs/server"
// import { redirect } from "next/navigation"
import { differenceInDays } from 'date-fns'
import { MAX_DATE_RANGE_DAYS } from '@/lib/constatnt'

export const OverviewQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((args) => {
    const { from, to } = args
    const days = differenceInDays(to, from)

    const isValidRange = days >= 0 && days <= MAX_DATE_RANGE_DAYS

    return isValidRange
  })
