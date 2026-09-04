# Xpertiv — Ressources & équipements

App de gestion des salariés, postes (PC) et véhicules.

Ce projet est un export du prototype développé dans Claude. Il utilise
Supabase comme backend : à la fois pour les données (salariés, PC, véhicules)
et pour les comptes utilisateurs (connexion, création de compte, mot de passe
oublié, validation manuelle des accès par un administrateur).

## 1. Versioning avec Git

Un projet versionné = un historique complet des changements, avec possibilité
de revenir en arrière si besoin. Marche à suivre, une seule fois :

```bash
cd xpertiv-app
git init
git add .
git commit -m "v0.1 — première version : salariés, PC, véhicules"
```

Puis créer un dépôt vide sur GitHub (github.com → New repository, sans README
ni .gitignore, pour éviter les conflits), et relier ce dossier local :

```bash
git remote add origin https://github.com/<ton-compte>/xpertiv-admin.git
git branch -M main
git push -u origin main
```

Pour toute évolution ensuite, le cycle est toujours le même :

```bash
git add .
git commit -m "description courte du changement"
git push
```

Bonnes pratiques simples à garder :
- Un commit = un changement cohérent (pas la moindre de mettre 10 modifs
  dans un seul commit).
- Un message clair au présent ("ajoute le champ site" plutôt que "fix").
- Marquer les étapes importantes avec un tag :
  `git tag v1.0 && git push --tags` — utile pour retrouver "la version
  qui tournait avant telle modif".

## 2. Mise en ligne simple (pour tester, avant xpertiv.pro/admin)

Le plus rapide pour voir l'app en ligne sur une vraie URL, en quelques
minutes, sans toucher à xpertiv.pro :

1. Aller sur vercel.com (ou netlify.com), créer un compte gratuit.
2. "Import Project" → connecter le dépôt GitHub créé à l'étape 1.
3. Avant de déployer, dans `vite.config.js`, remettre temporairement
   `base: "/"` (au lieu de `/admin/`) car l'app sera à la racine du domaine
   fourni par Vercel/Netlify.
4. Déployer. Une URL du type `xpertiv-admin.vercel.app` est générée.
5. À partir de là, chaque `git push` republie automatiquement une nouvelle
   version en quelques secondes — c'est le lien entre versioning et mise en
   ligne : plus besoin de manipuler des fichiers à la main.

## 3. Mise en ligne définitive sur xpertiv.pro/admin

Une fois que la version testée sur Vercel/Netlify convient :

1. Remettre `base: "/admin/"` dans `vite.config.js`.
2. Générer les fichiers finaux :
   ```bash
   npm install
   npm run build
   ```
   Cela crée un dossier `dist/` avec uniquement du HTML/CSS/JS statique.
3. Déposer le contenu de `dist/` dans un dossier `admin` à la racine de
   l'hébergement WordPress (via FTP ou le gestionnaire de fichiers de
   l'hébergeur), à côté des fichiers WordPress existants.
4. Vérifier que xpertiv.pro/admin charge bien l'app.

## 4. Mettre en place les comptes et la validation des accès

L'app utilise maintenant [Supabase](https://supabase.com) à la fois pour les
données (salariés, PC, véhicules) et pour les comptes (connexion, création de
compte, mot de passe oublié). Personne ne peut utiliser l'app sans un compte
validé par un administrateur.

### 4.1 Créer le projet Supabase

1. Créer un compte gratuit sur supabase.com, puis un nouveau projet.
2. Dans Project Settings → API, récupérer l'URL du projet et la clé "anon
   public".
3. Copier `.env.example` en `.env` à la racine du projet, et coller ces deux
   valeurs.

### 4.2 Mettre en place les tables et la sécurité

1. Dans le dashboard Supabase → SQL Editor → New query.
2. Copier-coller tout le contenu du fichier `supabase/schema.sql` de ce
   projet, et exécuter.

   Cela crée :
   - la table `profiles` (un profil par compte, avec un statut `approved`),
   - la table `kv_store` (les données de l'app),
   - les règles de sécurité : seuls les comptes avec `approved = true`
     peuvent lire ou écrire les données.

### 4.3 Devenir administrateur (obligatoire, une seule fois)

Le tout premier compte doit être promu admin à la main, sinon personne ne
peut approuver personne :

1. Lancer l'app (`npm run dev`) et créer ton compte via "Créer un compte".
2. Dans Supabase → SQL Editor, exécuter (en remplaçant l'email) :
   ```sql
   update public.profiles
   set role = 'admin', approved = true
   where email = 'ton.email@xpertiv.fr';
   ```
3. Recharger l'app : tu es maintenant connecté en tant qu'admin, avec un
   onglet "Utilisateurs" dans la barre du haut.

À partir de là, toute nouvelle personne qui crée un compte apparaît dans cet
onglet "Utilisateurs", en attente — un clic sur "Approuver" lui donne accès.

### 4.4 Configurer les emails (mot de passe oublié)

Par défaut, Supabase envoie les emails de réinitialisation via son propre
service (suffisant pour une petite équipe, avec une limite de volume). Pour
que le lien de réinitialisation revienne au bon endroit :

1. Dans Supabase → Authentication → URL Configuration, ajouter l'URL finale
   de l'app (ex. `https://xpertiv.pro/admin`) dans "Redirect URLs".
2. Si le volume d'emails devient important plus tard, Supabase permet de
   brancher un vrai service SMTP (Resend, Postmark…) dans Authentication →
   Email Templates.

## 5. Avant un usage à plusieurs personnes

Une fois les étapes ci-dessus faites, les données sont réellement partagées
entre tous les comptes approuvés (via `kv_store`), et l'accès est protégé par
un vrai système de connexion avec validation manuelle. C'est le circuit
complet, prêt pour un usage réel par l'équipe Xpertiv.

