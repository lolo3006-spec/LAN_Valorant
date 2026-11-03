import type { Metadata } from 'next'
import { MatchesView } from '@/components/matchs/matches-view'

export const metadata: Metadata = { title: 'Matchs — LAN Valorant' }

export default function MatchsPage() {
  return <MatchesView />
}
