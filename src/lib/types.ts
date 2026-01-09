export type TransactionType = 'income' | 'expanse'

export type Timeframe = 'month' | 'year'

export type Period = { year: number; month: number }

export type RecurrenceIntervalType = "DAILY" | "WEEKLY" | "MONTHLY"| "YEARLY"
export enum PaymentMethodEnum {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BANK_TRANSFER = 'BANK_TRANSFER',
  BOLETO = 'BOLETO',
  OTHER = 'OTHER',
}
