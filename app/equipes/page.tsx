import type { Metadata } from 'next'
import { TeamsView } from '@/components/equipes/teams-view'

export const metadata: Metadata = { title: 'Équipes — LAN Valorant' }

export default function EquipesPage() {
  return <TeamsView />
}
