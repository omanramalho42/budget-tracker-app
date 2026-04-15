'use client'

import React, { Fragment, useCallback, useState, useRef } from 'react'

import { format } from 'date-fns'

import { zodResolver } from '@hookform/resolvers/zod'

import { TransactionType } from '@/lib/types'
import { cn, fileToBase64 } from '@/lib/utils'

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
import CategoryPicker from './category-picker'

import { CalendarIcon, Loader, Loader2 } from 'lucide-react'
import MoneyInput from '@/components/money-input'
import { uploadAndScanReceipt } from '../transactions/_actions/upload-file'
import { createAIScanner } from '../_actions/create-ai-scanner'
import { Card } from '@/components/ui/card'

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

  const [openAi, setOpenAi] = useState<boolean>(false)

  const [aiStep, setAiStep] = useState<string>('')
  const simulateAIProcessing = async () => {
    const steps = [
      '📸 Lendo imagem...',
      '🧠 Analisando recibo...',
      '💰 Identificando valores...',
      '📅 Extraindo data...',
      '🏷️ Gerando descrição...',
      '✅ Finalizando...',
    ]

    for (let i = 0; i < steps.length; i++) {
      setAiStep(steps[i])
      await new Promise((res) => setTimeout(res, 700))
    }
  }
  const form = useForm<CreateTransactionSchemaType>({
    resolver: zodResolver(CreateTransactionSchema),
      defaultValues: {
        type,
        date: new Date(),
        installments: 1,
        receiptUrl: "",
        description: "",   // ✅ importante
        amount: 0,         // ✅ importante
        isRecurring: false, // ✅ importante
        paymentMethod: undefined // 👈 adicionar aqui
      }
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
        receiptUrl: "",
        isRecurring: false,
        paymentMethod: undefined
      })

      // Invalidate and refetch
      await queryClient.invalidateQueries({ 
        queryKey: [
          'overview',
        ],
      })

      setOpen((prev) => !prev)
    },
    onError: (error) => {
      console.log(error ,"error")
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
      mutate(values)
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
            <Dialog open={openAi} onOpenChange={setOpenAi}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                >
                  📄 Escanear Recibo com IA
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Escanear recibo</DialogTitle>
                </DialogHeader>

                {/* <FormField
                  control={form.control}
                  name="receiptFiles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload do recibo</FormLabel>
                      <FormControl>
                        <FileUploader
                          files={field.value}
                          onChange={(file) => field.onChange(file)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                /> */}

                {/* IMAGE */}
                <FormField
                  control={form.control}
                  name="receiptUrl"
                  render={({ field }) => {
                    const inputRef = useRef<HTMLInputElement | null>(null)

                    return (
                      <FormItem>
                        <FormControl>
                          <div className="cursor-pointer">
                            <Input
                              type="file"
                              accept="image/*"
                              ref={inputRef}
                              hidden
                              onChange={(e) => {
                                // console.log(e.target.files?.[0],"files")
                                const file = e.target.files?.[0]
                                if (!file) return

                                const url = URL.createObjectURL(file)
                                field.onChange(file)
                              }}
                            />
                            <Card 
                              className="p-3 flex flex-col items-center justify-center text-xs"
                              onClick={() => inputRef.current?.click()}
                            >
                              📷 Imagem
                              {field.value !== null && (
                                <span className="text-green-500 mt-1">Selecionado</span>
                              )}
                            </Card>
                          </div>
                        </FormControl>
                      </FormItem>
                    )
                  }}
                />

                <Button
                  disabled={!form.watch('receiptUrl') || loading}
                  onClick={async () => {
                    setLoading(true)
                    simulateAIProcessing()

                    try {
                      const file = form.watch('receiptUrl') as File;
                      if (!file) return;

                      // ✅ Crie um FormData e adicione o arquivo
                      const formData = new FormData();
                      formData.append('file', file);

                      // Chame a action passando o formData
                      const result = await uploadAndScanReceipt(formData); 

                      form.setValue('receiptUrl', result.url)
                      form.setValue('description', result.description)
                      form.setValue('amount', result.amount)

                      if (result.date) {
                        const [year, month, day] = result.date.split('-').map(Number)

                        form.setValue(
                          'date',
                          new Date(year, month - 1, day),
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        )
                      }

                      const [year, month, day] = result?.date.split('-').map(Number)

                      const parsedDate = new Date(year, month - 1, day)

                      form.setValue('date', parsedDate, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })

                      setAiStep('🎉 Concluído!')

                      setTimeout(() => {
                        setLoading(false)
                        setOpenAi(false)
                      }, 500)

                      toast.success('Recibo processado 🚀')
                    } catch (err) {
                      console.error(err)
                      toast.error('Erro ao processar')
                      setLoading(false)
                    }
                  }}
                >
                  {loading ? <Loader className="animate-spin" /> : 'Escanear'}
                </Button>

                {loading && (
                  <div className="mt-4 p-4 rounded-xl border bg-muted/50 flex flex-col items-center gap-3 animate-in fade-in">
                    
                    <Loader className="animate-spin w-6 h-6" />

                    <p className="text-sm text-muted-foreground text-center">
                      {aiStep}
                    </p>

                    {/* Barra fake de progresso */}
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 animate-[progress_3s_linear]" />
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <FormField
              control={form.control}
              name={'description'}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Descrição da transação (opcional)
                  </FormDescription>
                </FormItem>
              )}
            />

            <MoneyInput
              form={form}
              label="Valor total"
              placeholder="Valor"
              name="amount"
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de pagamento</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="credit">Cartão de crédito</SelectItem>
                        <SelectItem value="debit">Cartão de débito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>

                  <FormDescription>
                    Como essa transação foi paga
                  </FormDescription>

                  <FormMessage />
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
                            value={field.value}
                            onChange={field.onChange}
                            disabled={form.watch('recurrenceInterval') === 'DAILY'}
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
                            // {...field}
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value)

                              if (value === 'DAILY') {
                                form.setValue('installments', 1)
                              }
                            }}
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
                    <FormLabel className="mr-5">
                      Categoria
                    </FormLabel>
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
                            {field.value && !isNaN(new Date(field.value).getTime()) ? (
                              format(new Date(field.value), 'PPP')
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
