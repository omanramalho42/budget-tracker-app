"use client"

import React, { useCallback, useEffect, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Category } from '@prisma/client'

import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

import CreateCategoryDialog from './create-category-dialog'

import { TransactionType } from '@/lib/types'
import { CommandEmpty } from 'cmdk'
import { Check, ChevronsUpDown, ChevronUpIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryPickerProps {
    type: TransactionType
    onChange: (value: string) => void
}

export default function CategoryPicker({ type, onChange }: CategoryPickerProps) {
    const [open, setOpen] = useState<boolean>(false);
    const [value, setValue] = useState("")

    useEffect(() => {
        if (!value) return

        onChange(value)
    },[onChange, value])

    const categoriesQuery = useQuery({
        queryKey: ["categories", type],
        queryFn: () => 
            fetch(`/api/categories?type=${type}`)
            .then((res) => res.json())
    })

    const selectedCategory  = categoriesQuery.data?.find(
        (category: Category) => category.name === value
    )

    const onSuccessCallback = useCallback((category: Category) => {
        setValue(category.name)
        setOpen((prev) => !prev)

    }, [setValue, setOpen])

    console.log(selectedCategory, "selected category");

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    role="combobox"
                    aria-expanded={open}
                    className='w-[260px] justify-between'
                >
                    {selectedCategory ? (
                        <CategoryRow category={selectedCategory} />
                    ) : (
                        "Selecione a categoria"
                    )}
                    <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[200px] p-0'>
                <Command 
                    onSubmit={(e) => {
                        e.preventDefault()
                    }}
                >
                    <CommandInput placeholder="Pesquise a categoria..." />
                    <CreateCategoryDialog type={type} onSuccessCallback={onSuccessCallback} />
                    <CommandEmpty>
                        <p>Categoria não encontrada</p>
                        <p className='text-xs text-muted-foreground'>
                            Criar uma nova categoria
                        </p>
                    </CommandEmpty>
                    <CommandGroup>
                        <CommandList>
                            {
                                categoriesQuery.data && categoriesQuery.data.map((category: Category) => (
                                    <CommandItem
                                        key={category.name}
                                        onSelect={() => {
                                            setValue(category.name)
                                            setOpen((prev) => !prev)
                                        }}
                                    >
                                        <CategoryRow category={category} />
                                        <Check 
                                            className={
                                                cn("mr-2 w-4 h-4 opacity-0",
                                                    value === category.name 
                                                    && "opacity-100"
                                                )
                                            } 
                                        />
                                    </CommandItem>
                                ) )
                            }
                        </CommandList>
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

function CategoryRow({ category }: { category: Category }) {
    return (
        <div className='flex items-center gap-2'>
            <span role="img">{category.icon}</span>
            <span>{category.name}</span>
        </div>
    )
}