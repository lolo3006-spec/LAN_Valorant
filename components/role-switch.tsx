'use client'

import { ShieldCheck, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Role, useRole } from '@/components/role-provider'

const options: { value: Role; label: string; short: string; icon: typeof User }[] = [
  { value: 'participant', label: 'Participant', short: 'Joueur', icon: User },
  { value: 'organisateur', label: 'Organisateur', short: 'Orga', icon: ShieldCheck },
]

export function RoleSwitch() {
  const { role, setRole } = useRole()
  return (
    <div role="radiogroup" aria-label="Vue par rôle" className="flex rounded-md border border-border bg-card p-1">
      {options.map((o) => {
        const checked = role === o.value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => setRole(o.value)}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-sm px-3 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-ring',
              checked ? 'bg-surface text-surface-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{o.label}</span>
            <span className="sm:hidden">{o.short}</span>
          </button>
        )
      })}
    </div>
  )
}
