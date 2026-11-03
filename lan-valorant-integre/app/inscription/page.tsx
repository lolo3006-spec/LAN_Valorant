import type { Metadata } from 'next'
import { SignupForm } from '@/components/inscription/signup-form'
import { TournamentFacts, TournamentName } from '@/components/inscription/tournament-facts'
import { steps } from '@/lib/data'

export const metadata: Metadata = { title: 'Inscription — LAN Valorant' }

export default function InscriptionPage() {
  return (
    <>
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:px-6 md:py-16 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <TournamentName />
          <h1 className="text-5xl font-extrabold leading-none md:text-6xl">
            Inscription <span className="text-primary">joueur</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            30 secondes suffisent. Indique ton niveau pour que les équipes soient équilibrées.
          </p>
          <TournamentFacts />
        </div>
        <SignupForm />
      </main>

      <footer aria-labelledby="etapes" className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <h2 id="etapes" className="mb-6 text-2xl font-bold md:text-3xl">4 étapes jusqu’à la finale</h2>
          <ol className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n} className="bg-background p-5">
                <span className="font-heading text-4xl font-extrabold text-primary">{s.n}</span>
                <h3 className="mt-2 text-xl font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </footer>
    </>
  )
}
