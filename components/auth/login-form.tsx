'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRole } from '@/components/role-provider'
import { supabase, messageErreur } from '@/lib/supabase'

const inputClass =
  'h-12 w-full rounded-md border border-surface-foreground/25 bg-white px-4 text-base text-surface-foreground placeholder:text-surface-foreground/50 focus-visible:border-surface-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/60'

export function LoginForm() {
  const router = useRouter()
  const { session, profil, signOut } = useRole()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (session) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-md bg-surface p-8 text-center text-surface-foreground">
        <CheckCircle2 className="size-12 text-[#d62f3e]" aria-hidden="true" />
        <p className="text-xl font-bold">Connecté en tant que {profil?.pseudo ?? session.user.email}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="cta" render={<Link href="/equipes" />} nativeButton={false}>Voir les équipes</Button>
          <Button size="cta" variant="outline" className="text-surface-foreground" render={<Link href="/compte" />} nativeButton={false}>Mon compte</Button>
          <Button size="cta" variant="outline" className="text-surface-foreground" onClick={signOut}>Se déconnecter</Button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        setPending(true)
        setError(null)
        const { error } = await supabase.auth.signInWithPassword({
          email: String(data.get('email')).trim(),
          password: String(data.get('password')),
        })
        setPending(false)
        if (error) setError(messageErreur(error))
        else router.push('/equipes')
      }}
      className="flex flex-col gap-5 rounded-md bg-surface p-5 text-surface-foreground sm:p-8"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-bold">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-bold">Mot de passe</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={inputClass} />
        <Link href="/mot-de-passe-oublie" className="self-end text-sm font-bold underline underline-offset-4">
          Mot de passe oublié ?
        </Link>
      </div>
      {error && <p role="alert" className="text-sm font-bold text-[#b3202e]">{error}</p>}
      <Button type="submit" size="cta" className="w-full" disabled={pending}>
        {pending ? 'Connexion…' : 'Se connecter'}
      </Button>
      <p className="text-center text-sm">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="font-bold underline underline-offset-4">S’inscrire au tournoi</Link>
      </p>
    </form>
  )
}
