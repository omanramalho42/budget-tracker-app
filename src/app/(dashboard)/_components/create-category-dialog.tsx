'use client'

import React, { useCallback, useState } from 'react'

import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  CreateCategoriesSchema,
  CreateCategoriesSchemaType,
} from '@/schema/categories'

import { TransactionType } from '@/lib/types'
import { cn } from '@/lib/utils'

import { translate } from './create-transaction-dialog'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { CircleOff, Loader2, PlusSquare } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CreateCategory } from '../_actions/categories'
import { Category } from '@prisma/client'
import { useTheme } from 'next-themes'

interface CreateCategoryDialogProps {
  type: TransactionType
  onSuccessCallback: (category: Category) => void
  trigger?: React.ReactNode
}

function CreateCategoryDialog({
  type,
  onSuccessCallback,
  trigger,
}: CreateCategoryDialogProps) {
  const [open, setOpen] = useState<boolean>(false)
  const form = useForm<CreateCategoriesSchemaType>({
    resolver: zodResolver(CreateCategoriesSchema),
    defaultValues: {
      type,
    },
  })

  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: CreateCategoriesSchemaType) => {
      return await CreateCategory(values)
    },
    onSuccess: async (data: Category) => {
      form.reset({
        name: '',
        icon: '',
        type,
      })

      toast.success(`Categoria ${data.name} criada com sucesso 🎉`, {
        id: 'create-category',
      })

      onSuccessCallback(data)

      await queryClient.invalidateQueries({
        queryKey: ['categories']
      })

      setOpen(false)
    },
    onError: (error) => {
      toast.error('Algo aconteceu de errado...', {
        id: 'create-category',
      })
    },
  })

  const onSubmit = useCallback(
    (values: CreateCategoriesSchemaType) => {
      
      toast.loading('Criando categoria...', {
        id: 'create-category',
      })
      mutate(values)
    },
    [mutate],
  )

  const theme = useTheme()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant={'ghost'}
            role="combobox"
            aria-expanded={open}
            className="flex border-separate items-center justify-start rounded-none border-b px-3 py-3 text-muted-foreground"
          >
            <PlusSquare className="mr-2 h-4 w-4" />
            Criar novo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Criar{' '}
            <span
              className={cn(
                'm-1',
                type === 'income' ? 'text-emerald-500' : 'text-rose-500',
              )}
            >
              {translate[type]}
            </span>
          </DialogTitle>
          <DialogDescription>
            Categorias são usadas para unir suas transações
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name={'name'}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder={'Categoria'} type="text" {...field} />
                  </FormControl>
                  <FormDescription>
                    Isso é como a sua categoria irá aparecer no aplicativo
                    (requerido)
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={'icon'}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icone</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className="h-[100px] w-full"
                        >
                          {form.watch('icon') ? (
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-3xl" role="img">
                                {field.value}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                Clique para trocar
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <CircleOff className="h-48px] w-[48px]" />
                              <p className="text-xs text-muted-foreground">
                                Clique para selecionar
                              </p>
                            </div>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full">
                        <Picker
                          data={data}
                          theme={theme.resolvedTheme}
                          navPosition="bottom"
                          previewPosition="top"
                          searchPosition="sticky"
                          skinTonePosition="preview"
                          onEmojiSelect={(emoji: { native: string }) => {
                            field.onChange(emoji.native)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormDescription>
                    Isso é como a sua categoria irá aparecer no aplicativo
                    (requerido)
                  </FormDescription>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
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

export default CreateCategoryDialog
