# Velta — Roadmap

> Tracker de progression du projet. Importable dans Notion, lisible et modifiable par Claude Code à chaque session.
> 
> Spécifications détaillées dans `SPECS.md`.

---

## 📍 Statut actuel

- **Version en cours** : v1 (MVP)
- **Phase active** : Phase 7 — Transactions (Phase 6 Budget prévisionnel terminée)
- **Prochaine étape concrète** : Saisie rapide d'une transaction via le bouton « + » de la tab bar (date, montant, catégorie en cascade, description) + liste chronologique inverse du mois avec filtres et édition/suppression.
- **Dernière mise à jour** : 2026-06-08

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
- [x] Aligner les variables CSS (couleurs, typo, rayons, espacement) de `globals.css` sur les tokens de `VELTA_DESIGN_SYSTEM.md` _(tous les tokens v2 + ombres ; pont Tailwind v4 via `@theme inline` — pas de `tailwind.config.ts` en v4)_
- [x] Installer `lucide-react` (seule bibliothèque d'icônes autorisée, cf. SPECS §4)
- [x] Composants de base : Button, Card, Input, Select _(+ Modal, dans `src/components/ui/` ; helper `cn` dans `src/lib/cn.ts`)_
- [x] Layout général avec **tab bar basse** (4 onglets + bouton **+** central, cf. SPECS §4) — _et non un menu burger (ancienne charte abandonnée v2). Groupe de routes `(app)` + `TabBar` verre dépoli, point lime onglet actif ; bouton **+** ouvre une modale vide_
- [x] Navigation entre les écrans (Dashboard / Budget / Flore / Réglages ; Transactions, Simulateur, Récap accessibles depuis les onglets) _(pages squelettes créées, navigation testée)_

### Phase 5 — Catégories & paramètres
- [x] Écran paramètres _(4 sections en scroll vertical : Catégories · Objectifs % · Export CSV placeholder · Compte)_
- [x] CRUD catégories (création, édition, suppression, couleur, mode de partage) _(liste groupée par `parent_type`, modale create/edit, palette 12 couleurs, suppression confirmée + avertissement si transactions liées)_
- [x] Gestion du flag "crédit" (mensualités restantes, capital restant) _(3 champs conditionnels : mensualités restantes, date de fin, capital restant)_
- [x] Réglage de l'objectif % (avec auto-complétion du 3e champ) _(stocké dans `monthly_settings` du mois en cours, validation total = 100 %)_

### Phase 6 — Budget prévisionnel
- [x] Écran budget prévisionnel _(`/budget` : en-tête mois, bouton « Reprendre N-1 » conditionnel, 3 sections + récap)_
- [x] Liste éditable des catégories par parent_type _(groupées besoins / envies / épargne, pastille couleur par ligne)_
- [x] Saisie inline des montants _(input par ligne, sauvegarde au blur + debounce 500 ms, upsert `monthly_budgets`)_
- [x] Création de catégorie à la volée _(bouton « + » par section → même modale que Réglages, pré-remplie avec le bon type)_
- [x] Récap des 3 totaux + comparaison à l'objectif % _(% sur `revenue_melvin`, 3 états vert/ambre/rouge vs objectif, total global)_

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
| 2026-06-07 | Phase 4 | Charte graphique. `globals.css` réécrit sur les tokens v2 de `VELTA_DESIGN_SYSTEM.md` (couleurs, rayons `--r`/`--r-full`, Helvetica, ombres) + pont vers utilitaires Tailwind via `@theme inline`. Install `lucide-react`. Composants `src/components/ui/` : Button (primary/secondary/ghost), Card, Input, Select, Modal + barrel `index.ts` ; helper `cn` (`src/lib/cn.ts`). Layout : groupe de routes `(app)` avec `TabBar` (`src/components/layout/`) — verre dépoli, 4 onglets lucide (`LayoutDashboard`/`Wallet`/`Users`/`Settings`) + bouton **+** central lime ouvrant une modale vide, point lime sur l'onglet actif. 4 pages squelettes (`/dashboard`, `/budget`, `/flore`, `/reglages`) via `ScreenHeader`. `/` redirige vers `/dashboard`. Login refondu sur les composants UI. Logout déplacé du home vers Réglages. `viewport` export (Next 16) ajouté. `npm run build` ✅, smoke-test des 6 routes OK (login 200, app gated → 307). | **Tailwind v4 = config CSS-first** : pas de `tailwind.config.ts` créé malgré l'énoncé — la bonne pratique v4 (et le code existant) est `@theme` dans `globals.css` ; créer un config JS serait l'anti-pattern que l'AGENTS.md met en garde. **Anciens tokens supprimés** (`--background`, `--foreground`, `--muted`, `--radius-control` 6px) au profit des noms v2 → login + logout-button mis à jour pour ne pas casser. **Rayon unique 10px** : `--radius-control` 6px abandonné (hors charte). **Test mobile 390px non visuel** : aucun navigateur headless dispo + routes auth-gated sans identifiants Supabase → vérif structurelle (build, CSS utilitaires générés, HTML des 5 éléments de tab bar via bypass temporaire du proxy aussitôt rétabli). Le contrôle visuel final 390px reste à faire côté Melvin (login + DevTools). |
| 2026-06-08 | Phase 6 | Budget prévisionnel. Écran `/budget` (`page.tsx` Server Component) : charge catégories + `monthly_budgets` du mois N et N-1 + `monthly_settings`, calcule `canCopyPrevious` (N-1 a des données ET il reste des lignes vides). UI cliente `BudgetEditor` : 3 sections par `parent_type`, **saisie inline** par catégorie (sauvegarde au blur + **debounce 500 ms**, pas de bouton global), **bouton « + » par section** ouvrant la **même modale catégorie** que Réglages pré-remplie sur le bon type, bouton **« Reprendre les montants du mois précédent »** (conditionnel), **récap** bas de page (3 totaux + % sur `revenue_melvin` + comparaison objectif à **3 états** + total global). Server Actions `budget/actions.ts` : `upsertBudget` (upsert `monthly_budgets` sur `(month, category_id)`, sans revalidate → saisie optimiste) et `copyPreviousMonth` (copie N-1, renvoie la map pour merge client). Helper `previousMonthStart` dans `month.ts`. **Refactor de réutilisation** : `CategoryForm` + `ColorPicker` déplacés vers `src/components/category/` (+ prop `defaultType`) ; CRUD catégorie déplacé vers `src/lib/actions/categories.ts` (revalide `/reglages` ET `/budget`) ; `reglages/actions.ts` ne garde que `saveTargets`. `npm run lint` ✅, `npm run build` ✅. | **Nouveau token design `--warn`** (ambre `oklch(0.78 0.15 70)` ≈ `#D97706`) ajouté à `globals.css` + `@theme inline` + documenté dans `VELTA_DESIGN_SYSTEM.md` (table, bloc CSS, extrait Tailwind) — décidé avec Melvin car le design system ne couvrait pas l'état « vigilance » des SPECS §6.1. **Tailwind v4 = pas de `tailwind.config.ts`** : token ajouté en CSS-first (génère `text-warn`), conforme au choix Phase 4. **Aucune valeur calculée stockée** : totaux/% calculés à la volée côté client. **Test visuel mobile 390px non réalisé** (routes auth-gated, pas de navigateur headless ni d'identifiants Supabase) → vérif build/lint/types uniquement ; contrôle visuel + test du debounce/blur à faire côté Melvin. **Saisie optimiste** : `upsertBudget` ne revalide pas pour éviter un refetch à chaque frappe ; cohérence assurée au rechargement de page. |
| 2026-06-08 | Phase 5 | Catégories & réglages. Écran `/reglages` passé de squelette à 4 sections (scroll vertical) : **Catégories**, **Objectifs %**, **Export CSV** (placeholder désactivé), **Compte** (logout réel + placeholder mot de passe). Page = Server Component (`page.tsx`) qui charge catégories + comptes de transactions par catégorie + `monthly_settings` du mois, et délègue l'interactif à des îlots clients. Mutations via **Server Actions** (`reglages/actions.ts` : `createCategory`/`updateCategory`/`deleteCategory`/`saveTargets`, auth check + `revalidatePath`). CRUD catégories complet (`CategoriesSection` liste groupée par `parent_type` ; `CategoryForm` en modale : nom, type, **palette 12 couleurs** `ColorPicker`, mode de partage, flag crédit + 3 champs conditionnels). Objectifs % (`TargetsSection`) : auto-complétion du 3e champ, validation total = 100 %, upsert `monthly_settings`. Helpers `src/lib/month.ts` + `src/lib/categoryMeta.ts` (palette, libellés FR, ordre parents). `npm run lint` ✅, `npm run build` ✅ (`/reglages` rendu dynamique ƒ). | **Choix : scroll vertical plutôt qu'onglets** — le design system ne définit pas de composant de sous-onglets, on ne l'improvise pas (cf. SPECS §3). **Palette catégories définie dans `categoryMeta.ts`** : la charte délègue explicitement ce choix (12-16 couleurs harmonieuses, SPECS §3) ; 12 tons sourds façon Notion, **lime exclu** (réservé au signal d'action). **Suppression bloquée si transactions liées** : la FK `transactions.category_id` est `on delete restrict` → l'UI désactive le bouton + affiche le nb de transactions ; cohérent avec la contrainte DB. **Test mobile 390px non visuel** (routes auth-gated, pas de navigateur headless ni d'identifiants Supabase) → vérif build/lint/types uniquement ; contrôle visuel à faire côté Melvin (login + DevTools responsive). Export CSV et changement de mot de passe restent des placeholders (Phase 13 / plus tard). |
| 2026-06-07 | Phase 3 | Base de données. Migration `supabase/migrations/001_initial_schema.sql` : 5 tables (`categories`, `monthly_budgets`, `transactions`, `monthly_settings`, `flore_payments`) + 3 enums (`category_type`, `share_mode`, `budget_status`), triggers `updated_at`, RLS + policy « auth users only » (FOR ALL, `auth.uid() IS NOT NULL`) sur les 5 tables. Exécutée via SQL Editor. Types TS dans `src/types/database.ts` (Row/Insert/Update). Test de lecture sur `categories` OK puis fichier de test supprimé. | **Exécution manuelle** : la clé `.env.local` est une clé *publishable* (anon) qui ne peut pas faire de DDL → SQL passé à la main dans le SQL Editor. **`parent_type` = colonne `text` générée** (et non enum) : un `CASE` renvoyant du texte vers une colonne enum levait `column is of type parent_type but default expression is of type text`. Choix : colonne générée STORED `text` dérivée de `type` (seule valeur « calculée » stockée, mais auto-cohérente). **`monthly_settings` / `flore_payments` sans `created_at`/`updated_at`** (non listés dans SPECS §5, schéma respecté à la lettre). `on delete restrict` sur `transactions.category_id` pour ne pas effacer l'historique. Migration rendue rejouable (bloc `drop ... if exists` en tête) après un 1er run partiel. |
