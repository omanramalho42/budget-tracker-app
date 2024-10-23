'use client'

import React, { useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { UserButton } from '@clerk/nextjs'

import { Button, buttonVariants } from './ui/button'

import { Logo, LogoMobile } from './logo'
import { ThemeSwitch } from './theme-switch'

import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { Menu } from 'lucide-react'

interface ItemsProps {
  label: 'Dashboard' | 'Transactions' | 'Manage'
  link: string
}

const items: ItemsProps[] = [
  { label: 'Dashboard', link: '/' },
  { label: 'Transactions', link: '/transactions' },
  { label: 'Manage', link: '/manage' },
]

interface NavbarItemProps {
  label: 'Dashboard' | 'Transactions' | 'Manage'
  link: string
  onClickCallback?: () => void
}

export const Navbar = () => {
  return (
    <>
      <DesktopNavbar />
      <MobileNavbar />
    </>
  )
}

function NavbarItem({ label, link, onClickCallback }: NavbarItemProps) {
  const pathname = usePathname()
  const isActive: boolean = pathname === link

  return (
    <div className="relative flex items-center">
      <Link
        href={link}
        className={cn(
          buttonVariants({
            variant: 'ghost',
          }),
          'w-full justify-start text-lg text-muted-foreground hover:text-foreground',
          isActive && 'text-foreground',
        )}
        onClick={() => {
          if (onClickCallback) {
            onClickCallback()
          }
        }}
      >
        {label}
      </Link>
      {isActive && (
        <div className="absolute -bottom-[2px] left-1/2 hidden h-[2px] w-[80%] -translate-x-1/2 rounded-xl bg-foreground md:block"></div>
      )}
    </div>
  )
}

function DesktopNavbar() {
  return (
    <div className="hidden border-separate border-b bg-background md:block">
      <nav className="container flex items-center justify-between px-8">
        <div className="flex h-[80px] min-h-[60px] items-center gap-x-4">
          <Logo />
          <div className="flex h-full">
            {items.map((item) => {
              return (
                <NavbarItem
                  key={item.label}
                  link={item.link}
                  label={item.label}
                />
              )
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitch />
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </nav>
    </div>
  )
}

function MobileNavbar() {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <div className="block border-separate bg-background md:hidden">
      <nav className="container flex items-center justify-between px-8">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px]" side="left">
            <Logo />
            <div className="flex flex-col gap-1 pt-4">
              {items.map((item) => {
                return (
                  <NavbarItem
                    key={item.label}
                    link={item.link}
                    label={item.label}
                    onClickCallback={() => setIsOpen((prev) => !prev)}
                  />
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex h-[80px] min-h-[60px] items-center gap-x-4">
          <LogoMobile />
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitch />
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </nav>
    </div>
  )
}
