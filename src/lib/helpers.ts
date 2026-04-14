import { addDays, addMonths, addWeeks, addYears, startOfMonth } from 'date-fns'
import { Currencies } from './currencies'

export function DateToUTCDate(date: Date) {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds(),
    ),
  )
}

export function GetFormatterForCurrency(currency: string) {
  const locale = Currencies.find((c) => c.value === currency)?.locale

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  })
}

export function calculateNextReportDate(lastSentDate?: Date): Date {
  const now = new Date()
  const lastSent = lastSentDate || now

  const nextDate = startOfMonth(addMonths(lastSent, 1));
  nextDate.setHours(0,0,0,0)
  
  return nextDate
}

enum INTERVALINTERVALTYPE { 
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY"
}

export function calculateNextOcurrence(date: Date, interval: keyof typeof INTERVALINTERVALTYPE) {
  const base = new Date(date)
  base.setHours(0,0,0,0)

  switch(interval) {
    case 'DAILY':
      return addDays(base, 1)
    case 'WEEKLY':
      return addWeeks(base, 1)
    case 'MONTHLY':
      return addMonths(base, 1)
    case 'YEARLY':
      return addYears(base, 1)
    default:
      return base
  }
}
