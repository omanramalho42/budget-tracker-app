'use client'

import { useState } from 'react'

import {
  QueryClient,
  QueryClientProvider as Provider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export default function QueryClientProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(() => new QueryClient({}))

  return (
    <Provider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      {children}
    </Provider>
  )
}
