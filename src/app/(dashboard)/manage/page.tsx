"use client"

import React from 'react'

import { useQuery } from '@tanstack/react-query'

import { CurrencyComboBox } from '@/components/currency-combo-box'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'

import { Button } from '@/components/ui/button'

import SkeletonWrapper from '@/components/skeleton-wrapper'

import CreateCategoryDialog from '../_components/create-category-dialog'

import { TransactionType } from '@/lib/types'

import { PlusSquare, TrashIcon, TrendingDown, TrendingUp } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { translate } from '../_components/create-transaction-dialog'
import { Category } from '@prisma/client'
import DeleteCategoryDialog from '../_components/delete-category-dialog'

function page() {
    return (
        <>
            <div className='border-b bg-card'>
                <div className="mx-6 flex flex-wrap items-center justify-between gap-6 py-8">
                    <div>
                        <p className='text-3xl font-bold'>
                            Gerenciar
                        </p>
                        <p className='text-muted-foreground'>
                            Gerêncie as configurações e as categorias da sua conta
                        </p>
                    </div>
                </div>
            </div>
            <div className="mx-8 flex flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Moeda
                        </CardTitle>
                        <CardDescription>
                            Escolhe a sua moeda padrão para transações
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CurrencyComboBox />
                    </CardContent>
                </Card>
                <CategoryList type="income" />
                <CategoryList type="expanse" />
            </div>
        </>
    )
}

export default page

export function CategoryList({ type }: { type: TransactionType }) {
    const categoriesQuery = useQuery({
        queryKey: ["categories", type],
        queryFn: () => fetch(`/api/categories?type=${type}`)
        .then((res) => res.json())
    })

    const dataAvaliable = categoriesQuery.data && categoriesQuery.data.length > 0

    return (
        <SkeletonWrapper
            isLoading={categoriesQuery.isFetching}
            fullWidth={false}
        >
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center justify-between gap-2'>
                        <div className="flex items-center gap-2">
                            {type === "expanse" ? (
                                <TrendingDown
                                    className='h-12 w-12 items-center rounded-lg bg-rose-400/10 p-2 text-rose-500'
                                />
                            ) : (
                                <TrendingUp
                                    className='h-12 w-12 items-center rounded-lg bg-emerald-400/10 p-2 text-emerald-500'
                                />
                            )}
                            <div>
                                {type === "expanse" ? (
                                    "Saídas"
                                ) : (
                                    "Entradas"
                                )}
                                <div className='text-sm text-muted-foreground'>
                                    Ordenado pelo nome
                                </div>
                            </div>
                        </div>

                        <CreateCategoryDialog
                            type={type}
                            onSuccessCallback={() => categoriesQuery.refetch()}
                            trigger={
                                <Button className='gap-2 text-sm'>
                                    <PlusSquare className='w-4 h-4' />
                                    Criar categoria
                                </Button>
                            }
                        />
                    </CardTitle>
                </CardHeader>
                <Separator />
                {
                    !dataAvaliable && (
                        <div className="flex h-40 w-full flex-col items-center justify-center">
                            <p>
                                Sem categorias de 
                                <span className={cn(
                                    "m-1",
                                    type === "income" 
                                    ? "text-emerald-500" 
                                    : "text-rose-500"
                                    )}
                                >
                                        { translate[type] }
                                </span>
                                ainda
                            </p>

                            <p className='text-sm text-muted-foreground'>
                                Crie uma para começar
                            </p>
                        </div>
                    )
                }
                {
                    dataAvaliable && (
                        <div className="grid grid-flow-row gap-2 p-2 sm:grid-flow-row sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {categoriesQuery.data.map((category: Category) => (
                                <CategoryCard
                                    category={category}
                                    key={category.name}
                                />
                            ))}
                        </div>
                    )
                }
            </Card>
        </SkeletonWrapper>
    )
}

function CategoryCard({ category }: { category: Category }) {
    return (
        <div className='flex border-separate flex-col justify-between rounded-md border shadow-md shadow-black/[0.1] dark:shadow-white/[0.1]'>
            <div className="flex flex-col items-center gap-2 p-4">
                <span className="text-3xl">
                    {category.icon}
                </span>
                <span>{category.name}</span>
            </div>
            <DeleteCategoryDialog
                category={category}
                trigger={
                    <Button
                        className='flex w-full border-separate items-center gap-2 rounded-t-none text-muted-foreground hover:bg-rose-500/20'
                        variant={"secondary"}
                    >
                        <TrashIcon className='h-4 w-4' />
                        Remover
                    </Button>
                }
            />
        </div>
    )
}