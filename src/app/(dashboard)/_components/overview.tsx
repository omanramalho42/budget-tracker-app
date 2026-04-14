'use client'

import React, { useEffect, useState } from 'react'
import { differenceInDays, startOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { SaveIcon } from 'lucide-react'

import { MAX_DATE_RANGE_DAYS } from '@/lib/constants'
import { UserSettings } from '@prisma/client'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import StatsCards from './stats-cards'
import CategoriesStats from './categories-stats'

import { getCookie, setCookie, deleteCookie } from '@/lib/cookie'

const COOKIE_KEY = '@overview-date-filter'

interface OverviewProps {
  userSettings: UserSettings
}

function Overview({ userSettings }: OverviewProps) {
  const [record, setRecord] = useState(false)

  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  })

  // 🔁 Carrega filtro salvo no mount
  useEffect(() => {
    if (record) {
      setCookie(
        COOKIE_KEY,
        JSON.stringify({
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        }),
      )
      toast.success('Filtro salvo com sucesso ✅')
    } else {
      deleteCookie(COOKIE_KEY)
      toast.warning('Filtro salvo desativado ❌')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record])

  const handleSaveToggle = () => {
    setRecord((prev) => !prev)
  }

  const handleUpdate = ({
    range,
  }: {
    range: { from: Date; to?: Date }
  }) => {
    const { from, to } = range
    if (!from || !to) return

    if (differenceInDays(to, from) > MAX_DATE_RANGE_DAYS) {
      toast.error(
        `A seleção entre datas é muito grande. Máximo ${MAX_DATE_RANGE_DAYS} dias`,
      )
      return
    }

    setDateRange({ from, to })
  }

  useEffect(() => {
    if (!record) return

    setCookie(
      COOKIE_KEY,
      JSON.stringify({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      }),
    )
  }, [dateRange, record])

  return (
    <>
      <div className="container flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl font-bold sm:text-3xl">Visão geral</h2>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSaveToggle}
                  variant="outline"
                  size="icon"
                >
                  <SaveIcon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      record
                        ? 'text-emerald-500'
                        : 'text-muted-foreground',
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {record
                  ? 'Filtro salvo automaticamente'
                  : 'Clique para salvar o filtro'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="w-full sm:w-auto">
            <DateRangePicker
              key={`${dateRange.from.toISOString()}-${dateRange.to.toISOString()}`}
              initialDateFrom={dateRange.from}
              initialDateTo={dateRange.to}
              showCompare={false}
              align="center"
              onUpdate={handleUpdate}
            />
          </div>
        </div>
      </div>

      <div className="container flex flex-col gap-2">
        <StatsCards
          userSettings={userSettings}
          from={dateRange.from}
          to={dateRange.to}
        />

        <CategoriesStats
          userSettings={userSettings}
          from={dateRange.from}
          to={dateRange.to}
        />
      </div>
    </>
  )
}

export default Overview
