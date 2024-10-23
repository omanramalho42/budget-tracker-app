'use client'

import React, { useState } from 'react'

import { MAX_DATE_RANGE_DAYS } from '@/lib/constatnt'

import { UserSettings } from '@prisma/client'

import { toast } from 'sonner'

import { differenceInDays, startOfMonth } from 'date-fns'

import { DateRangePicker } from '@/components/ui/date-range-picker'

import StatsCards from './stats-cards'
import CategoriesStats from './categories-stats'

interface OverviewProps {
  userSettings: UserSettings
}

function Overview({ userSettings }: OverviewProps) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  })

  return (
    <>
      <div className="container flex flex-wrap items-end justify-between gap-2 py-6">
        <h2 className="text-3xl font-bold">Visão geral</h2>
        <div className="flex items-center gap-3">
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
