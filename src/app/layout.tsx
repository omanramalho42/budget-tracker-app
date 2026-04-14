import type { Metadata } from 'next'

import localFont from 'next/font/local'

import { ClerkProvider } from '@clerk/nextjs'

import { ThemeProvider } from '@/components/providers/theme-provider'
import { syncCurrentUser } from "@/lib/sync-user"

import './globals.css'
import QueryClientProvider from '@/components/providers/query-client-provider'

import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Finanças',
  description: 'Finanças',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
// Sincroniza e busca os dados do banco
  const userDb = await syncCurrentUser()
  const settings = userDb?.settings

  return (
    <html className="dark" lang="pt-BR" suppressHydrationWarning>
      <head />
      <ClerkProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Toaster theme='dark' richColors position="bottom-right" />
          <QueryClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <TooltipProvider>
                <main>{children}</main>
              </TooltipProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </body>
      </ClerkProvider>
    </html>
  )
}
