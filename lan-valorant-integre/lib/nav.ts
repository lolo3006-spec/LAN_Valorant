import { Home, Swords, UserPlus, Users } from 'lucide-react'

export const navItems = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/inscription', label: 'Inscription', icon: UserPlus },
  { href: '/equipes', label: 'Équipes', icon: Users },
  { href: '/matchs', label: 'Matchs', icon: Swords },
]

export const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href)
