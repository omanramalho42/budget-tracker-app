"use client"
import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"

export default function ConnectHabitsConfirm({
  ticket, userName, returnUrl,
}: { ticket: string; userName: string; returnUrl: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      await axios.post("/api/habits/confirm", { ticket })
      window.location.href = `${returnUrl}?integration=budget-tracker&status=success`
    } catch {
      setError("Não foi possível concluir a integração. Tente novamente.")
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 p-6 text-center">
      <h1 className="text-lg font-bold">Vincular ao Lab.Habits</h1>
      <p className="text-sm text-muted-foreground">
        Vincular <strong>{userName}</strong> ao seu app de hábitos? Isso permite registrar
        gastos vinculados aos seus hábitos direto por lá.
      </p>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button onClick={handleConfirm} disabled={loading}>
        {loading ? "Vinculando..." : "Confirmar vínculo"}
      </Button>
    </div>
  )
}