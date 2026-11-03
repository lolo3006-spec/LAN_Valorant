'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase, messageErreur } from '@/lib/supabase'

const inputClass =
  'h-12 w-full rounded-md border border-surface-foreground/25 bg-white px-4 text-base text-surface-foreground placeholder:text-surface-foreground/50 focus-visible:border-surface-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/60'

// Envoie un lien de réinitialisation par e-mail (le mot de passe n'est jamais envoyé : Supabase ne le connaît pas)
export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-md bg-surface p-8 text-center text-surface-foreground">
        <MailCheck className="size-12 text-[#d62f3e]" aria-hidden="true" />
        <p className="text-xl font-bold">Vérifie ta boîte mail</p>
        <p>
          Si cette adresse correspond à un compte, un e-mail avec un lien pour choisir un nouveau mot de passe
          vient d’être envoyé. Pense à regarder dans les indésirables.
        </p>
        <Link href="/connexion" className="font-bold underline underline-offset-4">Retour à la connexion</Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        const email = String(new FormData(e.currentTarget).get('email')).trim()
        setPending(true)
        setError(null)
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/nouveau-mot-de-passe`,
        })
        setPending(false)
        // Message identique que le compte existe ou non, pour ne pas révéler qui est inscrit
        if (error && (error.message.includes('rate limit') || error.message.includes('not authorized') || error.message.includes('Failed to fetch'))) {
          setError(messageErreur(error))
        } else {
          setSent(true)
        }
      }}
      className="flex flex-col gap-5 rounded-md bg-surface p-5 text-surface-foreground sm:p-8"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-bold">E-mail utilisé à l’inscription</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </div>
      {error && <p role="alert" className="text-sm font-bold text-[#b3202e]">{error}</p>}
      <Button type="submit" size="cta" className="w-full" disabled={pending}>
        {pending ? 'Envoi…' : 'Recevoir le lien'}
      </Button>
      <p className="text-center text-sm">
        <Link href="/connexion" className="font-bold underline underline-offset-4">Retour à la connexion</Link>
      </p>
    </form>
  )
}
