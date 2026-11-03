'use client'

import { useState } from 'react'
import { CalendarClock, CheckCircle2, Flag, Gavel, Pencil, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal, FormField, fieldClass } from '@/components/ui/modal'
import { useRole } from '@/components/role-provider'
import { useTournament } from '@/components/tournament-provider'
import { MatchCard, SectionTitle } from '@/components/cards'
import { Bracket } from '@/components/matchs/bracket'
import { api } from '@/lib/api'
import { formatSize, valorantMaps, type Match } from '@/lib/data'

export function MatchesView() {
  const { role, session } = useRole()
  const { tournament, matches, run, busy, teams, loading } = useTournament()
  const isOrga = role === 'organisateur'
  const [proposeOpen, setProposeOpen] = useState(false)
  const [arbitrate, setArbitrate] = useState<Match | null>(null)
  const [schedule, setSchedule] = useState<Match | null>(null)

  if (!tournament) {
    return <main className="mx-auto max-w-7xl px-4 py-14 text-muted-foreground md:px-6">{loading ? 'Chargement…' : 'Aucun tournoi.'}</main>
  }

  const pending = matches.filter((m) => m.status === 'en-attente')
  const visibles = matches.filter((m) => !m.bye)
  const userId = session?.user.id
  // Matchs où je suis capitaine et où je peux proposer un score
  const mesMatchs = visibles.filter(
    (m) =>
      userId &&
      (m.captainAId === userId || m.captainBId === userId) &&
      m.teamAId && m.teamBId &&
      (m.status === 'a-venir' || m.status === 'en-cours'),
  )
  const avantLancement = matches.length === 0

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ff7a85]">
            Élimination directe · {tournament.format} · {tournament.statusLabel}
          </p>
          <h1 className="text-5xl font-extrabold leading-none md:text-6xl">Matchs</h1>
          <p className="mt-3 text-muted-foreground">Scores mis à jour en direct, sans recharger la page.</p>
        </div>
        {isOrga ? (
          <div className="flex flex-wrap gap-2">
            {avantLancement ? (
              <Button
                size="cta"
                disabled={busy || teams.length < 2}
                onClick={() => {
                  const forcer = teams.some((t) => t.players.length > 0 && t.players.length < formatSize(tournament.format))
                  if (forcer && !window.confirm('Des équipes sont incomplètes. Lancer le tournoi quand même ?')) return
                  run(() => api.lancerTournoi(tournament.id, forcer), 'Tournoi lancé : bracket généré !')
                }}
              >
                <Play aria-hidden="true" />
                Lancer le tournoi
              </Button>
            ) : (
              <>
                {tournament.status === 'termine' && (
                  <Button
                    size="cta"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm('RGPD : supprimer définitivement les comptes des joueurs (noms, e-mails) ? Les résultats sont conservés.')) {
                        run(() => api.purgerDonnees(tournament.id), 'Données personnelles supprimées.')
                      }
                    }}
                  >
                    Supprimer les données (RGPD)
                  </Button>
                )}
                {tournament.status !== 'termine' && (
                  <Button
                    size="cta"
                    disabled={busy}
                    onClick={() =>
                      run(() => api.lancerTourSuivant(tournament.id), 'Matchs lancés : ils sont en direct !')
                    }
                  >
                    <Play aria-hidden="true" />
                    Lancer le tour suivant
                  </Button>
                )}
                <Button
                  size="cta"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm('Supprimer tout le bracket et les scores ? (les équipes sont conservées)')) {
                      run(() => api.reinitialiserBracket(tournament.id), 'Bracket supprimé.')
                    }
                  }}
                >
                  <RotateCcw aria-hidden="true" />
                  Réinitialiser
                </Button>
              </>
            )}
          </div>
        ) : (
          mesMatchs.length > 0 && (
            <Button size="cta" onClick={() => setProposeOpen(true)}>
              <Pencil aria-hidden="true" />
              Proposer un score
            </Button>
          )
        )}
      </div>

      {isOrga && pending.length > 0 && (
        <section aria-labelledby="validation" className="mb-14 rounded-md border border-primary/60 bg-accent p-5 md:p-6">
          <h2 id="validation" className="text-2xl font-bold">
            Scores en attente de validation <span className="text-primary">({pending.length})</span>
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-bold">Tour</th>
                  <th scope="col" className="py-2 pr-4 font-bold">Match</th>
                  <th scope="col" className="py-2 pr-4 font-bold">Score proposé</th>
                  <th scope="col" className="py-2 font-bold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((m) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="py-3 pr-4 font-semibold">{m.roundLabel}</td>
                    <td className="py-3 pr-4">{m.teamA} <span className="text-muted-foreground">vs</span> {m.teamB}</td>
                    <td className="py-3 pr-4 font-heading text-xl font-bold tabular-nums">{m.scoreA} – {m.scoreB}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" disabled={busy} onClick={() => run(() => api.contesterScore(m.id), 'Score contesté : le match repasse en cours.')}>
                          Contester
                        </Button>
                        <Button variant="secondary" size="sm" disabled={busy} onClick={() => run(() => api.validerScore(m.id), 'Score validé : le vainqueur passe au tour suivant.')}>
                          <CheckCircle2 aria-hidden="true" />
                          Valider
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mb-14">
        <SectionTitle eyebrow="Tous les matchs" title="Programme" />
        {visibles.length === 0 ? (
          <p className="text-muted-foreground">Les matchs apparaîtront ici dès le lancement du tournoi.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibles.map((m) => (
              <MatchCard key={m.id} match={m}>
                {isOrga && m.status !== 'termine' && (
                  <Button variant="outline" size="sm" className="mb-2 w-full" onClick={() => setSchedule(m)}>
                    <CalendarClock aria-hidden="true" />
                    {m.time || m.map ? 'Modifier l’horaire / la carte' : 'Planifier'}
                  </Button>
                )}
                {isOrga && m.teamAId && m.teamBId && (
                  <div className="flex gap-2">
                    {m.status === 'a-venir' && (
                      <Button variant="outline" size="sm" className="flex-1" disabled={busy} onClick={() => run(() => api.demarrerMatch(m.id), 'Match lancé.')}>
                        <Play aria-hidden="true" />
                        Démarrer
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => setArbitrate(m)}>
                      <Gavel aria-hidden="true" />
                      {m.status === 'termine' ? 'Corriger' : 'Arbitrer'}
                    </Button>
                  </div>
                )}
              </MatchCard>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle eyebrow="Tableau" title="Bracket" />
        <Bracket matches={matches} />
      </section>

      <ProposeScoreModal open={proposeOpen} onClose={() => setProposeOpen(false)} matches={mesMatchs} />
      <ArbitrateModal match={arbitrate} onClose={() => setArbitrate(null)} />
      <ScheduleModal match={schedule} onClose={() => setSchedule(null)} />
    </main>
  )
}

function ScoreInputs({ match, defaults }: { match: Match; defaults?: [number | null, number | null] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField id={`sa-${match.id}`} label={match.teamA ?? 'Équipe A'}>
        <input id={`sa-${match.id}`} name="a" type="number" min={0} max={99} required defaultValue={defaults?.[0] ?? ''} className={`${fieldClass} text-center font-heading text-2xl font-bold`} />
      </FormField>
      <FormField id={`sb-${match.id}`} label={match.teamB ?? 'Équipe B'}>
        <input id={`sb-${match.id}`} name="b" type="number" min={0} max={99} required defaultValue={defaults?.[1] ?? ''} className={`${fieldClass} text-center font-heading text-2xl font-bold`} />
      </FormField>
    </div>
  )
}

function ProposeScoreModal({ open, onClose, matches }: { open: boolean; onClose: () => void; matches: Match[] }) {
  const { run, busy } = useTournament()
  const [selected, setSelected] = useState<string | null>(null)
  const match = matches.find((m) => m.id === selected) ?? matches[0]
  if (!match) return null
  return (
    <Modal open={open} onClose={onClose} title="Proposer un score">
      <form
        key={match.id}
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          const d = new FormData(e.currentTarget)
          const ok = await run(
            () => api.proposerScore(match.id, Number(d.get('a')), Number(d.get('b'))),
            'Score envoyé : en attente de validation par l’organisation.',
          )
          if (ok) onClose()
        }}
      >
        {matches.length > 1 && (
          <FormField id="propose-match" label="Match">
            <select id="propose-match" value={match.id} onChange={(e) => setSelected(e.target.value)} className={fieldClass}>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>{m.roundLabel} : {m.teamA} vs {m.teamB}</option>
              ))}
            </select>
          </FormField>
        )}
        <ScoreInputs match={match} />
        <p className="text-sm text-muted-foreground">Le score sera visible comme « à valider » jusqu’à la validation par un organisateur.</p>
        <Button type="submit" size="lg" disabled={busy}>Envoyer le score</Button>
      </form>
    </Modal>
  )
}

function ArbitrateModal({ match, onClose }: { match: Match | null; onClose: () => void }) {
  const { run, busy } = useTournament()
  if (!match) return null
  const close = (ok: boolean) => ok && onClose()
  return (
    <Modal open onClose={onClose} title={`${match.roundLabel} : arbitrage`}>
      <form
        key={match.id}
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          const d = new FormData(e.currentTarget)
          close(await run(() => api.validerScore(match.id, Number(d.get('a')), Number(d.get('b'))), 'Score enregistré et validé.'))
        }}
      >
        <ScoreInputs match={match} defaults={[match.scoreA, match.scoreB]} />
        <Button type="submit" size="lg" disabled={busy}>
          <CheckCircle2 aria-hidden="true" />
          Valider ce score
        </Button>
      </form>
      <div className="mt-6 border-t border-border pt-4">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">Forfait</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            [match.teamAId, match.teamA],
            [match.teamBId, match.teamB],
          ].map(([id, name]) => (
            <Button
              key={id}
              variant="destructive"
              size="sm"
              disabled={busy || !id}
              onClick={async () => {
                if (!id || !window.confirm(`Déclarer ${name} forfait ?`)) return
                close(await run(() => api.declarerForfait(match.id, id), `${name} déclaré forfait.`))
              }}
            >
              <Flag aria-hidden="true" />
              <span className="truncate">{name} forfait</span>
            </Button>
          ))}
        </div>
      </div>
    </Modal>
  )
}

// Organisateur : fixer l'horaire et la carte d'un match
function ScheduleModal({ match, onClose }: { match: Match | null; onClose: () => void }) {
  const { run, busy } = useTournament()
  if (!match) return null
  const titre = `${match.teamA ?? 'À déterminer'} vs ${match.teamB ?? 'À déterminer'}`
  return (
    <Modal open onClose={onClose} title={`${match.roundLabel} : planifier`}>
      <p className="mb-4 text-sm text-muted-foreground">{titre}</p>
      <form
        key={match.id}
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          const d = new FormData(e.currentTarget)
          const horaire = String(d.get('horaire') ?? '').trim() || null
          const carte = String(d.get('carte') ?? '').trim() || null
          const ok = await run(() => api.planifierMatch(match.id, horaire, carte), 'Match planifié.')
          if (ok) onClose()
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField id={`horaire-${match.id}`} label="Horaire">
            <input id={`horaire-${match.id}`} name="horaire" type="time" defaultValue={match.rawTime ?? ''} className={fieldClass} />
          </FormField>
          <FormField id={`carte-${match.id}`} label="Carte" hint="Choisis ou saisis une carte">
            <input id={`carte-${match.id}`} name="carte" list="cartes-valorant" defaultValue={match.map ?? ''} maxLength={30} className={fieldClass} />
            <datalist id="cartes-valorant">
              {valorantMaps.map((c) => <option key={c} value={c} />)}
            </datalist>
          </FormField>
        </div>
        <p className="text-sm text-muted-foreground">Laisse un champ vide pour l’effacer. Les joueurs voient la mise à jour en direct.</p>
        <Button type="submit" size="lg" disabled={busy}>
          <CalendarClock aria-hidden="true" />
          Enregistrer
        </Button>
      </form>
    </Modal>
  )
}
