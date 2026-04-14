'use client'

import React, { Fragment, useCallback, useState, useRef } from 'react'

import { format } from 'date-fns'

import { zodResolver } from '@hookform/resolvers/zod'

import { TransactionType } from '@/lib/types'
import { cn } from '@/lib/utils'

import { useForm } from 'react-hook-form'

import {
  CreateTransactionSchemaType,
  CreateTransactionSchema,
} from '@/schema/transaction'

import { CreateTransaction } from '../transactions/_actions/transactions/transactions'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'
import axios from 'axios'

import {
  Dialog,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import MoneyInput from '@/components/money-input'
import CategoryPicker from './category-picker'
import FileUploader from './file-uploader'
import TooltipHoverCard from './tooltips/tooltip-hover-card'

import { DateToUTCDate } from '@/lib/helpers'

import { CalendarIcon, Loader, Loader2 } from 'lucide-react'

interface CreateTransactionsDialogProps {
  trigger: React.ReactNode
  type: TransactionType
}

export const translate = { income: 'depósito', expanse: 'retirada' }

function CreateTransactionDialog({
  trigger,
  type,
}: CreateTransactionsDialogProps) {
  const abortControllerRef =
    useRef<AbortController | null>(null)

  const [loading, setLoading] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)

  const form = useForm<CreateTransactionSchemaType>({
    resolver: zodResolver(CreateTransactionSchema),
    defaultValues: {
      type,
      date: new Date(),
      installments: 1,
      receiptUrl: ""
    },
  })

  const queryClient = useQueryClient()

  const handleCategoryChange = useCallback(
    (value: string) => {
      form.setValue('category', value)
    },
    [form],
  )

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: CreateTransactionSchemaType) => {
      return await CreateTransaction(values)
    },
    onSuccess: async () => {
      toast.success('Transação criada com sucesso! 🎉', {
        id: 'create-transaction',
      })

      form.reset({
        amount: 0,
        category: undefined,
        date: new Date(),
        description: '',
        type,
        installments: 1,
        isRecurring: false
      })

      // Invalidate and refetch
      await queryClient.invalidateQueries({ 
        queryKey: [
          'overview',
        ],
      })

      setOpen((prev) => !prev)
    },
    onError: () => {
      toast.error('Aconteceu algo de errado', {
        id: 'create-transaction',
      })
    },
  })

  const onSubmit = useCallback(
    (values: CreateTransactionSchemaType) => {
      toast.loading('Criando transação...', {
        id: 'create-transaction',
      })
      console.log(values, "values")
      mutate({
        ...values,
        date: DateToUTCDate(values.date),
      })
    },
    [mutate],
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5">
          <DialogTitle>
            Criar uma nova transação de
            <span
              className={cn(
                'm-1',
                type === 'income' ? 'text-emerald-500' : 'text-rose-500',
              )}
            >
              {translate[type]}
            </span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form 
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <TooltipHoverCard>
              <FormField
                control={form.control}
                name="receiptFiles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ai receipt scan</FormLabel>
                    <FormControl>
                      <FileUploader
                        files={field.value}
                        onChange={(file) => {
                          console.log(file, "file")
                          field.onChange(file)
                        }}
                      />
                    </FormControl>
                    <FormDescription />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type='button'
                  disabled={!form.watch('receiptFiles') || loading}
                  onClick={async (e) => {
                    e.preventDefault()
                    // if (abortControllerRef.current) return

                    abortControllerRef.current = new AbortController()
                    
                    setLoading(true)
                    let receiptUrl = ``

                    const formData = new FormData()
                    const files = Array.from(
                      form.watch('receiptFiles') as FileList | File[]
                    )

                    files.forEach((file) => {
                      formData.append('file', file)
                    })
                    
                    const folderName = 'cloudinary-budget'
                    formData.append("folderName", folderName)

                    const { data: resData } = 
                      await axios.post(`/api/upload`,
                        formData,
                        {
                          signal: abortControllerRef.current.signal,
                        }
                      )
                    
                    if(resData.error) {
                      alert("Error uploading file")
                      return
                    }
                    console.log(resData, "receiptUrl")
                    receiptUrl = resData
                    form.setValue('receiptUrl', resData)

                    setLoading(false)
                    toast.success(
                      "File uploaded sucessfully",
                      { id: 'file-uploaded-sucess' }
                    )
                    form.reset({
                      receiptFiles: []
                    })

                    return
                  }}
                >
                  {loading ? 
                    (<Loader 
                        className='animate-spin'
                      />
                    ) : ('Criar +')
                  }
                </Button>
                <Button
                  onClick={() => {
                    if (abortControllerRef.current) {
                      abortControllerRef.current.abort()
                      abortControllerRef.current = null
                    }

                    setLoading(false)
                    form.reset({
                      receiptFiles: [],
                    })
                    setOpen(false)
                  }}
                >
                  Cancelar
                </Button>
              </div>

            </TooltipHoverCard>
            <FormField
              control={form.control}
              name={'description'}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input
                      defaultValue={''}
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
              name={'amount'}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <MoneyInput
                      form={form}
                      label="Valor total"
                      placeholder="Valor"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Valor total da transação (requerido)
                  </FormDescription>
                </FormItem>
              )}
            />
            <div className='hover:bg-accent/50 flex items-center justify-center gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950'>
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-6 justify-between rounded-lg p-2">
                    <FormControl>
                      <Switch
                        className='data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700'
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="grid gap-1.5 font-normal space-y-0.5">
                      <FormLabel className="text-sm leading-none font-medium">
                        Pagamento recorrente?
                      </FormLabel>
                      <FormDescription className='text-muted-foreground text-sm'>
                        Receive notifications via email.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className='flex flex-row-reverse gap-2'>
              {form.watch('isRecurring') && (
                <Fragment>
                  <FormField
                    control={form.control}
                    name="installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>N° parcelas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Defina o Número de Parcelas
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recurrenceInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequência da recorrência</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a frequência" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MONTHLY">Mensal</SelectItem>
                              <SelectItem value="YEARLY">Anual</SelectItem>
                              <SelectItem value="WEEKLY">we</SelectItem>
                              <SelectItem value="DAILY">Daily</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Defina se o pagamento se repete mensalmente ou anualmente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Fragment>
              )}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row w-full">
              <FormField
                control={form.control}
                name={'category'}
                render={() => (
                  <FormItem className="flex flex-col w-full">
                    <FormLabel className="mr-5">Categoria</FormLabel>
                    <FormControl className='w-full'>
                      <CategoryPicker
                        type={type}
                        onChange={handleCategoryChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Cateroria da transação (requerido)
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={'date'}
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel>Data da transação</FormLabel>

                    <Popover modal>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              'w-full justify-between text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Escolha a data</span>
                            )}
                            <CalendarIcon className="h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>

                      <PopoverContent
                        align="center"
                        side="bottom"
                        className="z-[9999] max-w-sm p-2"
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(value) => {
                            if (!value) return
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
        <DialogFooter className='gap-2 sm:gap-0'>
          <DialogClose asChild>
            <Button
              type="button"
              variant={'secondary'}
              onClick={() => {
                form.reset()
              }}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {!isPending ? 'Criar' : <Loader2 className="animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTransactionDialog
