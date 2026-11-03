'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase, messageErreur } from '@/lib/supabase'

const inputClass =
  'h-12 w-full rounded-md border border-surface-foreground/25 bg-white px-4 text-base text-surface-foreground placeholder:text-surface-foreground/50 focus-visible:border-surface-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/60'

// Page ouverte depuis le lien reçu par e-mail : Supabase connecte le joueur le temps de changer son mot de passe
export function NewPasswordForm() {
  const router = useRouter()
  const [ready, setReady] = useState<boolean | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let active = true
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && (event === 'PASSWORD_RECOVERY' || session)) setReady(true)
    })
    // Laisse le temps à Supabase de lire le jeton présent dans l'adresse
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      if (active) setReady(Boolean(data.session))
    }, 1500)
    return () => { active = false; clearTimeout(t); sub.subscription.unsubscribe() }
  }, [])

  const box = 'flex flex-col gap-5 rounded-md bg-surface p-5 text-surface-foreground sm:p-8'

  if (done) {
    return (
      <div className={`${box} items-center text-center`}>
        <CheckCircle2 className="size-12 text-[#d62f3e]" aria-hidden="true" />
        <p className="text-xl font-bold">Mot de passe modifié</p>
        <Button size="cta" onClick={() => router.push('/equipes')}>Continuer</Button>
      </div>
    )
  }

  if (ready === null) return <div className={box}>Vérification du lien…</div>

  if (!ready) {
    return (
      <div className={box}>
        <p className="font-bold">Ce lien est invalide ou a expiré.</p>
        <Link href="/mot-de-passe-oublie" className="font-bold underline underline-offset-4">Demander un nouveau lien</Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        const d = new FormData(e.currentTarget)
        const password = String(d.get('password'))
        if (password !== String(d.get('confirm'))) {
          setError('Les deux mots de passe ne sont pas identiques.')
          return
        }
        setPending(true)
        setError(null)
        const { error } = await supabase.auth.updateUser({ password })
        setPending(false)
        if (error) setError(messageErreur(error))
        else setDone(true)
      }}
      className={box}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-bold">Nouveau mot de passe</label>
        <input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
        <p className="text-xs">6 caractères minimum.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm" className="text-sm font-bold">Confirmer le mot de passe</label>
        <input id="confirm" name="confirm" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
      </div>
      {error && <p role="alert" className="text-sm font-bold text-[#b3202e]">{error}</p>}
      <Button type="submit" size="cta" className="w-full" disabled={pending}>
        {pending ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
      </Button>
    </form>
  )
}
