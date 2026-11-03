import { createClient } from '@supabase/supabase-js'

// Ces deux valeurs se trouvent dans Supabase > Project Settings > API.
// En local : fichier .env.local ; sur Vercel / v0 : variables d'environnement du projet.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabaseConfigured = Boolean(url && anonKey)

export const supabase = createClient(url || 'https://exemple.supabase.co', anonKey || 'cle-manquante', {
  auth: { persistSession: true, autoRefreshToken: true },
})

// Transforme une erreur Supabase en message lisible en français
export function messageErreur(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e)
  if (msg.includes('Invalid login credentials')) return 'E-mail ou mot de passe incorrect.'
  if (msg.includes('User already registered')) return 'Un compte existe déjà avec cet e-mail : connecte-toi.'
  if (msg.includes('Password should be at least')) return 'Le mot de passe doit contenir au moins 6 caractères.'
  if (msg.includes('Email not confirmed')) return 'Confirme d’abord ton e-mail (lien reçu par mail).'
  if (msg.includes('rate limit')) return 'Trop de tentatives, réessaie dans quelques minutes.'
  if (msg.includes('Failed to fetch')) return 'Impossible de joindre le serveur. Vérifie ta connexion.'
  if (msg.includes('Database error saving new user')) return 'Inscription refusée (tournoi complet ou inscriptions fermées).'
  if (msg.includes('email_address_not_authorized') || msg.includes('Email address not authorized'))
    return 'Envoi d’e-mail impossible : le service d’envoi n’est pas encore configuré dans Supabase (SMTP).'
  if (msg.includes('New password should be different')) return 'Le nouveau mot de passe doit être différent de l’ancien.'
  if (msg.includes('Auth session missing')) return 'Lien expiré ou déjà utilisé : refais une demande de réinitialisation.'
  return msg
}
