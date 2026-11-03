'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin, Play, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRole } from '@/components/role-provider'
import { useTournament } from '@/components/tournament-provider'

export function Hero() {
  const { role } = useRole()
  const isOrga = role === 'organisateur'
  const { tournament, playerCount, loading } = useTournament()
  if (!tournament) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-24 text-muted-foreground md:px-6">
        {loading ? 'Chargement du tournoi…' : 'Aucun tournoi pour le moment.'}
      </section>
    )
  }
  const inscriptionsOuvertes = tournament.status === 'inscriptions'
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <Image
        src="/images/lan-hero.png"
        alt=""
        fill
        priority
        className="-z-20 object-cover opacity-40"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/90 to-background/30" />
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 md:px-6 md:py-24 lg:py-28">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-sm bg-primary px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground">
            <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-primary-foreground" />
            {tournament.status}
          </span>
        </div>

        <div className="max-w-3xl">
          <h1 className="text-5xl font-extrabold leading-[0.95] sm:text-6xl lg:text-7xl">
            {isOrga ? (
              <>Pilotez le tournoi <span className="text-primary">en un clic</span></>
            ) : (
              <>Entre dans l’arène. <span className="text-primary">Prends le spike.</span></>
            )}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {isOrga
              ? 'Inscriptions, équipes, bracket à élimination directe et validation des scores : tout est centralisé pour éviter les erreurs le jour J.'
              : 'Inscris-toi en indiquant ton niveau, rejoins une équipe et suis tes matchs en direct pendant la LAN de l’école.'}
          </p>
        </div>

        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          <li className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" aria-hidden="true" />
            {tournament.date}
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            {tournament.location}
          </li>
          <li className="flex items-center gap-2">
            <Users className="size-4 text-primary" aria-hidden="true" />
            {tournament.maxPlayers} joueurs maximum
          </li>
        </ul>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {isOrga ? (
            <Button size="cta" render={<Link href="/matchs" />} nativeButton={false}>
              <Play aria-hidden="true" />
              {tournament.status === 'en_cours' || tournament.status === 'termine' ? 'Piloter les matchs' : 'Lancer le tournoi'}
            </Button>
          ) : inscriptionsOuvertes ? (
            <Button size="cta" render={<Link href="/inscription" />} nativeButton={false}>
              S’inscrire au tournoi
              <ArrowRight aria-hidden="true" />
            </Button>
          ) : (
            <Button size="cta" render={<Link href="/matchs" />} nativeButton={false}>
              Suivre les matchs
              <ArrowRight aria-hidden="true" />
            </Button>
          )}
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{playerCount}/{tournament.maxPlayers}</span> joueurs inscrits
            {tournament.closesIn && (
              <>
                {' '}· clôture dans <span className="font-bold text-foreground">{tournament.closesIn}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  )
}
