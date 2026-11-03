// Toutes les lectures / écritures vers Supabase sont regroupées ici.
import { supabase } from '@/lib/supabase'
import type { Format, Level, Match, MatchStatus, Player, Team, Tournament, TournamentStatus } from '@/lib/data'

// ---------------------------------------------------------------- lectures

const statusLabels: Record<TournamentStatus, string> = {
  brouillon: 'Bientôt',
  inscriptions: 'Inscriptions ouvertes',
  cloture: 'Inscriptions closes',
  en_cours: 'Tournoi en cours',
  termine: 'Tournoi terminé',
}

function delaiAvant(iso: string | null): string | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return null
  const h = Math.round(ms / 3_600_000)
  if (h < 1) return 'moins d’une heure'
  if (h < 48) return `${h} heure${h > 1 ? 's' : ''}`
  const j = Math.round(h / 24)
  return `${j} jours`
}

function dateLongue(d: string): string {
  const s = new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

type TournoiRow = {
  id: string; nom: string; date_evenement: string; lieu: string | null; format: Format
  statut: TournamentStatus; max_joueurs: number; max_equipes: number; fin_inscriptions: string | null
}

/** Le tournoi affiché = le plus récent */
export async function fetchTournament(): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tournois')
    .select('id, nom, date_evenement, lieu, format, statut, max_joueurs, max_equipes, fin_inscriptions')
    .order('date_evenement', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<TournoiRow>()
  if (error) throw error
  if (!data) return null
  return {
    id: data.id,
    name: data.nom,
    date: dateLongue(data.date_evenement),
    location: data.lieu ?? '',
    format: data.format,
    status: data.statut,
    statusLabel: statusLabels[data.statut],
    maxTeams: data.max_equipes,
    maxPlayers: data.max_joueurs,
    closesIn: data.statut === 'inscriptions' ? delaiAvant(data.fin_inscriptions) : null,
  }
}

type JoueurJson = { id: string; pseudo: string; riot_id: string | null; niveau: Level; capitaine: boolean }

export async function fetchTeams(tournoiId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('v_equipes')
    .select('id, nom, tag, seed, capitaine_id, capitaine_pseudo, joueurs, created_at')
    .eq('tournoi_id', tournoiId)
    .order('seed', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((e) => ({
    id: e.id,
    name: e.nom,
    tag: e.tag,
    seed: e.seed,
    captainId: e.capitaine_id,
    captain: e.capitaine_pseudo ?? '—',
    players: (e.joueurs as JoueurJson[]).map((j) => ({
      id: j.id,
      pseudo: j.pseudo,
      riotId: j.riot_id,
      level: j.niveau,
      role: j.capitaine ? 'Capitaine' : 'Joueur',
    })),
  }))
}

export async function fetchFreeAgents(tournoiId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('v_agents_libres')
    .select('id, pseudo, riot_id, niveau')
    .eq('tournoi_id', tournoiId)
    .order('created_at')
  if (error) throw error
  return (data ?? []).map((j) => ({ id: j.id, pseudo: j.pseudo, riotId: j.riot_id, level: j.niveau, role: 'Joueur' }))
}

/** Ids des joueurs inscrits (sert au compteur et à savoir si je suis inscrit) */
export async function fetchRegisteredIds(tournoiId: string): Promise<string[]> {
  const { data, error } = await supabase.from('inscriptions').select('joueur_id').eq('tournoi_id', tournoiId)
  if (error) throw error
  return (data ?? []).map((r) => r.joueur_id as string)
}

export async function fetchMatches(tournoiId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('v_matchs')
    .select('*')
    .eq('tournoi_id', tournoiId)
    .order('tour')
    .order('position')
  if (error) throw error
  return (data ?? []).map((m) => {
    const enAttente = m.statut === 'en-attente'
    return {
      id: m.id,
      round: m.tour,
      roundLabel: m.tour_libelle,
      teamA: m.equipe_a,
      teamB: m.equipe_b,
      teamAId: m.equipe_a_id,
      teamBId: m.equipe_b_id,
      captainAId: m.capitaine_a_id,
      captainBId: m.capitaine_b_id,
      // Score à valider : on affiche le score proposé par le capitaine
      scoreA: m.score_a ?? (enAttente ? m.score_propose_a : null),
      scoreB: m.score_b ?? (enAttente ? m.score_propose_b : null),
      status: m.statut as MatchStatus,
      winnerId: m.vainqueur_id,
      forfeit: m.forfait,
      bye: m.exempt,
      map: m.carte ?? undefined,
      // « 14:30:00 » → « 14:30 »
      time: m.forfait ? 'Forfait' : (m.horaire ? String(m.horaire).slice(0, 5) : undefined),
      rawTime: m.horaire ? String(m.horaire).slice(0, 5) : undefined,
    }
  })
}

// ---------------------------------------------------------------- actions
// Chaque action appelle une fonction SQL (supabase/schema.sql) qui vérifie les droits.

async function rpc<T = unknown>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw error
  return data as T
}

export type CompteAdmin = {
  id: string; nom: string; prenom: string; email: string; pseudo: string; est_admin: boolean
}

export const api = {
  // joueurs
  verifierInscription: (tournoi: string, email: string) =>
    rpc<string | null>('verifier_inscription', { p_tournoi: tournoi, p_email: email }),
  sInscrire: (tournoi: string) => rpc('s_inscrire', { p_tournoi: tournoi }),
  seDesinscrire: (tournoi: string) => rpc('se_desinscrire', { p_tournoi: tournoi }),
  creerEquipe: (tournoi: string, nom: string, tag: string) =>
    rpc<string>('creer_equipe', { p_tournoi: tournoi, p_nom: nom, p_tag: tag }),
  rejoindreEquipe: (equipe: string) => rpc('rejoindre_equipe', { p_equipe: equipe }),
  quitterEquipe: (equipe: string) => rpc('quitter_equipe', { p_equipe: equipe }),
  modifierEquipe: (equipe: string, nom: string, tag: string, seed: number | null) =>
    rpc('modifier_equipe', { p_equipe: equipe, p_nom: nom, p_tag: tag, p_seed: seed }),
  proposerScore: (match: string, a: number, b: number) =>
    rpc('proposer_score', { p_match: match, p_score_a: a, p_score_b: b }),
  supprimerMonCompte: () => rpc('supprimer_mon_compte'),

  // organisateurs
  cloturerInscriptions: (tournoi: string) =>
    rpc<{ equipe: string; joueurs: number; attendus: number }[]>('cloturer_inscriptions', { p_tournoi: tournoi }),
  rouvrirInscriptions: (tournoi: string) => rpc('rouvrir_inscriptions', { p_tournoi: tournoi }),
  equilibrer: (tournoi: string) => rpc<number>('equilibrer_agents_libres', { p_tournoi: tournoi }),
  affecterJoueur: (joueur: string, equipe: string) =>
    rpc('admin_affecter_joueur', { p_joueur: joueur, p_equipe: equipe }),
  retirerJoueur: (joueur: string, equipe: string) =>
    rpc('admin_retirer_joueur', { p_joueur: joueur, p_equipe: equipe }),
  lancerTournoi: (tournoi: string, forcer = false) =>
    rpc<number>('lancer_tournoi', { p_tournoi: tournoi, p_forcer: forcer }),
  reinitialiserBracket: (tournoi: string) => rpc('reinitialiser_bracket', { p_tournoi: tournoi }),
  lancerTourSuivant: (tournoi: string) => rpc<number>('lancer_tour_suivant', { p_tournoi: tournoi }),
  demarrerMatch: (match: string) => rpc('demarrer_match', { p_match: match }),
  validerScore: (match: string, a?: number, b?: number) =>
    rpc('valider_score', { p_match: match, p_score_a: a ?? null, p_score_b: b ?? null }),
  contesterScore: (match: string) => rpc('contester_score', { p_match: match }),
  declarerForfait: (match: string, equipeForfait: string) =>
    rpc('declarer_forfait', { p_match: match, p_equipe_forfait: equipeForfait }),
  planifierMatch: (match: string, horaire: string | null, carte: string | null) =>
    rpc('admin_planifier_match', { p_match: match, p_horaire: horaire, p_carte: carte }),
  listeComptes: () => rpc<CompteAdmin[]>('admin_liste_comptes'),
  definirOrganisateur: (joueur: string, admin: boolean) =>
    rpc('admin_definir_organisateur', { p_joueur: joueur, p_admin: admin }),
  supprimerCompte: (joueur: string) => rpc('admin_supprimer_compte', { p_joueur: joueur }),
  purgerDonnees: (tournoi: string) => rpc<number>('purger_donnees_personnelles', { p_tournoi: tournoi }),
}
