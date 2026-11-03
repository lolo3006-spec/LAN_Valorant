import type { Metadata } from 'next'
import { AccountView } from '@/components/compte/account-view'

export const metadata: Metadata = { title: 'Mon compte — LAN Valorant' }

export default function ComptePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-16">
      <h1 className="mb-8 text-5xl font-extrabold leading-none md:text-6xl">
        Mon <span className="text-primary">compte</span>
      </h1>
      <AccountView />
    </main>
  )
}
