// scripts/seed-oauth-client.ts

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

async function main() {
  const clientId = "lab-habits"

  const clientSecretPlain = process.env.SEED_CLIENT_SECRET

  if (!clientSecretPlain) {
    throw new Error(
      "Defina SEED_CLIENT_SECRET com o mesmo valor do BUDGET_TRACKER_CLIENT_SECRET do Habits"
    )
  }

  const clientSecretHash = await bcrypt.hash(clientSecretPlain, 10)

  const client = await prisma.oAuthClient.upsert({
    where: { clientId },

    create: {
      clientId,
      clientSecret: clientSecretHash,
      name: "Lab Habits",
      redirectUris: [
        "http://localhost:3000/api/integrations/budget-tracker/callback",
      ],
    },

    update: {
      clientSecret: clientSecretHash,
      redirectUris: [
        "http://localhost:3000/api/integrations/budget-tracker/callback",
      ],
    },
  })

  console.log("OAuthClient criado/atualizado:", client.clientId)
}

main()
  .catch(console.error)
  .finally(() => process.exit())