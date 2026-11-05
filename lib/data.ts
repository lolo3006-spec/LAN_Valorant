// Types partagés et contenus statiques.
// Les données du tournoi (équipes, matchs, inscrits) viennent maintenant de Supabase : voir lib/api.ts

export type Format = '1v1' | '2v2' | '4v4' | '5v5'
export type MatchStatus = 'a-venir' | 'en-cours' | 'en-attente' | 'termine'
export type Level = 'Débutant' | 'Intermédiaire' | 'Fort'
export type TournamentStatus = 'brouillon' | 'inscriptions' | 'cloture' | 'en_cours' | 'termine'

export const levels: { value: Level; description: string }[] = [
  { value: 'Débutant', description: 'Je découvre le jeu' },
  { value: 'Intermédiaire', description: 'Je joue régulièrement' },
  { value: 'Fort', description: 'Je joue en compétitif' },
]

export type Player = {
  id: string
  pseudo: string
  riotId: string | null
  level: Level
  role: 'Joueur' | 'Capitaine'
}

export type Team = {
  id: string
  name: string
  tag: string
  captain: string
  captainId: string | null
  players: Player[]
  seed: number | null
}

export type Match = {
  id: string
  round: number
  roundLabel: string
  teamA: string | null
  teamB: string | null
  teamAId: string | null
  teamBId: string | null
  captainAId: string | null
  captainBId: string | null
  scoreA: number | null
  scoreB: number | null
  status: MatchStatus
  winnerId: string | null
  forfeit: boolean
  bye: boolean
  map?: string
  time?: string
  /** horaire « HH:MM » pour le formulaire de planification */
  rawTime?: string
}

export type Tournament = {
  id: string
  name: string
  date: string
  location: string
  format: Format
  status: TournamentStatus
  statusLabel: string
  maxTeams: number
  maxPlayers: number
  closesIn: string | null
}

export const formats: { value: Format; label: string; description: string; size: number }[] = [
  { value: '1v1', label: '1v1', description: 'Duel pur. Un joueur, un vainqueur.', size: 1 },
  { value: '2v2', label: '2v2', description: 'Duo coordonné, rounds rapides.', size: 2 },
  { value: '4v4', label: '4v4', description: 'Esprit d’équipe et stratégie.', size: 4 },
  { value: '5v5', label: '5v5', description: 'Format complet, cinq joueurs par équipe.', size: 5 },
]

export const steps = [
  { n: '01', title: 'Inscription', text: 'Nom, prénom, e-mail et niveau : confirmation immédiate.' },
  { n: '02', title: 'Équipes', text: 'Les équipes sont formées et équilibrées selon les niveaux.' },
  { n: '03', title: 'Bracket', text: 'Élimination directe générée automatiquement.' },
  { n: '04', title: 'Scores', text: 'Saisis par le capitaine, validés par l’organisation.' },
]

export const formatSize = (f: Format) => formats.find((x) => x.value === f)?.size ?? 2

// Cartes Valorant proposées lors de la planification d'un match
export const valorantMaps = [
  'Abyss', 'Ascent', 'Bind', 'Breeze', 'Corrode', 'Fracture', 'Haven', 'Icebox', 'Lotus', 'Pearl', 'Split', 'Sunset',
]
