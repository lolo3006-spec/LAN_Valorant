'use client'

import { useTournament } from '@/components/tournament-provider'

export function TournamentName() {
  const { tournament } = useTournament()
  return <p className="mb-2 min-h-4 text-xs font-bold uppercase tracking-[0.2em] text-[#ff7a85]">{tournament?.name}</p>
}

export function TournamentFacts() {
  const { tournament, playerCount } = useTournament()
  if (!tournament) return null
  const rows: [string, string][] = [
    ['Date', tournament.date],
    ['Lieu', tournament.location],
    ['Places', `${playerCount}/${tournament.maxPlayers} joueurs inscrits`],
  ]
  if (tournament.closesIn) rows.push(['Clôture', `Dans ${tournament.closesIn}`])
  return (
    <ul className="mt-8 hidden flex-col gap-3 lg:flex">
      {rows.map(([k, v]) => (
        <li key={k} className="flex items-baseline gap-4 border-b border-border pb-3">
          <span className="w-20 text-xs font-bold uppercase tracking-widest text-muted-foreground">{k}</span>
          <span className="font-semibold">{v}</span>
        </li>
      ))}
    </ul>
  )
}
