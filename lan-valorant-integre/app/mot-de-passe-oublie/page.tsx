import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = { title: 'Mot de passe oublié — LAN Valorant' }

export default function Page() {
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:px-6 md:py-16 lg:grid-cols-[1fr_1fr] lg:items-start">
      <div>
        <h1 className="text-5xl font-extrabold leading-none md:text-6xl">
          Mot de passe <span className="text-primary">oublié</span>
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">Indique l’e-mail de ton inscription : tu recevras un lien pour choisir un nouveau mot de passe.</p>
      </div>
      <ForgotPasswordForm />
    </main>
  )
}
