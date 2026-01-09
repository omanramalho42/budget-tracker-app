import { PaymentMethodEnum } from "./types"

export const MAX_DATE_RANGE_DAYS = 90

export const receiptPrompt = `
You are a financial assistant that helps users analyze and
extract transaction details from receipt image (base64
encoded)

Analyze this receipt image (base64 encoded) and extract
transaction details matching this exact JSON format:

{
  "title": "string",          // Merchant/store name or brief title
  "amount": "number",         // Total amount (positive number)
  "date": "ISO date string",  // Transaction date in YYYY-MM-DD format
  "description": "string",    // Items purchased summary (max 50 words)
  "category": "string",       // category of the transaction
  "type": "EXPENSE",          // Always "EXPENSE" for receipts
  "paymentMethod": "string"   // One of: ${Object.values(PaymentMethodEnum).join(", ")}
}
`
