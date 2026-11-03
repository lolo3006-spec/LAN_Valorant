import { AlertTriangle, Crown, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Match, MatchStatus, Player, Team } from '@/lib/data'

const statusMap: Record<MatchStatus, { label: string; className: string }> = {
  'en-cours': { label: 'En direct', className: 'bg-primary text-primary-foreground' },
  'en-attente': { label: 'Score à valider', className: 'border border-primary text-[#ff7a85]' },
  termine: { label: 'Terminé', className: 'bg-surface text-surface-foreground' },
  'a-venir': { label: 'À venir', className: 'bg-secondary text-muted-foreground' },
}

export function StatusBadge({ status }: { status: MatchStatus }) {
  const s = statusMap[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-bold uppercase tracking-wide', s.className)}>
      {status === 'en-cours' && <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-primary-foreground" />}
      {s.label}
    </span>
  )
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#ff7a85]">{eyebrow}</p>}
        <h2 className="text-3xl font-bold md:text-4xl">{title}</h2>
      </div>
      {action}
    </div>
  )
}

function TeamInitials({ name, muted }: { name: string | null; muted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-sm font-heading text-base font-bold',
        muted ? 'bg-secondary text-muted-foreground' : 'bg-surface text-surface-foreground',
      )}
    >
      {name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2) : '?'}
    </span>
  )
}

export function MatchCard({ match, children }: { match: Match; children?: React.ReactNode }) {
  const done = match.status === 'termine' && match.winnerId !== null
  const aWins = done && match.winnerId === match.teamAId
  const bWins = done && match.winnerId === match.teamBId
  const row = (name: string | null, score: number | null, win: boolean, lose: boolean) => (
    <div className="flex items-center gap-3">
      <TeamInitials name={name} muted={!name || lose} />
      <span className={cn('flex-1 truncate font-semibold', !name && 'italic text-muted-foreground', lose && 'text-muted-foreground')}>
        {name ?? 'À déterminer'}
      </span>
      <span className={cn('w-8 text-right font-heading text-2xl font-bold tabular-nums', win ? 'text-primary' : 'text-muted-foreground')}>
        {score ?? '–'}
      </span>
    </div>
  )
  return (
    <article
      className={cn(
        'flex flex-col gap-4 rounded-md border bg-card p-4',
        match.status === 'en-cours' ? 'border-primary shadow-[0_0_0_1px_var(--primary)]' : 'border-border',
      )}
      aria-label={`${match.roundLabel} : ${match.teamA ?? 'À déterminer'} contre ${match.teamB ?? 'À déterminer'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{match.roundLabel}</span>
        <StatusBadge status={match.status} />
      </div>
      <div className="flex flex-col gap-2">
        {row(match.teamA, match.scoreA, aWins, bWins)}
        <div className="flex items-center gap-2 pl-[3.25rem]" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="font-heading text-xs font-bold text-muted-foreground">VS</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        {row(match.teamB, match.scoreB, bWins, aWins)}
      </div>
      {(match.map || match.time) && (
        <div className="flex items-center justify-between border-t border-border pt-3 text-sm text-muted-foreground">
          {match.map ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden="true" />
              {match.map}
            </span>
          ) : <span />}
          {match.time && <span className="font-medium">{match.time}</span>}
        </div>
      )}
      {children}
    </article>
  )
}

export function PlayerCard({ player, compact }: { player: Player; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-sm', compact ? 'py-1.5' : 'border border-border bg-card p-3')}>
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold">
        {player.pseudo[0]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate font-semibold">
          {player.pseudo}
          {player.role === 'Capitaine' && (
            <Crown className="size-3.5 text-primary" aria-label="Capitaine" />
          )}
        </p>
        {player.riotId && <p className="truncate text-sm text-muted-foreground">{player.riotId}</p>}
      </div>
      <span
        className={cn(
          'shrink-0 rounded-sm px-2 py-0.5 text-xs font-semibold',
          player.level === 'Fort' && 'bg-primary text-primary-foreground',
          player.level === 'Intermédiaire' && 'bg-surface text-surface-foreground',
          player.level === 'Débutant' && 'border border-input bg-secondary text-foreground',
        )}
      >
        <span className="sr-only">Niveau : </span>
        {player.level}
      </span>
    </div>
  )
}

export function TeamCard({ team, size, children }: { team: Team; size: number; children?: React.ReactNode }) {
  const complete = team.players.length >= size
  return (
    <article className="flex flex-col overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center bg-primary font-heading text-lg font-extrabold text-primary-foreground [clip-path:polygon(0_0,100%_0,100%_75%,75%_100%,0_100%)]">
          {team.tag}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-bold">{team.name}</h3>
          <p className="text-sm text-muted-foreground">{team.seed ? `Seed #${team.seed} · ` : ''}Cap. {team.captain}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-4 py-3">
        {team.players.map((pl) => <PlayerCard key={pl.id} player={pl} compact />)}
        {Array.from({ length: Math.max(0, size - team.players.length) }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5 text-muted-foreground">
            <span aria-hidden="true" className="size-9 rounded-full border border-dashed border-input" />
            <span className="text-sm italic">Place libre</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
        {complete ? (
          <span className="text-sm font-semibold text-foreground">
            Équipe complète <span className="text-muted-foreground">({team.players.length}/{size})</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[#ff7a85]">
            <AlertTriangle className="size-4" aria-hidden="true" />
            Incomplète ({team.players.length}/{size})
          </span>
        )}
        {children}
      </div>
    </article>
  )
}
