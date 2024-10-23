import React from 'react'

import { Category } from '@prisma/client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'

import { DeleteCategory } from '../_actions/categories'
import {
    AlertDialog,
    AlertDialogAction, 
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
    AlertDialogCancel
} from '@/components/ui/alert-dialog'

import { TransactionType } from '@/lib/types'

interface DeleteCategoryDialogProps {
    category: Category;
    trigger: React.ReactNode;
}

function DeleteCategoryDialog({ category, trigger }: DeleteCategoryDialogProps) {
    const categoryIdentifier = `${category.name}-${category.type}`
    const queryClient = useQueryClient()

    const deleteMutation = useMutation({
        mutationFn: DeleteCategory,
        onSuccess: async () => {
            toast.success("Categoria deletada com sucesso! 🎉", {
                id: categoryIdentifier
            })

            await queryClient.invalidateQueries({
                queryKey: ["categories"]
            })
        },
        onError: () => {
            toast.error("Aconteceu algo de errado", {
                id: categoryIdentifier
            })
        }
    })
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {trigger}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Você têm certeza absoluta?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Está ação não poderá ser desfeita. Isso vai exlcuir permanentemente sua categoria.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            toast.loading("Deletando categoria...", {
                                id: categoryIdentifier
                            })
                            deleteMutation.mutate({
                                name: category.name,
                                type: category.type as TransactionType,
                            })
                        }}
                    >
                        Continuar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default DeleteCategoryDialog