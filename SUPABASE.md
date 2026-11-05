---
title: "LAN Valorant — Brancher le back-end Supabase"
subtitle: "Guide pas à pas pour l'équipe"
lang: fr-FR
---

# 1. Ce qui a été fait

Le site (Next.js) affichait des données en dur (`lib/data.ts`). Il lit et écrit maintenant tout dans **Supabase** :

| Élément | Où |
|---|---|
| Base de données, sécurité, logique du tournoi | `supabase/schema.sql` (un seul fichier à coller dans Supabase) |
| Connexion à Supabase | `lib/supabase.ts` |
| Lectures et actions (créer une équipe, valider un score…) | `lib/api.ts` |
| Données en direct (temps réel) | `components/tournament-provider.tsx` |
| Connexion / rôle organisateur | `components/role-provider.tsx`, page `/connexion` |

**Tables** : `tournois`, `joueurs`, `inscriptions`, `equipes`, `membres_equipe`, `matchs`.

**Ce que fait la base toute seule** (fonctions SQL appelées par le site) :

- inscription d'un joueur → fiche joueur + inscription au tournoi (contrôle des places et de la date limite) ;
- création d'équipe (le créateur devient capitaine), rejoindre / quitter une équipe (taille selon le format 1v1, 2v2, 4v4, 5v5) ;
- changement du format du tournoi par un organisateur, uniquement avant son lancement ;
- clôture des inscriptions → liste des équipes incomplètes ; en 1v1, chaque joueur reçoit automatiquement son équipe solo ;
- **équilibrage** des agents libres : le joueur le plus fort va dans l'équipe la plus faible ;
- **lancement du tournoi** → bracket complet à élimination directe ; si le nombre d'équipes n'est pas 2, 4, 8, 16…, les meilleures têtes de série sont **qualifiées d'office** ;
- score proposé par un capitaine → « Score à valider » → validé par l'orga → **le vainqueur passe au tour suivant** ; la finale validée termine le tournoi ;
- score contesté, forfait, correction d'un score, réinitialisation du bracket ;
- RGPD : suppression des comptes joueurs après l'événement (résultats conservés).

**Sécurité** : un visiteur lit le bracket et les équipes, jamais les e-mails ni les noms. Un joueur non organisateur qui tente de valider un score reçoit « Action réservée aux organisateurs ». Toutes ces règles sont dans la base : on ne peut pas les contourner depuis le navigateur.

> Changement par rapport au formulaire : un champ **mot de passe** a été ajouté à l'inscription. Il est nécessaire pour que le capitaine puisse ensuite se connecter et saisir ses scores (cahier des charges : « Joueur — s'inscrit → compte créé »).

# 2. Créer la base Supabase (10 minutes)

1. Va sur **supabase.com** → *Start your project* → connecte-toi (GitHub marche très bien).
2. *New project* : nom `lan-valorant`, un mot de passe de base de données (note-le), région **Europe (Paris ou Francfort)**, offre **Free**.
3. Attends que le projet soit prêt (1 à 2 minutes).
4. Menu de gauche → **SQL Editor** → *New query*.
5. Ouvre le fichier `supabase/schema.sql` du projet, **copie tout**, colle-le, clique **Run**.
   Le message attendu est *Success. No rows returned*.
6. Menu **Table Editor** : tu dois voir les 6 tables, et une ligne dans `tournois`.
   Modifie-la directement ici : nom, date, lieu, format (`1v1`, `2v2`, `4v4` ou `5v5`), nombre max de joueurs et d'équipes, date limite (`fin_inscriptions`, facultative).

Pour un projet déjà en service, exécute à nouveau `supabase/schema.sql` dans le **SQL Editor** afin d'ajouter la prise en charge du 5v5 et la fonction de changement de format. Dans **Équipes**, les organisateurs peuvent changer le format avant de lancer le tournoi ; une équipe déjà formée ne peut pas dépasser la nouvelle taille.

# 3. Réglages de connexion

1. Menu **Authentication** → **Sign In / Providers** (ou *Providers*) → **Email**.
2. **Désactive « Confirm email »** puis *Save*.
   Pourquoi : l'envoi de mails gratuit de Supabase est très limité (quelques mails par heure). Sans confirmation, l'inscription est immédiate.
3. Créer **ton compte organisateur** : **Authentication → Users → Add user → Create new user**, ton e-mail + un mot de passe, coche *Auto Confirm User*.
4. Retourne dans **SQL Editor**, exécute (avec ton e-mail) :

```sql
update public.joueurs set est_admin = true where email = 'ton.email@ecole.fr';
```

Refais l'étape 3 et 4 pour chaque organisateur.

# 4. Récupérer les deux clés

Bouton **Connect** en haut du tableau de bord, ou **Project Settings → API** (ou *API Keys*) :

- **Project URL** → `https://xxxxxxxx.supabase.co`
- **anon public key** (ou **Publishable key**, `sb_publishable_…`, sur les projets récents)

Ces deux valeurs sont publiques par nature : elles peuvent aller dans le site. **Ne mets jamais la clé `service_role` / *secret* dans le site.**

# 5. Mettre le code dans votre application

Je ne peux pas me connecter à votre compte Supabase, Vercel ou v0 : c'est vous qui collez le SQL (étape 2) et déposez les fichiers. Trois façons, choisissez celle qui correspond à votre installation.

## Option A — Le projet est sur GitHub (recommandé)

Le zip `lan-valorant-main` vient probablement d'un dépôt GitHub.

1. Décompresse le zip livré **par-dessus** ton dossier local du dépôt (remplacer les fichiers).
2. Dans un terminal, dans le dossier : `pnpm install` (installe `@supabase/supabase-js`).
3. Copie `.env.local.example` en `.env.local` et colle tes deux clés.
4. `pnpm dev` puis ouvre http://localhost:3000 pour tester.
5. `git add . && git commit -m "Back-end Supabase" && git push`.
6. Sur **Vercel** (si le site y est déployé) : *Project → Settings → Environment Variables*, ajoute `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`, puis *Deployments → Redeploy*.

Sans terminal : sur github.com, *Add file → Upload files*, glisse les dossiers `app`, `components`, `lib`, `supabase` et les fichiers `package.json`, `pnpm-lock.yaml`, `.env.local.example`, `SUPABASE.md`, puis *Commit*. Vercel redéploie tout seul ; n'oublie pas l'étape 6.

## Option B — Le projet est dans v0.app

1. Si le chat v0 est relié à GitHub, fais l'option A sur le dépôt : v0 récupère les changements.
2. Sinon, ouvre le chat v0 → panneau **Vars** (ou *Settings → Environment Variables*) et ajoute les deux variables.
   Puis demande à v0 : « Remplace le contenu des fichiers suivants par celui-ci » en collant fichier par fichier ceux de la liste « Fichiers modifiés » plus bas. Plus long mais faisable.
3. v0 propose aussi une intégration **Supabase** native (*Connect → Supabase*) : elle crée les variables d'environnement toute seule. Elle peut nommer la clé `NEXT_PUBLIC_SUPABASE_ANON_KEY` : c'est ce qu'attend le code.

## Option C — Sans Next.js du tout (Glide, Make…)

Le back-end est indépendant du site : toutes les actions sont des fonctions SQL qu'on peut appeler en HTTP.
Exemple Make (module *HTTP → Make a request*) pour valider un score :

- URL : `https://xxxxxxxx.supabase.co/rest/v1/rpc/valider_score`
- Méthode : `POST`
- En-têtes : `apikey: <clé anon>` et `Authorization: Bearer <jeton de l'utilisateur connecté>`
- Corps JSON : `{"p_match": "<id du match>"}`

Les lectures se font sur les vues `v_matchs`, `v_equipes`, `v_agents_libres`, `v_classement` (ex. `GET /rest/v1/v_matchs?select=*`).

# 6. Tester (recette du cahier des charges)

| Test | Comment | Résultat attendu |
|---|---|---|
| Créer une équipe de 2 en 2v2 | Inscris 2 joueurs (2 navigateurs ou une fenêtre privée), le 1er crée l'équipe, le 2e clique « Rejoindre » | L'équipe apparaît complète (2/2) |
| Lancer un tournoi de 8 équipes | Connecté en orga : Équipes → Clôturer → Lancer le tournoi | 4 matchs au 1er tour (Quarts) |
| Valider un score | Capitaine : Matchs → Proposer un score. Orga : Valider | Le vainqueur apparaît en Demies |
| Non-admin modifie un score | Capitaine : essaye de valider | Refusé |
| Page publique en direct | Ouvre /matchs dans un autre navigateur pendant que l'orga valide | Mise à jour sans recharger (quelques secondes max) |

Astuce : pour fabriquer vite des joueurs de test, inscris-les depuis une fenêtre de navigation privée avec des e-mails inventés (`test1@ecole.fr`, …) — sans confirmation d'e-mail, ça marche.

# 7. Le jour J — mode d'emploi orga

1. **Équipes** → *Clôturer les inscriptions* (le site liste les équipes incomplètes).
2. *Équilibrer automatiquement* pour placer les agents libres, ou bouton **+** à côté d'un joueur pour le placer à la main. *Modifier* sur une équipe : nom, tag, seed, retirer un joueur.
3. *Lancer le tournoi* → le bracket est créé.
4. **Matchs** → *Lancer le tour suivant* (passe les matchs prêts « En direct »), ou *Démarrer* match par match.
5. Les capitaines proposent les scores → tableau *Scores en attente* → **Valider** ou **Contester**.
6. *Arbitrer* sur un match : saisir/corriger un score, déclarer un forfait.
7. Après l'événement : *Supprimer les données (RGPD)* (bouton visible quand le tournoi est terminé).

**Si quelque chose bloque** : tout se corrige à la main dans **Table Editor**, ou dans **SQL Editor** avec les mêmes fonctions, par exemple :

```sql
select public.reinitialiser_bracket((select id from public.tournois limit 1));
select public.valider_score('<id du match>', 13, 7);
```

# 8. Limites et pistes

- **Offre gratuite Supabase** : le projet se met en pause après 7 jours sans activité (bouton *Restore* pour le relancer). Pensez à l'ouvrir la veille de la LAN.
- **Mot de passe oublié** : géré par le site (page `/mot-de-passe-oublie`), mais il faut un service d'envoi d'e-mails configuré dans Supabase (voir `MISE-EN-LIGNE.md`).
- **Notifications aux équipes** (« bracket généré », « score validé ») : à brancher avec un *Database Webhook* Supabase (*Database → Webhooks*, table `matchs`) qui déclenche un scénario Make envoyant un mail ou un message Discord.
- **Classement** : la vue `v_classement` est prête (tour atteint, victoires, champion) ; il reste à l'afficher sur une page si vous le souhaitez.
- **IA** (résumé de match, annonces) : non incluse, optionnelle dans le cahier des charges.

# 9. Fichiers modifiés ou ajoutés

Ajoutés (novembre 2026) : `app/compte/page.tsx`, `app/mot-de-passe-oublie/page.tsx`, `app/nouveau-mot-de-passe/page.tsx`, `components/compte/account-view.tsx`, `components/auth/forgot-password-form.tsx`, `components/auth/new-password-form.tsx`, `MISE-EN-LIGNE.md`. Modifiés : `lib/api.ts`, `lib/data.ts`, `lib/supabase.ts`, `components/matchs/matches-view.tsx`, `components/auth/login-form.tsx`, `components/account-menu.tsx`.

Ajoutés : `supabase/schema.sql`, `lib/supabase.ts`, `lib/api.ts`, `components/tournament-provider.tsx`, `components/account-menu.tsx`, `components/ui/modal.tsx`, `components/auth/login-form.tsx`, `app/connexion/page.tsx`, `components/home/current-matches.tsx`, `components/inscription/tournament-facts.tsx`, `.env.local.example`, `SUPABASE.md`.

Modifiés : `package.json`, `pnpm-lock.yaml`, `lib/data.ts` (plus de fausses données), `app/layout.tsx`, `app/page.tsx`, `app/inscription/page.tsx`, `components/role-provider.tsx`, `components/site-header.tsx`, `components/cards.tsx`, `components/home/hero.tsx`, `components/inscription/signup-form.tsx`, `components/equipes/teams-view.tsx`, `components/matchs/matches-view.tsx`, `components/matchs/bracket.tsx`.
