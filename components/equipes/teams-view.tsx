'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lock, LogOut, Play, Plus, Scale, SlidersHorizontal, Trash2, Unlock, UserMinus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal, FormField, fieldClass } from '@/components/ui/modal'
import { useRole } from '@/components/role-provider'
import { useTournament } from '@/components/tournament-provider'
import { PlayerCard, SectionTitle, TeamCard } from '@/components/cards'
import { api } from '@/lib/api'
import { formatSize, formats, type Format, type Player, type Team } from '@/lib/data'

export function TeamsView() {
  const { role, session } = useRole()
  const { tournament, teams, freeAgents, run, busy, isRegistered, myTeam, loading, notify } = useTournament()
  const isOrga = role === 'organisateur'
  const [createOpen, setCreateOpen] = useState(false)
  const [formatOpen, setFormatOpen] = useState(false)
  const [editTeam, setEditTeam] = useState<Team | null>(null)
  const [assignPlayer, setAssignPlayer] = useState<Player | null>(null)

  if (!tournament) {
    return <main className="mx-auto max-w-7xl px-4 py-14 text-muted-foreground md:px-6">{loading ? 'Chargement…' : 'Aucun tournoi.'}</main>
  }

  const size = formatSize(tournament.format)
  const incomplete = teams.filter((t) => t.players.length < size).length
  const ouvert = tournament.status === 'inscriptions'
  const avantLancement = tournament.status === 'inscriptions' || tournament.status === 'cloture' || tournament.status === 'brouillon'
  const peutRejoindre = Boolean(session && isRegistered && !myTeam && ouvert)

  const cloturer = () =>
    run(async () => {
      const incompletes = await api.cloturerInscriptions(tournament.id)
      if (incompletes.length > 0) {
        notify(
          `Inscriptions closes. Équipes incomplètes à alerter : ${incompletes.map((e) => `${e.equipe} (${e.joueurs}/${e.attendus})`).join(', ')}`,
          'erreur',
        )
      } else {
        notify('Inscriptions closes : liste des équipes définitive.')
      }
    })

  const lancer = () => {
    const forcer = teams.some((t) => t.players.length > 0 && t.players.length < size)
    if (forcer && !window.confirm('Des équipes sont incomplètes. Lancer le tournoi quand même ?')) return
    run(() => api.lancerTournoi(tournament.id, forcer), 'Tournoi lancé : bracket généré !')
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-10 flex flex-col gap-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ff7a85]">
            Format {tournament.format} · {teams.length}/{tournament.maxTeams} équipes · {tournament.statusLabel}
          </p>
          <h1 className="text-5xl font-extrabold leading-none md:text-6xl">Équipes</h1>
          {incomplete > 0 && avantLancement && (
            <p className="mt-3 text-muted-foreground">
              <span className="font-bold text-[#ff7a85]">{incomplete} équipe{incomplete > 1 ? 's' : ''} incomplète{incomplete > 1 ? 's' : ''}</span>{' '}
              — elles seront alertées à la clôture.
            </p>
          )}
        </div>

        {isOrga ? (
          <div className="flex w-full flex-wrap justify-end gap-2">
            {avantLancement && (
              <Button size="cta" variant="outline" onClick={() => setFormatOpen(true)} disabled={busy}>
                <SlidersHorizontal aria-hidden="true" />
                Changer le format
              </Button>
            )}
            <Button size="cta" variant="outline" onClick={() => setCreateOpen(true)} disabled={busy}>
              <Plus aria-hidden="true" />
              Créer une équipe
            </Button>
            {ouvert && (
              <Button size="cta" onClick={cloturer} disabled={busy}>
                <Lock aria-hidden="true" />
                Clôturer les inscriptions
              </Button>
            )}
            {tournament.status === 'cloture' && (
              <>
                <Button size="cta" variant="outline" onClick={() => run(() => api.rouvrirInscriptions(tournament.id), 'Inscriptions rouvertes.')} disabled={busy}>
                  <Unlock aria-hidden="true" />
                  Rouvrir
                </Button>
                <Button size="cta" onClick={lancer} disabled={busy}>
                  <Play aria-hidden="true" />
                  Lancer le tournoi
                </Button>
              </>
            )}
            {!avantLancement && (
              <Button size="cta" render={<Link href="/matchs" />} nativeButton={false}>
                <Play aria-hidden="true" />
                Piloter les matchs
              </Button>
            )}
          </div>
        ) : myTeam ? (
          ouvert && (
            <Button size="cta" variant="outline" disabled={busy} onClick={() => run(() => api.quitterEquipe(myTeam.id), `Tu as quitté ${myTeam.name}.`)}>
              <LogOut aria-hidden="true" />
              Quitter mon équipe
            </Button>
          )
        ) : !session ? (
          ouvert && (
            <Button size="cta" render={<Link href="/inscription" />} nativeButton={false}>
              <Plus aria-hidden="true" />
              Créer une équipe
            </Button>
          )
        ) : (
          ouvert && (
            <Button size="cta" onClick={() => setCreateOpen(true)} disabled={!isRegistered}>
              <Plus aria-hidden="true" />
              {isRegistered ? 'Créer une équipe' : 'Inscris-toi d’abord'}
            </Button>
          )
        )}
      </div>

      {teams.length === 0 ? (
        <p className="text-muted-foreground">Aucune équipe pour l’instant. Sois le premier à en créer une !</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teams.map((t) => (
            <TeamCard key={t.id} team={t} size={size}>
              {isOrga ? (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditTeam(t)}>Modifier</Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    aria-label={`Supprimer l’équipe ${t.name}`}
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`Supprimer définitivement l’équipe ${t.name} ? Les joueurs resteront inscrits au tournoi.`)) {
                        run(() => api.adminSupprimerEquipe(t.id), `${t.name} a été supprimée.`)
                      }
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              ) : t.players.length < size && ouvert ? (
                session ? (
                  peutRejoindre && (
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => run(() => api.rejoindreEquipe(t.id), `Bienvenue dans ${t.name} !`)}>
                      Rejoindre
                    </Button>
                  )
                ) : (
                  <Button variant="outline" size="sm" render={<Link href="/connexion" />} nativeButton={false}>Rejoindre</Button>
                )
              ) : myTeam?.id === t.id && myTeam.captainId === session?.user.id ? (
                <Button variant="ghost" size="sm" onClick={() => setEditTeam(t)}>Renommer</Button>
              ) : null}
            </TeamCard>
          ))}
        </div>
      )}

      <section className="mt-14">
        <SectionTitle
          eyebrow="Agents libres"
          title="Joueurs sans équipe"
          action={
            isOrga && avantLancement && freeAgents.length > 0 ? (
              <Button variant="outline" onClick={() => run(async () => {
                const n = await api.equilibrer(tournament.id)
                if (n === 0) throw new Error('Aucune place libre dans les équipes existantes.')
              }, 'Joueurs répartis selon les niveaux.')} disabled={busy}>
                <Scale aria-hidden="true" />
                Équilibrer automatiquement
              </Button>
            ) : undefined
          }
        />
        {freeAgents.length === 0 ? (
          <p className="text-muted-foreground">Tous les inscrits ont une équipe.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {freeAgents.map((pl) => (
              <div key={pl.id} className="flex items-center gap-2">
                <div className="flex-1"><PlayerCard player={pl} /></div>
                {isOrga && avantLancement && (
                  <Button variant="outline" size="icon" aria-label={`Assigner ${pl.pseudo} à une équipe`} onClick={() => setAssignPlayer(pl)}>
                    <UserPlus aria-hidden="true" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <CreateTeamModal open={createOpen} onClose={() => setCreateOpen(false)} tournamentId={tournament.id} isOrga={isOrga} />
      <FormatModal
        open={formatOpen}
        onClose={() => setFormatOpen(false)}
        tournamentId={tournament.id}
        currentFormat={tournament.format}
      />
      <EditTeamModal team={editTeam} onClose={() => setEditTeam(null)} isOrga={isOrga} canEditPlayers={avantLancement} />
      <AssignModal player={assignPlayer} onClose={() => setAssignPlayer(null)} teams={teams.filter((t) => t.players.length < size)} />
    </main>
  )
}

function FormatModal({
  open,
  onClose,
  tournamentId,
  currentFormat,
}: {
  open: boolean
  onClose: () => void
  tournamentId: string
  currentFormat: Format
}) {
  const { run, busy, notify } = useTournament()
  return (
    <Modal open={open} onClose={onClose} title="Changer le format">
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          const value = new FormData(e.currentTarget).get('format')
          const selected = formats.find((option) => option.value === value)
          if (!selected) {
            notify('Format invalide.', 'erreur')
            return
          }
          const ok = await run(
            () => api.modifierFormatTournoi(tournamentId, selected.value),
            'Format du tournoi mis à jour.',
          )
          if (ok) onClose()
        }}
      >
        <FormField id="tournament-format" label="Format des équipes">
          <select id="tournament-format" name="format" defaultValue={currentFormat} className={fieldClass}>
            {formats.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label} — {format.description}
              </option>
            ))}
          </select>
        </FormField>
        <p className="text-sm text-muted-foreground">
          Modifiable avant le lancement. Les équipes déjà formées ne peuvent pas dépasser la nouvelle taille.
        </p>
        <Button type="submit" size="lg" disabled={busy}>Enregistrer</Button>
      </form>
    </Modal>
  )
}

function CreateTeamModal({ open, onClose, tournamentId, isOrga }: { open: boolean; onClose: () => void; tournamentId: string; isOrga: boolean }) {
  const { run, busy } = useTournament()
  return (
    <Modal open={open} onClose={onClose} title="Créer une équipe">
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          const d = new FormData(e.currentTarget)
          const ok = await run(
            () => isOrga
              ? api.adminCreerEquipe(tournamentId, String(d.get('nom')), String(d.get('tag')))
              : api.creerEquipe(tournamentId, String(d.get('nom')), String(d.get('tag'))),
            isOrga ? 'Équipe créée.' : 'Équipe créée : tu en es le capitaine !',
          )
          if (ok) onClose()
        }}
      >
        <FormField id="team-nom" label="Nom de l’équipe">
          <input id="team-nom" name="nom" required minLength={2} maxLength={40} placeholder="Ex. Phoenix Rising" className={fieldClass} />
        </FormField>
        <FormField id="team-tag" label="Tag (2 à 4 lettres ou chiffres)">
          <input id="team-tag" name="tag" required pattern="[A-Za-z0-9]{2,4}" maxLength={4} placeholder="PHX" className={`${fieldClass} uppercase`} />
        </FormField>
        <Button type="submit" size="lg" disabled={busy}>Créer l’équipe</Button>
      </form>
    </Modal>
  )
}

function EditTeamModal({ team, onClose, isOrga, canEditPlayers }: { team: Team | null; onClose: () => void; isOrga: boolean; canEditPlayers: boolean }) {
  const { run, busy } = useTournament()
  if (!team) return null
  return (
    <Modal open onClose={onClose} title={`Modifier ${team.name}`}>
      <form
        key={team.id}
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          const d = new FormData(e.currentTarget)
          const seed = String(d.get('seed') ?? '')
          const ok = await run(
            () => api.modifierEquipe(team.id, String(d.get('nom')), String(d.get('tag')), seed ? Number(seed) : null),
            'Équipe mise à jour.',
          )
          if (ok) onClose()
        }}
      >
        <FormField id="edit-nom" label="Nom">
          <input id="edit-nom" name="nom" defaultValue={team.name} required minLength={2} maxLength={40} className={fieldClass} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField id="edit-tag" label="Tag">
            <input id="edit-tag" name="tag" defaultValue={team.tag} required pattern="[A-Za-z0-9]{2,4}" maxLength={4} className={`${fieldClass} uppercase`} />
          </FormField>
          {isOrga && (
            <FormField id="edit-seed" label="Seed (tête de série)">
              <input id="edit-seed" name="seed" type="number" min={1} defaultValue={team.seed ?? ''} className={fieldClass} />
            </FormField>
          )}
        </div>
        <Button type="submit" size="lg" disabled={busy}>Enregistrer</Button>
      </form>

      {isOrga && canEditPlayers && team.players.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">Composition</h3>
          <ul className="flex flex-col gap-1">
            {team.players.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold">{p.pseudo} <span className="text-sm font-normal text-muted-foreground">· {p.level}</span></span>
                <Button
                  variant="destructive"
                  size="xs"
                  disabled={busy}
                  onClick={async () => {
                    const ok = await run(() => api.retirerJoueur(p.id, team.id), `${p.pseudo} retiré de l’équipe.`)
                    if (ok) onClose()
                  }}
                >
                  <UserMinus aria-hidden="true" />
                  Retirer
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  )
}

function AssignModal({ player, onClose, teams }: { player: Player | null; onClose: () => void; teams: Team[] }) {
  const { run, busy } = useTournament()
  if (!player) return null
  return (
    <Modal open onClose={onClose} title={`Assigner ${player.pseudo}`}>
      {teams.length === 0 ? (
        <p className="text-muted-foreground">Toutes les équipes sont complètes.</p>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            const equipe = String(new FormData(e.currentTarget).get('equipe'))
            const ok = await run(() => api.affecterJoueur(player.id, equipe), `${player.pseudo} a rejoint son équipe.`)
            if (ok) onClose()
          }}
        >
          <FormField id="assign-team" label="Équipe (incomplètes uniquement)">
            <select id="assign-team" name="equipe" required className={fieldClass}>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.players.length} joueur{t.players.length > 1 ? 's' : ''})</option>
              ))}
            </select>
          </FormField>
          <Button type="submit" size="lg" disabled={busy}>Assigner</Button>
        </form>
      )}
    </Modal>
  )
}
