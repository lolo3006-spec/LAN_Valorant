import type { Metadata } from 'next'
import { NewPasswordForm } from '@/components/auth/new-password-form'

export const metadata: Metadata = { title: 'Nouveau mot de passe — LAN Valorant' }

export default function Page() {
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:px-6 md:py-16 lg:grid-cols-[1fr_1fr] lg:items-start">
      <div>
        <h1 className="text-5xl font-extrabold leading-none md:text-6xl">
          Nouveau <span className="text-primary">mot de passe</span>
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">Choisis ton nouveau mot de passe. Tu resteras connecté ensuite.</p>
      </div>
      <NewPasswordForm />
    </main>
  )
}
