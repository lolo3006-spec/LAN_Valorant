import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Inter } from 'next/font/google'
import { RoleProvider } from '@/components/role-provider'
import { TournamentProvider } from '@/components/tournament-provider'
import { SiteHeader } from '@/components/site-header'
import { MobileNav } from '@/components/mobile-nav'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-barlow',
})

export const metadata: Metadata = {
  title: 'LAN Valorant — Gestion de tournoi',
  description:
    'Inscriptions, équipes, bracket et scores en direct pour le tournoi Valorant LAN de l’école (1v1, 2v2, 4v4, 5v5).',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0e0f12',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${barlow.variable}`}>
      <body className="min-h-dvh antialiased">
        <RoleProvider>
          <TournamentProvider>
            <SiteHeader />
            <div className="pb-20 md:pb-0">{children}</div>
            <MobileNav />
          </TournamentProvider>
        </RoleProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
