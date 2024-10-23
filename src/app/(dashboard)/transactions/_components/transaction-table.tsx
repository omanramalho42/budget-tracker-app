import React, { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { download, generateCsv, mkConfig } from "export-to-csv"

import { GetTransactionHistoryResponseType } from '@/app/api/transactions-history/route'

import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import SkeletonWrapper from '@/components/skeleton-wrapper'
import { DataTableColumnHeader } from '@/components/datatable/column-header'
import { DataTableFacetedFilter } from '@/components/datatable/faceted-filters'
import { DataTableViewOptions } from '@/components/datatable/column-toggle'
import { Button } from '@/components/ui/button'

import { DateToUTCDate } from '@/lib/helpers'

import { cn } from '@/lib/utils'
import { DownloadIcon, MoreHorizontal, TrashIcon } from 'lucide-react'
import { Transaction } from '@prisma/client'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import DeleteTransactionDialog from './delete-transaction-dialog'
import { translate } from '../../_components/create-transaction-dialog'
import { TransactionType } from '@/lib/types'

interface TransactionTableProps {
    from: Date
    to: Date
}

const emptyData: any[] = []
type TransactionHistoryRow = GetTransactionHistoryResponseType[0]

export const columns: ColumnDef<TransactionHistoryRow>[] = [
    {
        accessorKey: "category",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Categoria' />
        ),
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
        cell: ({ row }) => <div className='flex gap-2 capitalize'>
            {row.original.categoryIcon}
            <div className='capitalize'>
                {row.original.category}
            </div>
        </div>
    },
    {
        accessorKey: "description",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Descrição' />
        ),
        cell: ({ row }) => (
            <div className='capitalize'>
                {row.original.description}
            </div>
        )
    },
    {
        accessorKey: "date",
        header: "Data",
        cell: ({ row }) => {
            const date = new Date(row.original.date)
            const formattedDate = date.toLocaleDateString("default", {
                timeZone: "UTC",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            })

            return (
                <div className='text-muted-foreground'>
                    {formattedDate}
                </div>
            )
        }
    },
    {
        accessorKey: "type",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Tipo' />
        ),
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
        cell: ({ row }) => (
            <div 
                className={cn('capitalize rounded-lg text-center p-2',
                    row.original.type === "income" 
                    && "bg-emerald-400/10 text-emerald-500",
                    row.original.type === "expanse"
                    && "bg-rose-400/10 text-rose-500" 
                )}
            >
                {translate[row.original.type as TransactionType]}
            </div>
        )
    },
    {
        accessorKey: "amount",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Total' />
        ),
        cell: ({ row }) => (
            <p className='text-md rounded-lg bg-gray-400/5 p-2 text-center font-medium'>
                {row.original.formattedAmount}
            </p>
        )
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
            <RowActions transaction={row.original} />
        )
    },
]

const csvConfig = mkConfig({
    fieldSeparator: ".",
    decimalSeparator: ".",
    useKeysAsHeaders: true
})

function TransactionTable({ from, to }: TransactionTableProps) {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

    const [sorting, setSorting] = useState<SortingState>([])

    const history = useQuery<GetTransactionHistoryResponseType>({
        queryKey: ["transactions", "history", from, to],
        queryFn: () => fetch(`/api/transactions-history?from=${DateToUTCDate(from)}&to=${DateToUTCDate(to)}`)
        .then((res) => res.json())
    })

    const handleExportCsv = (data: any[]) => {
        const csv = generateCsv(csvConfig)(data)
        download(csvConfig)(csv)
    }

    const table = useReactTable({
        data: history.data || emptyData,
        columns,
        initialState: {
            pagination: {
                pageSize: 3
            }
        },
        state: {
            sorting,
            columnFilters,
        },
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    const categoriesOptions = useMemo(() => {
        const categoriesMap = new Map()
        history.data?.forEach((transaction) => {
            categoriesMap.set(transaction.category, {
                value: transaction.category,
                label: `${transaction.categoryIcon} ${transaction.category}`
            })
        })
        const uniqueCategories = new Set(categoriesMap.values())
        
        return Array.from(uniqueCategories)
    },[history.data])

    return (
        <div className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-2 py-4">
                <div className="flex gap-2">
                    {table.getColumn("category") && (
                        <DataTableFacetedFilter
                            title='Categoria'
                            column={table.getColumn("category")}
                            options={categoriesOptions}
                        />
                    )}
                    {table.getColumn("type") && (
                        <DataTableFacetedFilter
                            title='Tipo'
                            column={table.getColumn("type")}
                            options={[
                                { label: "Entrada", value: "income" },
                                { label: "Saída", value: "expanse" },
                            ]}
                        />
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={"outline"}
                        size={"sm"}
                        className='ml-auto h-8 lg:flex'
                        onClick={() => {
                            const data = table.getFilteredRowModel().rows.map(row => 
                                ({
                                    category: row.original.category,
                                    categoryIcon: row.original.categoryIcon,
                                    description: row.original.description,
                                    type: row.original.type,
                                    amount: row.original.amount,
                                    formattedAmount: row.original.formattedAmount,
                                    date: row.original.date
                                })
                            )
                            handleExportCsv(data)
                        }}
                    >
                        <DownloadIcon className='mr-2 h-2 w-2' />
                        Exportart csv
                    </Button>
                    <DataTableViewOptions table={table} />
                </div>
            </div>
            <SkeletonWrapper isLoading={history.isFetching}>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                    </TableHead>
                                )
                                })}
                            </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                    </TableCell>
                                ))}
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                                >
                                Nenhum resultado.
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Próximo
                </Button>
                </div>
            </SkeletonWrapper>
        </div>
    )
}

export default TransactionTable

function RowActions({ transaction }: { transaction: Transaction }) {
    const [showDeleteDialog, setShowDeleteDialog] =
        useState<boolean>(false)

    return (
        <>
            <DeleteTransactionDialog
                open={showDeleteDialog}
                setOpen={setShowDeleteDialog}
                transactionId={transaction.id}    
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={'ghost'} className='h-8 w-8 p-0'>
                        <span className='sr-only'>Abrir menu</span>
                        <MoreHorizontal className='h-4 w-4' />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>
                        Ações
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={() => {
                            setShowDeleteDialog((prev) => !prev)
                        }} 
                        className='flex items-center gap-2'
                    >
                        <TrashIcon className='w-4 h-4 text-muted-foreground' />
                        Deletar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}