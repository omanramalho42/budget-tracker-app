"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, ShieldCheck, Wallet, Receipt, Tag } from "lucide-react"

const SCOPE_LABELS: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  "expenses:read": {
    label: "Ler seus gastos",
    icon: <Receipt className="h-4 w-4" />,
    description: "Ver o histórico de despesas cadastradas no Budget Tracker.",
  },
  "incomes:read": {
    label: "Ler suas receitas",
    icon: <Wallet className="h-4 w-4" />,
    description: "Ver o histórico de entradas cadastradas no Budget Tracker.",
  },
  "categories:read": {
    label: "Ler categorias",
    icon: <Tag className="h-4 w-4" />,
    description: "Ver as categorias de gastos e receitas que você já criou.",
  },
  "expenses:write": {
    label: "Criar gastos",
    icon: <Receipt className="h-4 w-4" />,
    description: "Registrar novas despesas em seu nome.",
  },
  "incomes:write": {
    label: "Criar receitas",
    icon: <Wallet className="h-4 w-4" />,
    description: "Registrar novas entradas em seu nome.",
  },
}

interface ConsentFormProps {
  clientName: string
  scopes: string[]
  clientId: string
  redirectUri: string
  state: string
  codeChallenge: string
  userEmail: string
  userExists: boolean
}

export default function ConsentForm({
  clientName,
  scopes,
  clientId,
  redirectUri,
  state,
  codeChallenge,
  userEmail,
  userExists,
}: ConsentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDecision = async (decision: "approve" | "deny") => {
    setLoading(decision)
    setError(null)

    try {
      const { data } = await axios.post("/api/oauth/consent", {
        clientId,
        redirectUri,
        scopes,
        state,
        codeChallenge,
        decision,
      })

      if (data.redirectTo) {
        window.location.href = data.redirectTo
        return
      }
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Não foi possível processar sua decisão.")
      setLoading(null)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card
        className="w-full max-w-md flex flex-col gap-5 rounded-2xl border border-white/5 bg-card p-6"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              <span className="text-primary">{clientName}</span> quer se conectar
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Conectando como <span className="font-medium text-foreground">{userEmail}</span>
            </p>
          </div>
        </div>

        {!userExists && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-300">
            Você ainda não tem uma conta no Budget Tracker. Ao continuar, uma conta será criada
            automaticamente usando este e-mail.
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Este app poderá:
          </p>
          {scopes.map((scope) => {
            const info = SCOPE_LABELS[scope]
            if (!info) return null
            return (
              <div
                key={scope}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2.5"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {info.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{info.label}</p>
                  <p className="text-[11px] text-muted-foreground">{info.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {error && (
          <p className="text-center text-xs text-destructive">{error}</p>
        )}

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            disabled={loading !== null}
            onClick={() => handleDecision("approve")}
          >
            {loading === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Autorizar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading !== null}
            onClick={() => handleDecision("deny")}
          >
            {loading === "deny" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancelar"}
          </Button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground">
          Você pode revogar este acesso a qualquer momento nas configurações da sua conta.
        </p>
      </Card>
    </div>
  )
}