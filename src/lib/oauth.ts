import crypto from "crypto"

export function generateOpaqueToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url")
}

export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex")
}

export function verifyPkce(codeVerifier: string, codeChallenge: string) {
  const computed = crypto.createHash("sha256").update(codeVerifier).digest("base64url")
  return computed === codeChallenge
}

export const ALLOWED_SCOPES = ["expenses:read", "incomes:read", "categories:read"] as const
// preparado pra expandir: "expenses:write", "incomes:write" — basta adicionar aqui
// e no client registrado; nenhum endpoint precisa mudar de forma