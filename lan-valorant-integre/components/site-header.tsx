'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { isActive, navItems } from '@/lib/nav'
import { RoleSwitch } from '@/components/role-switch'
import { AccountMenu } from '@/components/account-menu'
import { useRole } from '@/components/role-provider'

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-ring">
      <span aria-hidden="true" className="grid size-8 place-items-center bg-primary font-heading text-lg font-extrabold text-primary-foreground [clip-path:polygon(0_0,100%_0,100%_70%,70%_100%,0_100%)]">
        L
      </span>
      <span className="font-heading text-xl font-bold uppercase tracking-wide">
        LAN<span className="text-primary">/</span>VAL
      </span>
    </Link>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const { isAdmin } = useRole()
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Logo />
        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex h-16 items-center px-4 text-sm font-semibold uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {item.label}
                    {active && <span aria-hidden="true" className="absolute inset-x-4 bottom-0 h-0.5 bg-primary" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          {isAdmin && <RoleSwitch />}
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}
