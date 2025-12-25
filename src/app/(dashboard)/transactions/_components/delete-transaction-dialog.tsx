import React from 'react'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { DeleteTransaction } from '../_actions/delete-transaction'

interface DeleteTransactionDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  transactionId: string
}

function DeleteTransactionDialog({
  open,
  setOpen,
  transactionId,
}: DeleteTransactionDialogProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async (values: string) => {
      return await DeleteTransaction(values)
    },
    onSuccess: async () => {
      toast.success('Transação deletada com sucesso! 🎉', {
        id: transactionId,
      })

      await queryClient.invalidateQueries({
        queryKey: ['transactions'],
      })
    },
    onError: () => {
      toast.error('Aconteceu algo de errado', {
        id: transactionId,
      })
    },
  })
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você têm certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Está ação não poderá ser desfeita. Isso vai exlcuir permanentemente
            sua transação.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              toast.loading('Deletando transação...', {
                id: transactionId,
              })
              deleteMutation.mutate(transactionId)
            }}
          >
            Continuar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteTransactionDialog
