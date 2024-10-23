'use client'

import React, { useMemo } from 'react'

import { UserSettings } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'

import { GetCategoriesStatsResponseType } from '@/app/api/stats/categories/route'

import SkeletonWrapper from '@/components/skeleton-wrapper'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

import { DateToUTCDate, GetFormatterForCurrency } from '@/lib/helpers'
import { TransactionType } from '@/lib/types'

interface CategoriesCardsProps {
  userSettings: UserSettings
  from: Date
  to: Date
}

function CategoriesStats({ from, to, userSettings }: CategoriesCardsProps) {
  const statsQuery = useQuery<GetCategoriesStatsResponseType>({
    queryKey: ['overview', 'stats', 'categories', from, to],
    queryFn: () =>
      fetch(
        `/api/stats/categories?from=${DateToUTCDate(from)}&to=${DateToUTCDate(to)}`,
      ).then((res) => res.json()),
  })

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency)
  }, [userSettings.currency])

  return (
    <div className="flex w-full flex-wrap gap-2 md:flex-nowrap">
      <SkeletonWrapper isLoading={statsQuery.isFetching}>
        <CategoriesCard
          formatter={formatter}
          type={'income'}
          data={statsQuery.data || []}
        />
      </SkeletonWrapper>
      <SkeletonWrapper isLoading={statsQuery.isFetching}>
        <CategoriesCard
          formatter={formatter}
          type={'expanse'}
          data={statsQuery.data || []}
        />
      </SkeletonWrapper>
    </div>
  )
}

export default CategoriesStats

function CategoriesCard({
  formatter,
  type,
  data,
}: {
  formatter: Intl.NumberFormat
  data: GetCategoriesStatsResponseType
  type: TransactionType
}) {
  const filteredData = data.filter((item) => item.type === type)
  const total = filteredData.reduce(
    (acc, total) => acc + (total._sum?.amount || 0),
    0,
  )

  return (
    <Card className="col-span-6 h-80 w-full">
      <CardHeader>
        <CardTitle className="grid grid-flow-row justify-between gap-2 text-muted-foreground md:grid-flow-col">
          {type === 'income' ? 'Entradas' : 'Saídas'}
        </CardTitle>
      </CardHeader>

      <div className="flex items-center justify-between gap-2">
        {filteredData.length === 0 && (
          <div className="flex h-60 w-full flex-col items-center justify-center">
            Nenhuma informação para o período selecionado.
            <p className="text-sm text-muted-foreground">
              Tente selecionar um diferente periodo ou adicone um novo{' '}
              {type === 'income' ? 'Entradas' : 'Saídas'}
            </p>
          </div>
        )}
      </div>

      {filteredData.length > 0 && (
        <ScrollArea className="h-60 w-full px-4">
          <div className="flex w-full flex-col gap-4 p-4">
            {filteredData.map((item) => {
              const amount = item._sum.amount || 0
              const percentage = (amount * 100) / (total || amount)

              return (
                <div key={item.category} className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-gray-400">
                      {item.categoryIcon} {item.category}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({percentage.toFixed(0)} %)
                      </span>
                    </span>

                    <span className="text-sm text-gray-400">
                      {formatter.format(amount)}
                    </span>
                  </div>

                  <Progress
                    value={percentage}
                    indicator={
                      type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                    }
                  />
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </Card>
  )
}
