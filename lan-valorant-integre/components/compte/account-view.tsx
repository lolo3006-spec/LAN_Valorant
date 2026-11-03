'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { KeyRound, LogOut, ShieldCheck, ShieldOff, Trash2, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal, FormField, fieldClass } from '@/components/ui/modal'
import { useRole } from '@/components/role-provider'
import { useTournament } from '@/components/tournament-provider'
import { api, type CompteAdmin } from '@/lib/api'
import { supabase, messageErreur } from '@/lib/supabase'

const card = 'rounded-md border border-border bg-card p-5 md:p-6'

export function AccountView() {
  const router = useRouter()
  const { session, profil, isAdmin, loading, signOut } = useRole()
  const { tournament, isRegistered, run, busy } = useTournament()
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (loading) return <p className="text-muted-foreground">Chargement…</p>
  if (!session) {
    return (
      <div className={card}>
        <p className="mb-4">Connecte-toi pour gérer ton compte.</p>
        <Button size="cta" render={<Link href="/connexion" />} nativeButton={false}>Se connecter</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className={card} aria-labelledby="profil">
        <h2 id="profil" className="mb-4 text-2xl font-bold">Mon profil</h2>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
          <dt className="text-muted-foreground">Pseudo</dt><dd className="font-semibold">{profil?.pseudo}</dd>
          <dt className="text-muted-foreground">Nom</dt><dd className="font-semibold">{profil ? `${profil.prenom} ${profil.nom}` : '—'}</dd>
          <dt className="text-muted-foreground">E-mail</dt><dd className="font-semibold break-all">{profil?.email ?? session.user.email}</dd>
          <dt className="text-muted-foreground">Niveau</dt><dd className="font-semibold">{profil?.niveau}</dd>
          <dt className="text-muted-foreground">Rôle</dt><dd className="font-semibold">{isAdmin ? 'Organisateur' : 'Joueur'}</dd>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" render={<Link href="/nouveau-mot-de-passe" />} nativeButton={false}>
            <KeyRound aria-hidden="true" /> Changer de mot de passe
          </Button>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); router.push('/') }}>
            <LogOut aria-hidden="true" /> Se déconnecter
          </Button>
        </div>
      </section>

      {tournament && isRegistered && (
        <section className={card} aria-labelledby="desinscription">
          <h2 id="desinscription" className="mb-2 text-2xl font-bold">Inscription au tournoi</h2>
          <p className="mb-4 text-muted-foreground">
            Tu es inscrit à « {tournament.name} ». Te désinscrire te retire aussi de ton équipe ; ton compte est conservé.
          </p>
          <Button
            variant="outline"
            disabled={busy || tournament.status !== 'inscriptions'}
            onClick={() => {
              if (window.confirm('Te désinscrire du tournoi ?')) {
                run(() => api.seDesinscrire(tournament.id), 'Tu es désinscrit du tournoi.')
              }
            }}
          >
            <UserMinus aria-hidden="true" /> Me désinscrire du tournoi
          </Button>
          {tournament.status !== 'inscriptions' && (
            <p className="mt-2 text-sm text-muted-foreground">Les inscriptions sont fermées : contacte un organisateur.</p>
          )}
        </section>
      )}

      {isAdmin && <OrganizersSection />}

      <section className="rounded-md border border-destructive/60 bg-card p-5 md:p-6" aria-labelledby="suppression">
        <h2 id="suppression" className="mb-2 text-2xl font-bold">Supprimer mon compte</h2>
        <p className="mb-4 text-muted-foreground">
          Ton compte, ton profil, tes inscriptions et ta place dans ton équipe sont effacés définitivement.
          Les résultats des matchs déjà joués restent affichés, sans ton nom.
        </p>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2 aria-hidden="true" /> Supprimer mon compte
        </Button>
      </section>

      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </div>
  )
}

function DeleteAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { notify } = useTournament()
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  return (
    <Modal open={open} onClose={onClose} title="Supprimer mon compte">
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setPending(true)
          setError(null)
          try {
            await api.supprimerMonCompte()
            await supabase.auth.signOut({ scope: 'local' })
            notify('Ton compte a été supprimé.')
            router.push('/')
          } catch (err) {
            setError(messageErreur(err))
          } finally {
            setPending(false)
          }
        }}
      >
        <p>Cette action est <strong>définitive</strong>. Pour confirmer, tape <strong>SUPPRIMER</strong> ci-dessous.</p>
        <FormField id="confirm-delete" label="Confirmation">
          <input id="confirm-delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" className={fieldClass} />
        </FormField>
        {error && <p role="alert" className="text-sm font-bold text-destructive">{error}</p>}
        <Button type="submit" variant="destructive" size="lg" disabled={pending || confirm.trim().toUpperCase() !== 'SUPPRIMER'}>
          {pending ? 'Suppression…' : 'Supprimer définitivement'}
        </Button>
      </form>
    </Modal>
  )
}

// Organisateurs : donner ou retirer les droits d'organisateur
function OrganizersSection() {
  const router = useRouter()
  const { profil, refreshProfil, signOut } = useRole()
  const { notify } = useTournament()
  const [comptes, setComptes] = useState<CompteAdmin[] | null>(null)
  const [filtre, setFiltre] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const charger = useCallback(async () => {
    try { setComptes(await api.listeComptes()) } catch (e) { notify(messageErreur(e), 'erreur') }
  }, [notify])
  useEffect(() => { charger() }, [charger])

  const q = filtre.trim().toLowerCase()
  const visibles = (comptes ?? []).filter((c) =>
    !q || [c.pseudo, c.nom, c.prenom, c.email].some((v) => v?.toLowerCase().includes(q)),
  )

  return (
    <section className={card} aria-labelledby="organisateurs">
      <h2 id="organisateurs" className="mb-2 text-2xl font-bold">Organisateurs</h2>
      <p className="mb-4 text-muted-foreground">
        Les organisateurs peuvent planifier les matchs, valider les scores et gérer les équipes.
        Il reste toujours au moins un organisateur.
      </p>
      <input
        type="search"
        placeholder="Rechercher un joueur (pseudo, nom, e-mail)"
        aria-label="Rechercher un joueur"
        value={filtre}
        onChange={(e) => setFiltre(e.target.value)}
        className={`${fieldClass} mb-3`}
      />
      {comptes === null ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : (
        <ul className="divide-y divide-border">
          {visibles.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                <p className="font-semibold">
                  {c.pseudo}
                  {c.est_admin && <span className="ml-2 rounded-sm bg-primary px-1.5 py-0.5 text-xs font-bold uppercase text-primary-foreground">Orga</span>}
                </p>
                <p className="truncate text-sm text-muted-foreground">{c.prenom} {c.nom} · {c.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={c.est_admin ? 'ghost' : 'outline'}
                  size="sm"
                  disabled={busyId !== null}
                  onClick={async () => {
                    const msg = c.est_admin
                      ? `Retirer les droits d’organisateur à ${c.pseudo} ?`
                      : `Nommer ${c.pseudo} organisateur ?`
                    if (!window.confirm(msg)) return
                    setBusyId(c.id)
                    try {
                      await api.definirOrganisateur(c.id, !c.est_admin)
                      notify(c.est_admin ? `${c.pseudo} n’est plus organisateur.` : `${c.pseudo} est maintenant organisateur.`)
                      await charger()
                      if (c.id === profil?.id) await refreshProfil()
                    } catch (e) {
                      notify(messageErreur(e), 'erreur')
                    } finally {
                      setBusyId(null)
                    }
                  }}
                >
                  {c.est_admin ? <ShieldOff aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
                  {c.est_admin ? 'Retirer' : 'Nommer orga'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={busyId !== null}
                  onClick={async () => {
                    if (!window.confirm(`Supprimer définitivement le compte de ${c.pseudo} ? Cette action est irréversible.`)) return
                    setBusyId(c.id)
                    try {
                      await api.supprimerCompte(c.id)

                      if (c.id === profil?.id) {
                        await signOut()
                        notify('Ton compte a été supprimé.')
                        router.push('/')
                        return
                      }

                      notify(`${c.pseudo} a été supprimé.`)
                      await charger()
                    } catch (e) {
                      notify(messageErreur(e), 'erreur')
                    } finally {
                      setBusyId(null)
                    }
                  }}
                >
                  <Trash2 aria-hidden="true" />
                  Supprimer
                </Button>
              </div>
            </li>
          ))}
          {visibles.length === 0 && <li className="py-3 text-muted-foreground">Aucun joueur trouvé.</li>}
        </ul>
      )}
    </section>
  )
}
