import React from 'react'

export default function WizzardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className='relative flex h-screen w-full flex-col items-center justify-center'>
        {children}
    </div>
  )
}
