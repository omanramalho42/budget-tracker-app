import { CurrencyComboBox } from '@/components/currency-combo-box';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react'

async function page() {
    const user = await currentUser();
    if (!user) {
        redirect("/sign-in");
    }
    return (
        <div className='container flex flex-col max-w-2xl items-center justify-between gap-4'>
            <div>
                <h1 className='text-center text-3xl'>
                    Bem vindo
                    <span className='ml-2 font-bold'>
                        {user.firstName} 👋
                    </span>
                </h1>
                <h2 className='text-center text-base mt-4 text-muted-foreground'>
                    Vamos começar com suas finanças pessoais.
                </h2>
                <h3 className='mt-2 text-center text-sm text-muted-foreground'>
                    Você pode mudar essas configurações a qualquer momento.
                </h3>
            </div>
            <Separator />
            <Card className='w-full'>
                <CardHeader>
                    <CardTitle>Moeda</CardTitle>
                    <CardDescription>
                        Defina sua moeda padrão para transações.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CurrencyComboBox />
                </CardContent>
            </Card>
            <Separator />
            <Button className='w-full' asChild>
                <Link href={"/"}>
                    Estou pronto, leve-me para o dashboard
                </Link>
            </Button>
        </div>
    )
}

export default page