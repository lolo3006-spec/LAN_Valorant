'use client'

import Link from 'next/link'
import { LogIn, LogOut, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRole } from '@/components/role-provider'

// Bouton « Connexion » ou pseudo + déconnexion
export function AccountMenu() {
  const { session, profil, loading, signOut } = useRole()
  if (loading) return null
  if (!session) {
    return (
      <Button variant="outline" size="sm" render={<Link href="/connexion" />} nativeButton={false}>
        <LogIn aria-hidden="true" />
        <span className="hidden sm:inline">Connexion</span>
      </Button>
    )
  }
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" render={<Link href="/compte" />} nativeButton={false} title="Mon compte">
        <UserRound aria-hidden="true" />
        <span className="hidden max-w-32 truncate lg:inline">{profil?.pseudo ?? 'Mon compte'}</span>
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={signOut} aria-label="Se déconnecter" title="Se déconnecter">
        <LogOut aria-hidden="true" />
      </Button>
    </div>
  )
}
