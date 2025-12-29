import type { Metadata } from 'next'

import localFont from 'next/font/local'

import { ClerkProvider } from '@clerk/nextjs'

import { ThemeProvider } from '@/components/providers/theme-provider'

import './globals.css'
import QueryClientProvider from '@/components/providers/query-client-provider'

import { Toaster } from 'sonner'

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
              <main>{children}</main>
            </ThemeProvider>
          </QueryClientProvider>
        </body>
      </ClerkProvider>
    </html>
  )
}
