'use client'

import { useReducer, useEffect } from 'react'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { UseFormReturn } from 'react-hook-form'

type TextInputProps = {
  form: UseFormReturn<any>
  name: string
  label: string
  placeholder: string
}

const moneyFormatter = Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

export default function MoneyInput(props: TextInputProps) {
  const [value, setValue] = useReducer((_: any, next: string) => {
    const digits = next.replace(/\D/g, '')
    return moneyFormatter.format(Number(digits) / 100)
  }, '')

  return (
    <FormField
      control={props.form.control}
      name={props.name}
      render={({ field }) => {

        // 🔥 sincroniza quando valor vem de fora (IA)
        useEffect(() => {
          if (field.value !== undefined && field.value !== null) {
            setValue(moneyFormatter.format(field.value))
          }
        }, [field.value])

        return (
          <FormItem>
            <FormLabel>{props.label}</FormLabel>
            <FormControl>
              <Input
                placeholder={props.placeholder}
                type="text"
                value={value}
                onChange={(ev) => {
                  const formatted = ev.target.value
                  setValue(formatted)

                  const digits = formatted.replace(/\D/g, '')
                  const realValue = Number(digits) / 100

                  field.onChange(realValue)
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}