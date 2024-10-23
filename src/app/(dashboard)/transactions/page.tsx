"use client"

import { DateRangePicker } from '@/components/ui/date-range-picker'
import { MAX_DATE_RANGE_DAYS } from '@/lib/constatnt'
import { differenceInDays, startOfMonth } from 'date-fns'
import React, { useState } from 'react'
import { toast } from 'sonner'
import TransactionTable from './_components/transaction-table'

function TransactionsPage() {
    const [dateRange, setDateRange] =
        useState<{ from: Date; to: Date }>({
            from: startOfMonth(new Date()),
            to: new Date(),
        })

    return (
        <>
            <div className='border-b bg-card'>
                <div className="mx-6 flex flex-wrap items-center justify-between gap-6 py-8">
                    <div>
                        <p className='text-3xl font-bold'>
                            Histórico de transações
                        </p>
                    </div>
                    <DateRangePicker
                        initialDateFrom={dateRange.from}
                        initialDateTo={dateRange.to}
                        showCompare={false}
                        onUpdate={(values) => {
                            const { from, to } = values.range

                            if (!from || !to) return

                            if (differenceInDays(to, from) > MAX_DATE_RANGE_DAYS) {
                                toast.error(
                                    `A seleção entre datas é muito grande. O máximo permitido é ${MAX_DATE_RANGE_DAYS} dias`
                                )

                                return
                            }
                            setDateRange({ from, to })
                        }}
                    />
                </div>
            </div>
            <div className="mx-8">
                <TransactionTable from={dateRange.from} to={dateRange.to} />
            </div>
        </>
    )
}

export default TransactionsPage