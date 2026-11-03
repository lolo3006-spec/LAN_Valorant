'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, CheckCircle2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { levels, type Level } from '@/lib/data'
import { api } from '@/lib/api'
import { supabase, messageErreur } from '@/lib/supabase'
import { useRole } from '@/components/role-provider'
import { useTournament } from '@/components/tournament-provider'

const inputClass =
  'h-12 w-full rounded-md border border-surface-foreground/25 bg-white px-4 text-base text-surface-foreground placeholder:text-surface-foreground/50 focus-visible:border-surface-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/60'

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">{label}</label>
      {children}
      {hint && <p id={`${id}-hint`} className="text-sm text-surface-foreground/70">{hint}</p>}
    </div>
  )
}

function Confirmation({ prenom, level, attenteMail }: { prenom: string; level: Level | null; attenteMail?: boolean }) {
  return (
    <div role="status" className="flex flex-col items-center gap-4 rounded-md bg-surface p-8 text-center text-surface-foreground">
      <CheckCircle2 className="size-14 text-[#d62f3e]" aria-hidden="true" />
      <h2 className="text-3xl font-extrabold">Inscription confirmée</h2>
      <p className="max-w-sm text-surface-foreground/80">
        Bienvenue <strong>{prenom}</strong> !{level && <> Ton niveau <strong>{level}</strong> est enregistré.</>}{' '}
        {attenteMail
          ? 'Clique sur le lien reçu par e-mail pour activer ton compte.'
          : 'Tu peux maintenant créer une équipe ou en rejoindre une.'}
      </p>
      <Button size="cta" className="w-full sm:w-auto" render={<Link href="/equipes" />} nativeButton={false}>
        Voir les équipes
      </Button>
    </div>
  )
}

export function SignupForm() {
  const [level, setLevel] = useState<Level | null>(null)
  const [submitted, setSubmitted] = useState<{ prenom: string; attenteMail: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const { session, profil } = useRole()
  const { tournament, isRegistered, run, busy, refresh } = useTournament()

  if (submitted) return <Confirmation prenom={submitted.prenom} level={level} attenteMail={submitted.attenteMail} />

  const ferme = tournament && tournament.status !== 'inscriptions'

  if (ferme) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-md bg-surface p-8 text-center text-surface-foreground">
        <Lock className="size-12 text-[#d62f3e]" aria-hidden="true" />
        <h2 className="text-3xl font-extrabold">Inscriptions fermées</h2>
        <p className="max-w-sm text-surface-foreground/80">Le tournoi est en préparation ou déjà lancé. Suis les matchs en direct !</p>
        <Button size="cta" render={<Link href="/matchs" />} nativeButton={false}>Voir les matchs</Button>
      </div>
    )
  }

  // Déjà un compte et connecté : inscription en un clic
  if (session && profil) {
    if (isRegistered) return <Confirmation prenom={profil.prenom} level={profil.niveau} />
    return (
      <div className="flex flex-col items-center gap-4 rounded-md bg-surface p-8 text-center text-surface-foreground">
        <h2 className="text-3xl font-extrabold">Salut {profil.prenom} !</h2>
        <p className="max-w-sm text-surface-foreground/80">
          Tu as déjà un compte (niveau <strong>{profil.niveau}</strong>). Inscris-toi à ce tournoi en un clic.
        </p>
        <Button
          size="cta"
          disabled={busy || !tournament}
          onClick={() => tournament && run(() => api.sInscrire(tournament.id), 'Tu es inscrit au tournoi !')}
        >
          M’inscrire au tournoi
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (!tournament) return
        const data = new FormData(e.currentTarget)
        const prenom = String(data.get('prenom')).trim()
        const email = String(data.get('email')).trim().toLowerCase()
        setPending(true)
        setError(null)
        try {
          // 1. contrôle côté serveur (places, dates, e-mail déjà utilisé)
          const refus = await api.verifierInscription(tournament.id, email)
          if (refus) throw new Error(refus)
          // 2. création du compte : la base crée la fiche joueur + l'inscription au tournoi
          const { data: res, error: err } = await supabase.auth.signUp({
            email,
            password: String(data.get('password')),
            options: {
              data: {
                nom: String(data.get('nom')).trim(),
                prenom,
                niveau: level,
                tournoi_id: tournament.id,
              },
            },
          })
          if (err) throw err
          setSubmitted({ prenom, attenteMail: !res.session })
          refresh()
        } catch (er) {
          setError(messageErreur(er))
        } finally {
          setPending(false)
        }
      }}
      className="flex flex-col gap-6 rounded-md bg-surface p-5 text-surface-foreground sm:p-8"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="nom" label="Nom">
          <input id="nom" name="nom" required minLength={2} autoComplete="family-name" placeholder="Ex. Martin" className={inputClass} />
        </Field>
        <Field id="prenom" label="Prénom">
          <input id="prenom" name="prenom" required minLength={2} autoComplete="given-name" placeholder="Ex. Léa" className={inputClass} />
        </Field>
      </div>
      <Field id="email" label="E-mail" hint="Utilisé uniquement pour les notifications, supprimé après l’événement.">
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="prenom.nom@ecole.fr" aria-describedby="email-hint" className={inputClass} />
      </Field>

      <Field id="password" label="Mot de passe" hint="6 caractères minimum. Il te servira à te connecter pour gérer ton équipe et tes scores.">
        <input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" aria-describedby="password-hint" className={inputClass} />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-bold">Ton niveau</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {levels.map((l) => {
            const active = level === l.value
            return (
              <label
                key={l.value}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-md border-2 bg-white p-4 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-primary/60',
                  active ? 'border-surface-foreground' : 'border-surface-foreground/25 hover:border-surface-foreground/60',
                )}
              >
                <input
                  type="radio"
                  name="niveau"
                  value={l.value}
                  required
                  checked={active}
                  onChange={() => setLevel(l.value)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2',
                    active ? 'border-surface-foreground bg-surface-foreground text-surface' : 'border-surface-foreground/40',
                  )}
                >
                  {active && <Check className="size-3" />}
                </span>
                <span>
                  <span className="block font-bold">{l.value}</span>
                  <span className="block text-sm text-surface-foreground/70">{l.description}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" required className="mt-0.5 size-5 shrink-0 accent-[#0e0f12]" />
        <span>J’accepte que mes nom, prénom et e-mail soient utilisés pour l’organisation du tournoi et supprimés après l’événement.</span>
      </label>

      {error && <p role="alert" className="text-sm font-bold text-[#b3202e]">{error}</p>}

      <Button type="submit" size="cta" className="w-full" disabled={pending || !tournament}>
        {pending ? 'Inscription…' : 'Valider mon inscription'}
      </Button>
      <p className="text-center text-sm">
        Déjà un compte ?{' '}
        <Link href="/connexion" className="font-bold underline underline-offset-4">Se connecter</Link>
      </p>
    </form>
  )
}
