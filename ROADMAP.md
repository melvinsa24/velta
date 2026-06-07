# Velta — Roadmap

> Tracker de progression du projet. Importable dans Notion, lisible et modifiable par Claude Code à chaque session.
> 
> Spécifications détaillées dans `SPECS.md`.

---

## 📍 Statut actuel

- **Version en cours** : v1 (MVP)
- **Phase active** : Phase 4 — Charte graphique (Phase 3 Base de données terminée)
- **Prochaine étape concrète** : Aligner `globals.css` sur les tokens de `VELTA_DESIGN_SYSTEM.md` (partiellement fait en Phase 2), installer `lucide-react`, puis composants de base (Button, Card, Input, Select) et layout avec tab bar basse.
- **Dernière mise à jour** : 2026-06-07

---

## Comment lire / mettre à jour cette roadmap

- Une case cochée `- [x]` = tâche faite et vérifiée sur mobile.
- Une case vide `- [ ]` = à faire.
- À la fin de chaque session, Claude Code coche ce qui est fini et met à jour le bloc "Statut actuel" + le journal de bord en bas.
- On suit l'ordre des phases. **On ne saute pas en avant**, même si une tâche d'une phase ultérieure semble facile.
- Si une idée nouvelle émerge (hors specs actuelles), on l'ajoute à la section "Idées en attente" en bas, on n'improvise pas dans le code.

---

## 🚀 v1 — MVP fonctionnel

> Objectif : remplacer mon Google Sheets actuel et utiliser Velta au quotidien.

### Phase 1 — Setup technique
- [x] Créer projet Next.js (App Router, TypeScript, Tailwind)
- [ ] Initialiser repo GitHub + lier à Vercel _(git local initialisé + premier commit ✅ ; reste : dépôt distant GitHub + liaison Vercel)_
- [ ] Créer projet Supabase (région Europe)
- [ ] Configurer variables d'environnement (Supabase URL + anon key) _(fichiers `.env.local` + `.env.example` créés avec clés vides ✅ ; reste : renseigner les vraies valeurs Supabase)_
- [ ] Premier déploiement Vercel (page "Hello world")
- [ ] Vérifier que la page s'affiche bien sur iPhone via l'URL Vercel

### Phase 2 — Authentification
- [x] Installer client Supabase _(`@supabase/supabase-js` + `@supabase/ssr` ✅ ; clients navigateur/serveur dans `src/lib/supabase/`)_
- [ ] Créer mon compte utilisateur unique manuellement dans Supabase _(à faire manuellement une fois le projet Supabase créé)_
- [x] Page de login (email + mot de passe) _(`src/app/(auth)/login/page.tsx`, charte graphique appliquée)_
- [x] Middleware d'authentification (redirection si non connecté) _(Next.js 16 : `middleware` renommé en **`proxy`** → `src/proxy.ts`)_
- [x] Bouton déconnexion _(`src/app/logout-button.tsx` sur la page d'accueil)_

### Phase 3 — Base de données
- [x] Créer les tables : `categories`, `monthly_budgets`, `transactions`, `monthly_settings`, `flore_payments` _(migration `supabase/migrations/001_initial_schema.sql`, exécutée via SQL Editor)_
- [x] Configurer Row Level Security (même si mono-user, bonne pratique) _(RLS activée + policy « auth users only » `auth.uid() IS NOT NULL` en FOR ALL sur les 5 tables)_
- [x] Tester les insertions / lectures via le client Supabase _(lecture sur `categories` OK, RLS confirmée ; types TS dans `src/types/database.ts`)_

### Phase 4 — Charte graphique
> Source unique de vérité : `VELTA_DESIGN_SYSTEM.md`. Lire avant tout travail UI, ne rien inventer hors de ce fichier (cf. SPECS §3 et §11).
- [ ] Aligner les variables CSS (couleurs, typo, rayons, espacement) de `globals.css` sur les tokens de `VELTA_DESIGN_SYSTEM.md`
- [ ] Installer `lucide-react` (seule bibliothèque d'icônes autorisée, cf. SPECS §4)
- [ ] Composants de base : Button, Card, Input, Select
- [ ] Layout général avec **tab bar basse** (4 onglets + bouton **+** central, cf. SPECS §4) — _et non un menu burger (ancienne charte abandonnée v2)_
- [ ] Navigation entre les écrans (Dashboard / Budget / Flore / Réglages ; Transactions, Simulateur, Récap accessibles depuis les onglets)

### Phase 5 — Catégories & paramètres
- [ ] Écran paramètres
- [ ] CRUD catégories (création, édition, suppression, couleur, mode de partage)
- [ ] Gestion du flag "crédit" (mensualités restantes, capital restant)
- [ ] Réglage de l'objectif % (avec auto-complétion du 3e champ)

### Phase 6 — Budget prévisionnel
- [ ] Écran budget prévisionnel
- [ ] Liste éditable des catégories par parent_type
- [ ] Saisie inline des montants
- [ ] Création de catégorie à la volée
- [ ] Récap des 3 totaux + comparaison à l'objectif %

### Phase 7 — Transactions
- [ ] Bouton flottant "+" présent partout
- [ ] Modale de saisie rapide (date, montant, catégorie, description)
- [ ] Création de catégorie à la volée depuis la modale
- [ ] Liste des transactions du mois (chronologique inverse)
- [ ] Édition / suppression des transactions
- [ ] Filtres par catégorie

### Phase 8 — Dashboard du mois
- [ ] Affichage du mois en cours + sélecteur de mois
- [ ] Bloc "reste à dépenser" (réel + après charges fixes)
- [ ] 3 jauges besoins / envies / épargne vs objectif
- [ ] Liste des catégories avec budget vs réel + barres de progression
- [ ] Alertes visuelles (>80%, dépassement)
- [ ] Note du mois (champ texte libre)

### Phase 9 — Workflow mois
- [ ] Bouton "Nouveau mois" (avec confirmation)
- [ ] Logique de reprise : besoins fixes/variables uniquement avec leurs montants
- [ ] Conservation libellés envies/épargne avec montants à 0
- [ ] Décrément automatique des crédits, disparition à 0
- [ ] Bouton "Archiver" et "Rouvrir un mois"

### Phase 10 — Répartition Flore
- [ ] Écran dédié
- [ ] Inputs revenus (moi + Flore + APL)
- [ ] Calcul ratio prorata automatique
- [ ] Liste des charges partagées avec parts respectives
- [ ] Total "Flore me doit"
- [ ] Module remboursements (ajout, liste, solde restant)
- [ ] Cas spécial revenu Flore = 0 (basculer tout en 100% perso)

### Phase 11 — Simulateur court terme
- [ ] Écran simulateur
- [ ] Saisie dépense fictive
- [ ] Impact temps réel sur reste à dépenser + ratios
- [ ] Indicateur "sortie d'objectif"
- [ ] Bouton "Convertir en vraie transaction"

### Phase 12 — Récap annuel
- [ ] Écran récap annuel
- [ ] Graphique courbe revenus mensuels (Recharts)
- [ ] Graphique courbes besoins / envies / épargne
- [ ] Graphique barres empilées
- [ ] Donut annuel par parent_type
- [ ] Tableau 12 mois (3 lignes : besoins / envies / épargne)
- [ ] Affichage propre des mois vides (tirets, pas d'erreurs)

### Phase 13 — Export & PWA
- [ ] Bouton export CSV (toutes les transactions + budgets)
- [ ] Configuration PWA (manifest.json, icônes)
- [ ] Meta tags iOS pour ajout écran accueil
- [ ] Test installation depuis Safari iPhone

### Phase 14 — Polish
- [ ] Vérifier responsive sur toutes les pages (mobile prioritaire)
- [ ] Animations légères (transitions douces)
- [ ] Loading states + skeletons
- [ ] Gestion des erreurs (messages clairs)
- [ ] Test sur device réel (iPhone)

### 🎯 Critère de "v1 livrée"
Je peux remplacer complètement mon Google Sheets actuel. Je saisis mes dépenses depuis mon iPhone en magasin, je vois mon budget vs objectif en temps réel, je calcule la part de Flore sans Excel.

---

## 🌱 v2 — Enrichissements

> À démarrer une fois la v1 stable et utilisée pendant 1 à 2 mois.

### Pot commun "Provisions" (sinking funds)
- [ ] Nouvelle catégorie parent "Provisions" à côté de besoins/envies/épargne
- [ ] CRUD enveloppes (cadeaux Noël, contrôle technique, etc.)
- [ ] Mécanique "déposer X€/mois" + "retirer Y€" quand la dépense tombe
- [ ] Vue solde de chaque enveloppe
- [ ] Alerte "tu peux puiser X€ pour cette dépense"

### Objectifs d'épargne nommés
- [ ] Création d'objectifs avec nom, montant cible, date cible (optionnelle)
- [ ] Suivi du solde cumulé (saisie du solde de départ + incrémentations)
- [ ] Barre de progression vers l'objectif
- [ ] Calcul "à ce rythme, tu atteindras l'objectif en X mois"

### Simulateur long terme
- [ ] Projection sur 12 mois (linéaire) du solde épargne
- [ ] Simulation de changement de format objectif (50/30/20 → 60/30/10)
- [ ] Simulation impact d'un changement de revenu

### Pilotage investissement
- [ ] Module portefeuille (PEA, CTO, crypto)
- [ ] Saisie des positions
- [ ] Saisie manuelle des valorisations (pas de connexion API)
- [ ] Suivi du rendement

### Améliorations UX
- [ ] Mode sombre
- [ ] Notifications in-app plus riches (badge sur les onglets)
- [ ] Recherche transactions (par description, montant)
- [ ] Stats avancées : top 10 dépenses du mois, évolution catégorie sur 6 mois
- [ ] Raccourcis clavier (desktop)

### Charges annuelles intelligentes
- [ ] Marquer une catégorie comme "annuelle" avec mois prévu
- [ ] Rappel le mois précédent : "Pense au paiement assurance habitation le mois prochain"

---

## 🌳 v3 — Vision long terme

> Si l'outil tient la route et que je veux aller plus loin.

- [ ] Connexion bancaire optionnelle (via Powens / Budget Insight)
- [ ] Multi-utilisateur (si Flore veut s'y mettre)
- [ ] Catégorisation auto par IA des descriptions
- [ ] Comparaison "année N vs N-1"
- [ ] Application mobile native (React Native)
- [ ] Patrimoine net (actifs + passifs)

---

## 💡 Idées en attente

> Tout ce qui surgit en cours de route et qui n'est pas dans les specs. À examiner à la fin d'une version pour décider si ça part en v2/v3 ou si on abandonne.

- _(vide pour l'instant)_

---

## 📌 Principes de développement

- **Itérer petit** : livrer phase par phase, pas tout d'un coup.
- **Tester sur mobile** à chaque phase (c'est le device principal).
- **Pas de gold plating** : si une feature n'est pas dans la roadmap, on l'ajoute après réflexion, on ne l'improvise pas.
- **Garder les données propres** : tous les calculs à la volée, pas de valeurs dérivées stockées.
- **Sauvegarder régulièrement** : export CSV ponctuel pour avoir une copie locale.

---

## 📝 Journal de bord

> Une ligne par session de travail. Claude Code ajoute une entrée en fin de session.

| Date | Phase | Ce qui a été fait | Bloquant / point d'attention |
|---|---|---|---|
| 2026-06-01 | Phase 1 | Scaffolding Next.js 16 (App Router, TS, Tailwind v4, src-dir, alias `@/*`). Git local init + 1er commit. `.env.local` + `.env.example` (clés Supabase vides). `page.tsx` réduit à `<h1>Velta</h1>`. `.gitignore` adapté (`!.env.example`, ignore `*:Zone.Identifier`). | À faire manuellement : créer le dépôt GitHub distant, le projet Supabase (Europe) + renseigner les valeurs d'env, lier Vercel, déployer, tester sur iPhone. Next.js installé en **v16** (breaking changes vs versions connues — cf. AGENTS.md, lire `node_modules/next/dist/docs/` avant de coder). |
| 2026-06-01 | Phase 2 | Auth Supabase : install `@supabase/supabase-js` + `@supabase/ssr`. Clients `src/lib/supabase/{client,server}.ts` (cookies `getAll`/`setAll`, `cookies()` async). Page login `src/app/(auth)/login/page.tsx` (signInWithPassword, redirection `/`, message d'erreur). Bouton déconnexion `src/app/logout-button.tsx`. Charte graphique appliquée (`globals.css` : palette/Helvetica/radius ; `layout.tsx` : lang `fr`, titre Velta, retrait Geist + dark mode). `npm run build` ✅. | **Next.js 16 a déprécié `middleware` → renommé `proxy`** : créé `src/proxy.ts` (et non `src/middleware.ts` demandé) pour respecter la convention/dépréciation (cf. AGENTS.md). **L'auth ne fonctionnera réellement qu'une fois** le projet Supabase créé, `.env.local` rempli et le compte utilisateur créé dans Supabase. Ajout des tokens charte dans `globals.css` (normalement Phase 4) car requis pour styler le login. |
| 2026-06-07 | Phase 3 | Base de données. Migration `supabase/migrations/001_initial_schema.sql` : 5 tables (`categories`, `monthly_budgets`, `transactions`, `monthly_settings`, `flore_payments`) + 3 enums (`category_type`, `share_mode`, `budget_status`), triggers `updated_at`, RLS + policy « auth users only » (FOR ALL, `auth.uid() IS NOT NULL`) sur les 5 tables. Exécutée via SQL Editor. Types TS dans `src/types/database.ts` (Row/Insert/Update). Test de lecture sur `categories` OK puis fichier de test supprimé. | **Exécution manuelle** : la clé `.env.local` est une clé *publishable* (anon) qui ne peut pas faire de DDL → SQL passé à la main dans le SQL Editor. **`parent_type` = colonne `text` générée** (et non enum) : un `CASE` renvoyant du texte vers une colonne enum levait `column is of type parent_type but default expression is of type text`. Choix : colonne générée STORED `text` dérivée de `type` (seule valeur « calculée » stockée, mais auto-cohérente). **`monthly_settings` / `flore_payments` sans `created_at`/`updated_at`** (non listés dans SPECS §5, schéma respecté à la lettre). `on delete restrict` sur `transactions.category_id` pour ne pas effacer l'historique. Migration rendue rejouable (bloc `drop ... if exists` en tête) après un 1er run partiel. |
