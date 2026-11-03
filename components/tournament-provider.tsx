'use client'

// Charge le tournoi, les équipes, les agents libres et les matchs depuis Supabase,
// et les tient à jour EN DIRECT (Supabase Realtime + rafraîchissement de secours).
// Fournit aussi un petit système de notifications (toasts) et un helper `run`
// pour exécuter une action avec gestion d'erreur.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase, supabaseConfigured, messageErreur } from '@/lib/supabase'
import { fetchFreeAgents, fetchMatches, fetchRegisteredIds, fetchTeams, fetchTournament } from '@/lib/api'
import type { Match, Player, Team, Tournament } from '@/lib/data'
import { useRole } from '@/components/role-provider'

type Toast = { id: number; type: 'ok' | 'erreur'; text: string }

type Ctx = {
  tournament: Tournament | null
  teams: Team[]
  freeAgents: Player[]
  matches: Match[]
  registeredIds: string[]
  playerCount: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  notify: (text: string, type?: Toast['type']) => void
  /** Exécute une action, affiche l'erreur éventuelle, rafraîchit les données. Renvoie true si OK. */
  run: (action: () => Promise<unknown>, success?: string) => Promise<boolean>
  busy: boolean
  // infos sur le joueur connecté
  isRegistered: boolean
  myTeam: Team | null
}

const TournamentContext = createContext<Ctx | null>(null)

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const { profil } = useRole()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [freeAgents, setFreeAgents] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [registeredIds, setRegisteredIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const notify = useCallback((text: string, type: Toast['type'] = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, type, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === 'erreur' ? 7000 : 4000)
  }, [])

  const refresh = useCallback(async () => {
    if (!supabaseConfigured) {
      setError('Supabase n’est pas configuré : ajoute NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      setLoading(false)
      return
    }
    try {
      const t = await fetchTournament()
      setTournament(t)
      if (t) {
        const [eq, fa, ma, ids] = await Promise.all([
          fetchTeams(t.id),
          fetchFreeAgents(t.id),
          fetchMatches(t.id),
          fetchRegisteredIds(t.id),
        ])
        setTeams(eq)
        setFreeAgents(fa)
        setMatches(ma)
        setRegisteredIds(ids)
      } else {
        setTeams([])
        setFreeAgents([])
        setMatches([])
        setRegisteredIds([])
      }
      setError(null)
    } catch (e) {
      setError(messageErreur(e))
    } finally {
      setLoading(false)
    }
  }, [])

  // Regroupe les rafraîchissements quand plusieurs changements arrivent d'un coup
  const scheduleRefresh = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => refresh(), 300)
  }, [refresh])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Temps réel : toute modification en base rafraîchit l'affichage
  useEffect(() => {
    if (!supabaseConfigured) return
    const channel = supabase
      .channel('lan-valorant-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matchs' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipes' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'membres_equipe' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inscriptions' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournois' }, scheduleRefresh)
      .subscribe()
    // Secours si le temps réel est coupé : rafraîchit toutes les 20 s
    const poll = setInterval(refresh, 20_000)
    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [refresh, scheduleRefresh])

  const run = useCallback(
    async (action: () => Promise<unknown>, success?: string) => {
      setBusy(true)
      try {
        await action()
        if (success) notify(success)
        await refresh()
        return true
      } catch (e) {
        notify(messageErreur(e), 'erreur')
        return false
      } finally {
        setBusy(false)
      }
    },
    [notify, refresh],
  )

  const value = useMemo<Ctx>(() => {
    const myTeam = profil ? teams.find((t) => t.players.some((p) => p.id === profil.id)) ?? null : null
    return {
      tournament,
      teams,
      freeAgents,
      matches,
      registeredIds,
      playerCount: registeredIds.length,
      loading,
      error,
      refresh,
      notify,
      run,
      busy,
      isRegistered: profil ? registeredIds.includes(profil.id) : false,
      myTeam,
    }
  }, [tournament, teams, freeAgents, matches, registeredIds, loading, error, refresh, notify, run, busy, profil])

  return (
    <TournamentContext.Provider value={value}>
      {error && (
        <div role="alert" className="border-b border-primary/60 bg-accent px-4 py-3 text-center text-sm font-semibold">
          {error}
        </div>
      )}
      {children}
      <div aria-live="polite" className="fixed inset-x-4 bottom-20 z-50 flex flex-col items-end gap-2 md:bottom-6 md:right-6 md:left-auto">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'erreur' ? 'alert' : 'status'}
            className={cn(
              'flex max-w-md items-start gap-3 rounded-md border p-3 text-sm font-semibold shadow-lg',
              t.type === 'erreur' ? 'border-primary bg-[#2a1216] text-[#ffb3ba]' : 'border-border bg-card text-foreground',
            )}
          >
            {t.type === 'erreur' ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            )}
            <span className="flex-1">{t.text}</span>
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </TournamentContext.Provider>
  )
}

export function useTournament() {
  const ctx = useContext(TournamentContext)
  if (!ctx) throw new Error('useTournament must be used inside TournamentProvider')
  return ctx
}
