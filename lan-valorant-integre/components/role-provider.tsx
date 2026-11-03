'use client'

// Gère la connexion (Supabase Auth) et le rôle affiché.
// - Visiteur / joueur : vue « participant »
// - Organisateur (joueurs.est_admin = true) : vue « organisateur », avec possibilité
//   de basculer en vue participant pour vérifier ce que voient les joueurs.

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import type { Level } from '@/lib/data'

export type Role = 'participant' | 'organisateur'

export type Profil = {
  id: string
  nom: string
  prenom: string
  email: string
  pseudo: string
  riot_id: string | null
  niveau: Level
  est_admin: boolean
}

type Ctx = {
  role: Role
  setRole: (r: Role) => void
  session: Session | null
  profil: Profil | null
  isAdmin: boolean
  loading: boolean
  refreshProfil: () => Promise<void>
  signOut: () => Promise<void>
}

const RoleContext = createContext<Ctx | null>(null)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewAs, setViewAs] = useState<Role>('organisateur')

  const loadProfil = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfil(null)
      return
    }
    const { data } = await supabase.rpc('mon_profil')
    setProfil(((data as Profil[] | null) ?? [])[0] ?? null)
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false)
      return
    }
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadProfil(data.session)
      if (active) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!active) return
      setSession(s)
      // setTimeout : recommandé par Supabase pour ne pas bloquer le callback
      setTimeout(() => { if (active) loadProfil(s) }, 0)
    })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [loadProfil])

  const isAdmin = Boolean(profil?.est_admin)
  const role: Role = isAdmin ? viewAs : 'participant'

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole: setViewAs,
        session,
        profil,
        isAdmin,
        loading,
        refreshProfil: () => loadProfil(session),
        signOut: async () => {
          await supabase.auth.signOut()
        },
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used inside RoleProvider')
  return ctx
}

export const useAuth = useRole
