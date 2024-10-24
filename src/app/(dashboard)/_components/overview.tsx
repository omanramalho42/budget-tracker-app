'use client'

import React, { useState } from 'react'

import { MAX_DATE_RANGE_DAYS } from '@/lib/constatnt'

import { UserSettings } from '@prisma/client'

import { toast } from 'sonner'

import { differenceInDays, startOfMonth } from 'date-fns'

import { DateRangePicker } from '@/components/ui/date-range-picker'

import StatsCards from './stats-cards'
import CategoriesStats from './categories-stats'
import { SaveIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OverviewProps {
  userSettings: UserSettings
}

function Overview({ userSettings }: OverviewProps) {
  const cachedDate =
    typeof window !== 'undefined' && localStorage.getItem('@date-range-picker')

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(
    (cachedDate && JSON.parse(cachedDate)) || {
      from: startOfMonth(new Date()),
      to: new Date(),
    },
  )

  const [record, setRecord] = useState<boolean>(false)

  return (
    <>
      <div className="container flex flex-wrap items-end justify-between gap-2 py-6">
        <h2 className="text-3xl font-bold">Visão geral</h2>
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => {
                    setRecord((prev) => !prev)
                    if (!record) {
                      toast.warning(
                        'A partir de agora seu filtro estará salvo ao recarregar a página ✅',
                      )
                    } else {
                      toast.warning(
                        'O filtro de gravação da data foi desativado ❌',
                      )
                    }
                  }}
                  variant={'outline'}
                  size={'icon'}
                >
                  <SaveIcon
                    className={cn(
                      'h-4 w-4 cursor-pointer text-muted-foreground',
                      record && 'text-emerald-500',
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {!record && <p>Clique aqui para gravar seu filtro de data</p>}
                {record && (
                  <p>
                    A partir de agora seu filtro estará salvo ao recarregar a
                    página
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DateRangePicker
            initialDateFrom={dateRange.from}
            initialDateTo={dateRange.to}
            showCompare={false}
            onUpdate={(values) => {
              const { from, to } = values.range

              if (!from || !to) return

              if (differenceInDays(to, from) > MAX_DATE_RANGE_DAYS) {
                toast.error(
                  `A seleção entre datas é muito grande. O máximo permitido é ${MAX_DATE_RANGE_DAYS} dias`,
                )

                return
              }

              const date = {
                from,
                to,
              }

              if (record)
                localStorage.setItem('@date-range-picker', JSON.stringify(date))

              setDateRange({ from, to })
            }}
          />
        </div>
      </div>
      <div className="container flex w-full flex-col gap-2">
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
