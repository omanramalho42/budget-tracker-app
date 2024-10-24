import { GetBalanceStatsResponseType } from '@/app/api/stats/balance/route'
import SkeletonWrapper from '@/components/skeleton-wrapper'
import { Card } from '@/components/ui/card'
import { DateToUTCDate, GetFormatterForCurrency } from '@/lib/helpers'
import { UserSettings } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import React, { useCallback, useMemo } from 'react'
import CountUp from 'react-countup'

interface StatsCardsProps {
  userSettings: UserSettings
  from: Date
  to: Date
}

function StatsCards({ from, to, userSettings }: StatsCardsProps) {
  const statsQuery = useQuery<GetBalanceStatsResponseType>({
    queryKey: ['overview', 'stats', from, to],
    queryFn: () =>
      fetch(
        `/api/stats/balance?from=${DateToUTCDate(from)}&to=${DateToUTCDate(to)}`,
      ).then((res) => res.json()),
  })

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency)
  }, [userSettings.currency])

  const income = statsQuery.data?.income || 0
  const expense = statsQuery.data?.expense || 0

  const balance = income - expense

  return (
    <div className="relative flex w-full flex-wrap gap-2 md:flex-nowrap">
      <SkeletonWrapper isLoading={statsQuery.isFetching}>
        <StatCard
          formatter={formatter}
          value={income}
          title="Depósito"
          icon={
            <TrendingUp className="h-12 w-12 items-center rounded-lg bg-emerald-400/10 p-2 text-emerald-500" />
          }
        />
      </SkeletonWrapper>

      <SkeletonWrapper isLoading={statsQuery.isFetching}>
        <StatCard
          formatter={formatter}
          value={expense}
          title="Retirada"
          icon={
            <TrendingDown className="h-12 w-12 items-center rounded-lg bg-rose-400/10 p-2 text-rose-500" />
          }
        />
      </SkeletonWrapper>

      <SkeletonWrapper isLoading={statsQuery.isFetching}>
        <StatCard
          formatter={formatter}
          value={balance}
          title="Carteira"
          icon={
            <Wallet className="h-12 w-12 items-center rounded-lg bg-violet-400/10 p-2 text-violet-500" />
          }
        />
      </SkeletonWrapper>
    </div>
  )
}

export default StatsCards

function StatCard({
  formatter,
  value,
  title,
  icon,
}: {
  formatter: Intl.NumberFormat
  icon: React.ReactNode
  title: string
  value: number
}) {
  const formatFn = useCallback(
    (value: number) => {
      return formatter.format(value)
    },
    [formatter],
  )

  return (
    <Card className="flex h-24 w-full items-center gap-2 p-4">
      {icon}
      <div className="flex flex-col items-center gap-0">
        <p className="text-muted-foreground">{title}</p>
        <CountUp
          preserveValue
          redraw={false}
          end={value}
          decimals={2}
          formattingFn={formatFn}
          className="text-2xl"
        />
      </div>
    </Card>
  )
}
