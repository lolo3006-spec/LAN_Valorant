'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { isActive, navItems } from '@/lib/nav'

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Navigation mobile" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
