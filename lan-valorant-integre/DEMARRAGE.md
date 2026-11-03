# LAN Valorant — version intégrée à Supabase

Cette version conserve l'interface du projet LAN Valorant et relie les écrans principaux à Supabase : authentification, profil joueur, inscription, équipes, agents libres, matchs, actions organisateur et actualisation des données.

## 1. Configuration locale

1. Ouvrir ce dossier dans VS Code.
2. Copier `.env.local.example` vers `.env.local`.
3. Dans Supabase, ouvrir **Project Settings → API** et renseigner :

```env
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=VOTRE_CLE_PUBLISHABLE_OU_ANON
```

La clé publique `anon` / `publishable` est destinée au navigateur. **Ne jamais mettre `service_role`, une clé secrète ou un mot de passe dans une variable `NEXT_PUBLIC_`.**

## 2. Installer et lancer

Avec pnpm :

```bash
pnpm install
pnpm dev
```

Puis ouvrir http://localhost:3000.

## 3. Authentification et URL de retour

Dans Supabase → Authentication → URL Configuration, ajouter l'URL locale `http://localhost:3000` dans les URL autorisées. Pour la production, ajouter aussi le domaine du site.

Le formulaire d'inscription crée le compte Auth. Le trigger SQL `gerer_nouvel_utilisateur()` crée ensuite le profil et l'inscription au tournoi. Si la confirmation e-mail est activée, le joueur doit cliquer le lien reçu avant de se connecter.

## 4. Ce qui est relié

- Accueil : tournoi et matchs mis en avant depuis Supabase.
- Inscription : création de compte et inscription au tournoi.
- Connexion / déconnexion : Supabase Auth.
- Équipes : lecture, création, modification, rejoindre/quitter, actions organisateur.
- Matchs : lecture, proposition et validation des scores, forfaits et actions organisateur.
- Mise à jour : Supabase Realtime si les tables sont dans la publication Realtime, avec rafraîchissement périodique de secours.

## 5. Avant mise en ligne : contrôles manuels indispensables

- Vérifier dans Supabase que les migrations et fonctions attendues existent. Ne pas exécuter aveuglément `supabase/schema.sql` : le fichier historique contient des `DROP` destructifs.
- Faire un test réel avec un compte joueur de test et un compte organisateur de test.
- Tester la confirmation e-mail, l'inscription, la création d'équipe, l'ajout/retrait d'un joueur et le cycle de score.
- Vérifier les URL autorisées, les politiques RLS, les privilèges de colonnes et les réglages Auth.
- Vérifier les mentions/consentements RGPD avec l'organisateur. La case de consentement du formulaire est une validation côté interface ; la preuve et la politique de conservation doivent être confirmées avant une utilisation réelle.

Cette intégration n'est pas une certification de sécurité. Les tests locaux et les essais avec des comptes de test restent nécessaires avant ouverture au public.
