# LAN Valorant — Nouveautés et mise en ligne

## 1. Ce qui a été ajouté (novembre 2026)

| Fonction | Où dans le site | Fonction Supabase |
|---|---|---|
| Page **Mon compte** (profil, changer de mot de passe, déconnexion) | `/compte`, clic sur son pseudo en haut à droite | `mon_profil` |
| **Se désinscrire** du tournoi (le compte est conservé) | `/compte` | `se_desinscrire` |
| **Supprimer son compte** (RGPD, il faut taper SUPPRIMER pour confirmer) | `/compte` | `supprimer_mon_compte` |
| **Supprimer un compte joueur depuis l’admin** | `/compte`, section « Organisateurs » | `admin_supprimer_compte` |
| **Mot de passe oublié** : lien envoyé par e-mail | lien sous le formulaire de `/connexion` → `/mot-de-passe-oublie` → `/nouveau-mot-de-passe` | Supabase Auth |
| **Planifier un match** (horaire + carte), réservé aux organisateurs | `/matchs`, bouton « Planifier » sur chaque match | `admin_planifier_match` |
| **Nommer / retirer un organisateur** | `/compte`, section « Organisateurs » (visible par les orgas) | `admin_liste_comptes`, `admin_definir_organisateur` |
| **Créer une équipe sans s’y inscrire** | `/equipes`, organisateurs, quel que soit le statut du tournoi | `admin_creer_equipe` |
| **Supprimer une équipe** | `/equipes`, organisateurs, quel que soit le statut du tournoi | `admin_supprimer_equipe` |

Sécurités côté base : un joueur ne peut plus se nommer administrateur lui-même ; le dernier organisateur ne peut ni supprimer son compte ni perdre ses droits ; un joueur dans un tournoi en cours ne peut pas supprimer son compte.
Une équipe déjà liée à un match ne peut pas être supprimée, afin de préserver le bracket et les scores. La suppression d’une équipe libère ses joueurs sans supprimer leur inscription au tournoi.

Pour un projet Supabase déjà en service, exécuter à nouveau le contenu à jour de `supabase/schema.sql` dans **SQL Editor** afin d’ajouter les deux fonctions de gestion des équipes.

> Le mot de passe n'est jamais envoyé par e-mail : Supabase ne le connaît pas (il n'en garde qu'une empreinte). Le joueur reçoit un lien pour en choisir un nouveau.

## 2. Mettre le site en ligne avec Vercel (gratuit, environ 15 minutes)

Le site est une application Next.js : Vercel (l'éditeur de Next.js) l'héberge gratuitement.

1. Créer un compte sur **github.com** et un dépôt (ex. `lan-valorant`), puis y déposer le contenu de ce dossier : *Add file → Upload files*, glisser tous les fichiers et dossiers **sauf** `node_modules`, `.next` et `.env.local`, puis *Commit changes*.
2. Créer un compte sur **vercel.com** avec « Continue with GitHub ».
3. *Add New… → Project* → choisir le dépôt `lan-valorant` → *Import*.
4. Avant de cliquer *Deploy*, ouvrir **Environment Variables** et ajouter :
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://cvgilkrfsdjuflmuicrr.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = la clé *publishable* (`sb_publishable_…`), visible dans Supabase → *Project Settings → API Keys* ou dans le fichier `.env.local` fourni.
5. *Deploy*. Au bout de 1 à 2 minutes, Vercel donne l'adresse du site, par exemple `https://lan-valorant.vercel.app`.

Ensuite, chaque modification déposée sur GitHub est remise en ligne automatiquement.

## 3. Réglages Supabase à faire après la mise en ligne

1. **Authentication → URL Configuration**
   - *Site URL* : l'adresse Vercel (ex. `https://lan-valorant.vercel.app`)
   - *Redirect URLs* : ajouter `https://lan-valorant.vercel.app/**` et `http://localhost:3000/**`
2. **Service d'envoi d'e-mails (indispensable pour « mot de passe oublié »)**
   Sans lui, Supabase n'envoie des e-mails qu'aux membres de l'équipe du projet.
   - Créer un compte gratuit chez **Brevo** (français) ou **Resend**, récupérer les identifiants SMTP.
   - Les saisir dans **Authentication → Emails → SMTP Settings** (expéditeur : par ex. `no-reply@…`, nom : `LAN Valorant`).
3. **E-mail en français** : *Authentication → Emails → Templates → Reset Password*
   - Sujet : `Réinitialisation de votre mot de passe`
   - Corps :
     ```html
     <h2>Réinitialisation de votre mot de passe</h2>
     <p>Vous avez demandé à changer votre mot de passe. Cliquez sur le lien ci-dessous :</p>
     <p><a href="{{ .ConfirmationURL }}">Choisir un nouveau mot de passe</a></p>
     <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
     ```
4. **Protection des mots de passe** : *Authentication → Sign In / Providers → Email* → activer la protection contre les mots de passe divulgués (si l'option est disponible sur votre offre).

## 4. Tester avant le jour J

| Test | Résultat attendu |
|---|---|
| Connexion → « Mot de passe oublié ? » avec son e-mail | E-mail reçu, le lien ouvre « Nouveau mot de passe », la connexion marche avec le nouveau mot de passe |
| Orga : Matchs → « Planifier » → 14:30 + Ascent | L'horaire et la carte s'affichent sur la carte du match, chez tout le monde |
| Joueur : Mon compte → Supprimer mon compte | Retour à l'accueil déconnecté, le joueur disparaît des équipes |
| Joueur non orga qui ouvre `/compte` | Pas de section « Organisateurs » |
| Orga : nommer un 2e organisateur | Le 2e compte voit le sélecteur Joueur / Orga après reconnexion |
