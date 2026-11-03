import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/cards'
import type { Match } from '@/lib/data'

function BracketSlot({ name, score, win, empty = 'À déterminer' }: { name: string | null; score: number | null; win: boolean; empty?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-2 px-3 py-2', win && 'bg-accent')}>
      <span className={cn('truncate text-sm font-semibold', !name && 'italic text-muted-foreground')}>{name ?? empty}</span>
      <span className={cn('font-heading text-lg font-bold tabular-nums', win ? 'text-primary' : 'text-muted-foreground')}>{score ?? '–'}</span>
    </div>
  )
}

export function Bracket({ matches }: { matches: Match[] }) {
  const nbRounds = Math.max(0, ...matches.map((m) => m.round))
  const rounds = Array.from({ length: nbRounds }, (_, i) => matches.filter((m) => m.round === i + 1))
  if (nbRounds === 0) {
    return <p className="text-muted-foreground">Le bracket sera généré automatiquement au lancement du tournoi.</p>
  }
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${nbRounds}, minmax(220px, 1fr))` }}>
        {rounds.map((list, i) => (
          <div key={i} className="flex flex-col">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-muted-foreground">
              {i === nbRounds - 1 && <Trophy className="size-4 text-primary" aria-hidden="true" />}
              {list[0]?.roundLabel}
            </h3>
            <ol className="flex flex-1 flex-col justify-around gap-4">
              {list.map((m) => {
                const done = m.status === 'termine'
                const winA = done && m.winnerId !== null && m.winnerId === m.teamAId
                const winB = done && m.winnerId !== null && m.winnerId === m.teamBId
                const empty = m.bye ? 'Qualifié d’office' : 'À déterminer'
                return (
                  <li
                    key={m.id}
                    className={cn('overflow-hidden rounded-md border bg-card', m.status === 'en-cours' ? 'border-primary' : 'border-border')}
                  >
                    <BracketSlot name={m.teamA} score={m.scoreA} win={winA} empty={empty} />
                    <div className="h-px bg-border" />
                    <BracketSlot name={m.teamB} score={m.scoreB} win={winB} empty={empty} />
                    {m.status !== 'a-venir' && !m.bye && (
                      <div className="border-t border-border px-3 py-1.5">
                        <StatusBadge status={m.status} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </div>
    </div>
  )
}
