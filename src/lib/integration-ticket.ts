import crypto from "crypto"

const SECRET = process.env.INTEGRATION_LINK_SECRET!

type TicketPayload = {
  habitsUserId: string
  habitsClerkUserId: string
  returnUrl: string
  iat: number
  exp: number
}

export function createLinkTicket(payload: Omit<TicketPayload, "iat" | "exp">) {
  const iat = Date.now()
  const exp = iat + 10 * 60 * 1000 // 10min de validade
  const body = { ...payload, iat, exp }
  const b64 = Buffer.from(JSON.stringify(body)).toString("base64url")
  const sig = crypto.createHmac("sha256", SECRET).update(b64).digest("base64url")
  return `${b64}.${sig}`
}

export function verifyLinkTicket(ticket: string): TicketPayload | null {
  const [b64, sig] = ticket.split(".")
  if (!b64 || !sig) return null

  const expectedSig = crypto.createHmac("sha256", SECRET).update(b64).digest("base64url")
  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expectedSig)
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null
  }

  const payload = JSON.parse(Buffer.from(b64, "base64url").toString()) as TicketPayload
  if (Date.now() > payload.exp) return null
  return payload
}