import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'Connexion — LAN Valorant' }

export default function ConnexionPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:px-6 md:py-16 lg:grid-cols-[1fr_1fr] lg:items-start">
      <div>
        <h1 className="text-5xl font-extrabold leading-none md:text-6xl">
          Connexion <span className="text-primary">joueur</span>
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">
          Connecte-toi pour créer ou rejoindre une équipe et proposer les scores de tes matchs.
          Les organisateurs se connectent ici aussi.
        </p>
      </div>
      <LoginForm />
    </main>
  )
}
