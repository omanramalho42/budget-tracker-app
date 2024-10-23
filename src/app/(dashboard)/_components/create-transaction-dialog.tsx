"use client"

import React, { useCallback, useState } from 'react'

import { format } from 'date-fns'

import { zodResolver } from "@hookform/resolvers/zod"

import { TransactionType } from '@/lib/types'
import { cn } from '@/lib/utils'

import { useForm } from 'react-hook-form'

import { CreateTransactionSchemaType, CreateTransactionSchema } from '@/schema/transaction'

import {
    Dialog,
    DialogHeader,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'

import CategoryPicker from './category-picker'

import { CalendarIcon, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateTransaction } from '../transactions/_actions/transactions/transactions'
import { toast } from 'sonner'
import { DateToUTCDate } from '@/lib/helpers'

interface CreateTransactionsDialogProps {
    trigger: React.ReactNode;
    type: TransactionType;
}

export const translate = { "income": "entrada", "expanse": "saída" }

function CreateTransactionDialog({ trigger, type }: CreateTransactionsDialogProps) {
    const [open, setOpen] = useState<boolean>(false)

    const form = useForm<CreateTransactionSchemaType>({
        resolver: zodResolver(CreateTransactionSchema),
        defaultValues: {
            type,
            date: new Date(),
        }
    })

    const handleCategoryChange = useCallback((value: string) => {
        form.setValue("category", value)
    }, [form])

    const queryClient = useQueryClient()

    const { mutate, isPending } = useMutation({
        mutationFn: CreateTransaction,
        onSuccess: () => {
            toast.success("Transação criada com sucesso! 🎉", {
                id: "create-transaction"
            })

            form.reset({
                amount: 0,
                category: undefined,
                date: new Date(),
                description: "",
                type,
            })

            queryClient.invalidateQueries({
                queryKey: ["overview"]
            })

            setOpen((prev) => !prev)
        }
    })

    const onSubmit = useCallback((values: CreateTransactionSchemaType) => {
        toast.loading("Criando transação...", {
            id: "create-transaction"
        })

        mutate({
            ...values,
            date: DateToUTCDate(values.date)
        })
    },[mutate])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            {trigger}
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    Criar uma nova transação de
                    <span 
                        className={
                            cn("m-1",
                                type === "income" 
                                ? "text-emerald-500" 
                                : "text-rose-500"
                            )
                        }
                    >
                        {translate[type]}
                    </span>
                </DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <FormField
                        control={form.control}
                        name={"description"}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Descrição
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        defaultValue={""}
                                        type="text"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Descrição da transação (opcional)
                                </FormDescription>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name={"amount"}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Total
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        defaultValue={""}
                                        type="number"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Valor total da transação (requerido)
                                </FormDescription>
                            </FormItem>
                        )}
                    />
                    <div className="flex items-center justify-between gap-2">
                        <FormField
                            control={form.control}
                            name={"category"}
                            render={({ field }) => (
                                <FormItem className='flex flex-col'>
                                    <FormLabel className='mr-5'>
                                        Categoria
                                    </FormLabel>
                                    <FormControl>
                                        <CategoryPicker type={type} onChange={handleCategoryChange} />
                                    </FormControl>
                                    <FormDescription>
                                        Cateroria da transação (requerido)
                                    </FormDescription>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name={"date"}
                            render={({ field }) => (
                                <FormItem className='flex flex-col'>
                                    <FormLabel className='mr-5'>
                                        Data da transação
                                    </FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn("w-[200px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>
                                                            Escolha a data
                                                        </span>
                                                    )}
                                                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className='w-auto p-0'>
                                            <Calendar 
                                                mode='single'
                                                selected={field.value}
                                                onSelect={(value) => {
                                                    if (!value) return
                                                    console.log("@@@ CALENDAR", value)
                                                    field.onChange(value)
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        Defina uma data para isso
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </form>
            </Form>
            <DialogFooter>
                <DialogClose asChild>
                    <Button
                        type='button'
                        variant={"secondary"}
                        onClick={() => {
                            form.reset()
                        }}
                    >
                        Cancelar
                    </Button>
                </DialogClose>
                <Button
                    type='button'
                    disabled={isPending}
                    onClick={form.handleSubmit(onSubmit)}
                >
                    {!isPending ? "Criar" : <Loader2 className="animate-spin" />}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}

export default CreateTransactionDialog