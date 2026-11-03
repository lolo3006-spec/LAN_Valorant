import { Hero } from '@/components/home/hero'
import { CurrentMatches } from '@/components/home/current-matches'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <CurrentMatches />

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground md:flex-row md:justify-between md:px-6">
          <p>Projet d’école — LAN Valorant. Les matchs se jouent en parties personnalisées.</p>
          <p>Données personnelles supprimées après l’événement (RGPD).</p>
        </div>
      </footer>
    </main>
  )
}
