'use client'

import Link from 'next/link'
import { MatchCard, SectionTitle } from '@/components/cards'
import { useTournament } from '@/components/tournament-provider'

// Matchs du tour en cours (le premier tour qui n'est pas entièrement terminé)
export function CurrentMatches() {
  const { matches } = useTournament()
  const played = matches.filter((m) => !m.bye)
  if (played.length === 0) return null
  const current = played.find((m) => m.status !== 'termine')?.round ?? played[played.length - 1].round
  const highlighted = played.filter((m) => m.round === current)
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
      <SectionTitle
        eyebrow={highlighted[0]?.roundLabel}
        title="Matchs du moment"
        action={
          <Link href="/matchs" className="text-sm font-semibold text-[#ff7a85] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
            Voir le bracket complet
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {highlighted.map((m) => <MatchCard key={m.id} match={m} />)}
      </div>
    </section>
  )
}
