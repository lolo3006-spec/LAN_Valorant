'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

// Fenêtre modale simple (Échap ou clic à l'extérieur pour fermer)
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    ref.current?.querySelector<HTMLElement>('input, select, button[type="submit"]')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-md border border-border bg-card p-5 shadow-xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-muted-foreground hover:text-foreground">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export const fieldClass =
  'h-11 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/40'

export function FormField({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
