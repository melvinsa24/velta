# Roadmap — Dashboard financier

> Voir `SPECS.md` pour les spécifications détaillées.

---

## 🚀 v1 — MVP fonctionnel

> Objectif : avoir un outil utilisable au quotidien le plus vite possible.

### Phase 1 — Setup technique ✅
- [x] Créer projet Next.js (App Router, TypeScript, Tailwind)
- [x] Initialiser repo GitHub + lier à Vercel
- [x] Créer projet Supabase (région Europe)
- [x] Configurer variables d'environnement (Supabase URL + anon key)
- [x] Premier déploiement Vercel (page "Hello world")

### Phase 2 — Authentification ✅
- [x] Installer client Supabase
- [x] Créer mon compte utilisateur unique manuellement dans Supabase
- [x] Page de login (email + mot de passe)
- [x] Middleware d'authentification (redirection si non connecté)
- [x] Bouton déconnexion

### Phase 3 — Base de données ✅ (à refondre en Phase 5bis)
- [x] Créer les tables : `categories`, `monthly_budgets`, `transactions`, `monthly_settings`, `flore_payments`
- [x] Configurer Row Level Security
- [x] Tester les insertions / lectures via le client Supabase

### Phase 4 — Charte graphique ✅
- [x] Définir variables CSS (couleurs, polices, radius)
- [x] Composants de base : Button, Card, Input, Select
- [x] Layout général + tab bar
- [x] Navigation entre les écrans

### Phase 5 — Catégories & paramètres ✅ (partiellement obsolète, voir Phase 5bis)
- [x] Écran paramètres
- [x] CRUD catégories — **obsolète, à supprimer en Phase 5bis**
- [x] Réglage de l'objectif %

### Phase 5bis — Pivot modèle Dépenses 🔄
> Suite à la clarification produit du 09/06/2026, le modèle de données change. Cf. SPECS §4–§6.
- [ ] Migration SQL : créer table `expenses`, modifier `monthly_budgets` (lien vers expenses), `transactions` (lien vers expenses + champ category), supprimer table `categories`
- [ ] Migration SQL : refonte `monthly_settings` — remplacer `revenue_melvin` par `revenue_planned` (prévisionnel), `revenue_salaire` (réel), `revenue_autres` (réel fourre-tout) ; `apl` reste ; ajouter `revenue_flore`
- [ ] Refondre l'écran Réglages : supprimer la section Catégories (ne garder qu'Objectifs % + Compte + placeholder Export)
- [ ] Refondre l'écran Budget : hiérarchie Type > Catégorie > Dépenses, modale "Nouvelle dépense" remplace "Nouvelle catégorie", champ "Revenus prévus" tout en haut

### Phase 6 — Budget prévisionnel ✅ (à refondre en Phase 5bis)
- [x] Écran budget prévisionnel
- [x] Liste éditable des dépenses par parent_type
- [x] Saisie inline des montants
- [x] Récap des 3 totaux + comparaison à l'objectif %

### Phase 7 — Transactions ✅
- [x] Bouton "+" central de la tab bar opérationnel
- [x] Modale de saisie : date, montant, rattachement (dépense prévue OU catégorie libre), description
- [x] Page Historique > Dépenses (liste chronologique inversée, groupement par jour)
- [x] Édition / suppression des transactions
- [x] Filtres par catégorie, "imprévues uniquement"
- [x] Sélecteur de mois sur Historique (réalisé en Phase 8a)

### Phase 8a — Historique + Revenus ✅
> Migration 004 (`revenue_planned` ex-`revenue_melvin`, ajout `revenue_salaire` + `revenue_autres`) à exécuter manuellement dans Supabase SQL Editor.
- [x] Renommage page Transactions → Historique + sous-onglets Dépenses / Revenus (soulignement sobre)
- [x] Sous-onglet Revenus : saisie `revenue_salaire` + `revenue_autres` (sauvegarde au blur, envoyés ensemble) ; APL ma part en lecture seule (calculée depuis Flore, "—" si APL nulle ou Flore non renseigné) ; total réel
- [x] Champ "Revenus prévus" (`revenue_planned`) en haut de l'écran Budget, reconduit du mois précédent, base des % du récap
- [x] Sélecteur de mois sur Historique (param URL `?month=`, fix transactions antidatées)
- [x] Actions `monthlySettings.ts` (`upsertRevenusReels`, `upsertRevenuPlanned`, `upsertNote`)

### Phase 8b — Dashboard du mois ✅
- [x] Affichage du mois en cours sur Dashboard (label statique ; sélecteur de mois reporté Phase 9)
- [x] Lien vers Historique depuis le Dashboard (label d'état « revenus non renseignés » → `/historique`)
- [x] Carte héro : reste à dépenser réel (`revenue_melvin_réel − Σtransactions`) + secondaire après charges fixes
- [x] 3 jauges besoins / envies / épargne vs objectif (base = `revenue_melvin_réel`)
- [x] Liste des dépenses avec budget vs réel + barres de progression
- [x] Bloc "Dépenses imprévues" (transactions sans expense_id)
- [x] Alertes visuelles (>80%, dépassement)
- [x] Note du mois (champ texte libre, via `upsertNote`)

### Phase 9 — Workflow mois ✅
> Migration 005 (`monthly_settings.status` + fonction `roll_to_next_month`) à exécuter manuellement dans Supabase SQL Editor.
- [x] Bouton "Nouveau mois" (avec confirmation) — bannière Dashboard + section Réglages
- [x] Logique de reprise par catégorie (Besoins → montants ; Envies/Épargne → 0)
- [x] Décrément automatique des crédits, archivage à 0
- [x] Boutons "Clôturer" et "Rouvrir le mois précédent"
- [x] Détection automatique du changement de mois (mois actif vs calendaire)
- [x] Bloc "Crédits en cours" sur le Dashboard

### Phase 10a — Répartition Flore : saisie & calculs ✅
- [x] Écran dédié
- [x] Inputs du mois (APL brute + revenus de Flore, sauvegarde au blur)
- [x] Calcul ratio prorata automatique
- [x] Liste des dépenses partagées avec parts respectives
- [x] Total "Flore me doit" (carte héro)
- [x] Cas spécial revenu Flore = 0 (basculer tout en 100% perso + bannière)

### Phase 10b — Répartition Flore : remboursements ✅
- [x] Module remboursements (ajout, liste, solde restant)

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
- [ ] Donut annuel par type
- [ ] Tableau 12 mois (3 lignes : besoins / envies / épargne)
- [ ] Affichage propre des mois vides (tirets, pas d'erreurs)

### Phase 13 — Export & PWA
- [ ] Bouton export CSV (toutes les transactions + budgets + dépenses)
- [x] Configuration PWA (manifest.json + icônes 192/512/apple-touch)
- [x] Meta tags iOS pour ajout écran accueil
- [ ] Test installation depuis Safari iPhone
- [x] Swipe gauche→droite pour ouvrir le drawer (Phase 13a)

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

> À démarrer une fois la v1 stable et utilisée pendant 1-2 mois.

### Pot commun "Provisions" (sinking funds)
- [ ] Nouveau type "Provisions" à côté de besoins/envies/épargne
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
- [ ] Stats avancées : top 10 dépenses du mois, évolution dépense sur 6 mois
- [ ] Raccourcis clavier (desktop)

### Charges annuelles intelligentes
- [ ] Marquer une dépense comme "annuelle" avec mois prévu
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

## 🧯 Dette technique identifiée

> Problèmes connus, diagnostiqués, **non corrigés**. À traiter avant les chantiers qui en dépendent.

### Divergence prorata : snapshot vs calcul à la volée
- **Constat** : pour une dépense `split_prorata`, la part nette de Melvin existe sous deux formes qui ne sont pas tenues synchronisées.
  - `monthly_budgets.planned_amount` = **snapshot** écrit par `addProrataExpense` / `updateProrataExpense` (`prorata_total_amount × ratioMelvin` au moment de l'écriture, sur le mois actif uniquement). C'est ce que lit le **Dashboard**.
  - `BudgetEditor` **recalcule** `prorata_total_amount × ratioMelvin` à la volée depuis le ratio du mois. C'est ce qu'affiche l'écran **Budget** (`ProrataExpenseRow`).
- **Symptôme** : les deux valeurs divergent dès qu'un revenu du mois (salaire, autres, revenus de Flore) est modifié APRÈS la création / dernière édition de la dépense prorata — le ratio change, le snapshot non. Dashboard et Budget affichent alors deux « prévu » différents pour la même dépense.
- **Règle cible à implémenter** : calcul à la volée sur un mois `in_progress` (le ratio du mois fait foi tant que le mois est ouvert) ; snapshot sur un mois `closed` (le mois est figé, la valeur ne doit plus bouger). Une seule source de vérité par écran, dérivée de `status`.
- **Impact** : **bloque l'extension de `ExpenseQuickEntrySheet` aux écrans Budget et Flore** — la sheet a besoin d'un « prévu » non ambigu pour pré-remplir le restant. Le Dashboard n'est pas concerné (il lit le snapshot, seule valeur affichée sur cet écran).
- **Décision** : on ne corrige rien pour l'instant. La saisie rapide reste limitée au Dashboard.

---

## 📌 Principes de développement

- **Itérer petit** : ne pas vouloir tout faire d'un coup, livrer phase par phase
- **Tester sur mobile** à chaque phase (c'est le device principal)
- **Pas de gold plating** : si une feature n'est pas dans la roadmap, on l'ajoute après réflexion
- **Garder les données propres** : tous les calculs à la volée, pas de valeurs dérivées stockées
- **Sauvegarder régulièrement** : export CSV ponctuel pour avoir une copie locale

---

## 📝 Journal de bord

| Date | Phase | Note |
|---|---|---|
| 2026-06-08 | Phase 5 | Réglages + CRUD catégories + objectifs % (CategoryForm, ColorPicker, TargetsSection) |
| 2026-06-08 | Phase 6 | Budget prévisionnel + token --warn + refactor CategoryForm dans `components/category/` |
| 2026-06-09 | Pré-Phase 7 | Migration 002 : ajout `monthly_budgets.label` + `transactions.monthly_budget_id`, drop unique constraint (`month`, `category_id`). Renommage UI : "Type" reste "Type", "Catégorie" reste, mapping Dépense = lignes du budget. |
| 2026-06-09 | Phase 5bis | **Pivot modèle Dépenses** : refonte SPECS complète. Nouveau modèle Type > Catégorie (5 valeurs fixes) > Dépense (créée par l'utilisateur). Table `expenses` séparée, table `categories` supprimée. Couleur / share_mode / is_credit migrent sur la dépense. Réglages perd la section Catégories. |
| 2026-06-10 | Phase 7 | Transactions : FAB opérationnel, modale de saisie, liste Historique > Dépenses, filtres catégorie + imprévues, édition/suppression. Sélecteur de mois reporté Phase 8. |
| 2026-06-10 | Pré-Phase 8 | **Clarification modèle revenus** : `revenue_melvin` → `revenue_planned` (prévisionnel, écran Budget) + `revenue_salaire` + `revenue_autres` (réels, Historique > Revenus). APL saisie dans Flore, part Melvin calculée à la volée, lecture seule dans Historique. Onglet renommé Historique avec sous-onglets Dépenses / Revenus. |
| 2026-06-22 | Phase 8b | **Dashboard du mois**. Helper `src/lib/calculs.ts` (`revenusReelsMelvin` — revenu réel jamais stocké, part APL au prorata ; `realTotalsByParent` — réel ventilé par Type). `dashboard/page.tsx` Server Component : charge `monthly_settings` + transactions + `monthly_budgets` joints `expenses(label,color,category)` du mois en cours, calcule tous les agrégats à la volée. Carte héro `--ink` (reste réel + reste après charges fixes prévues non couvertes, SPECS §9.5 ; « — » + lien Historique si revenu nul). 3 jauges lime vs objectif (code couleur écart ±5/15 %). Liste dépenses budget vs réel (mini-jauge --ink, --warn ≥80 %, bordure --down + « ⚠ Dépassé de X€ » si dépassement). Bloc Dépenses imprévues (transactions sans `expense_id` regroupées par catégorie + total). `MonthNote` (client, sauvegarde auto débouncée 800 ms via `upsertNote`). Mois figé au mois en cours (sélecteur reporté Phase 9). |
| 2026-06-10 | Phase 8a | **Historique + Revenus**. Migration 004 (revenue split — à exécuter manuellement). Types `MonthlySettings` repivotés. Actions `monthlySettings.ts` (upsertRevenusReels / upsertRevenuPlanned / upsertNote, revalidate /historique + /dashboard). Dossier `transactions/` → `historique/` (git mv), lien temporaire du drawer retiré, revalidatePath transactions → /historique. `HistoriqueScreen` (sélecteur de mois URL `?month=` via `MonthSelector` réutilisable + helpers `nextMonthStart`/`normalizeMonth`, sous-onglets sobres Dépenses/Revenus). `RevenusPanel` (salaire/autres au blur, APL ma part calculée lecture seule, total réel). Champ "Revenus prévus" en haut du Budget (`upsertRevenuPlanned` au blur, reconduit du N-1, base des % récap). |
| 2026-06-24 | Phase 8 (clôture) | **Polish navigation + durcissement archived**. Lien `/historique` ajouté au drawer (icône `History`, entre Budget et Flore). SPECS §5 + design system réalignés sur la navigation réelle : header fixe + drawer latéral (plus de tab bar), FAB lime flottant ; « écran secondaire » réservé à Simulateur + Récap annuel. Audit de toutes les requêtes touchant `monthly_budgets`/`expenses` : exclusion des dépenses archivées (`expenses!inner(archived)` + `archived=false`) sur le dashboard et sur le Budget (mois courant, N-1, et fix `copyPreviousMonth` qui ressuscitait le budget d'une dépense archivée). Volontairement non filtrées : join transactions↔expenses de l'Historique et `resolveCategory` (SPECS §9.6/§9.7, l'historique doit conserver les dépenses archivées). |
| 2026-06-24 | Phase 9 | **Workflow de gestion des mois**. Migration 005 (`monthly_settings.status` + fonction Postgres `roll_to_next_month` — bascule atomique : clôture + création M+1 + reconduction revenu/objectifs + budgets besoins reconduits / envies-épargne à 0 + décréments crédit + archivage à 0 ; à exécuter manuellement). **Décision d'archi** : le statut de mois passe de `monthly_budgets` (par ligne) à `monthly_settings` (par mois) — l'ancienne colonne devient vestigiale. Notion de **mois actif** (`getMonthContext`, `src/lib/data/activeMonth.ts` : plus grand mois `in_progress`, fallback calendaire) : Dashboard / Budget / Réglages / FAB suivent ce mois et non plus `currentMonthStart()`. Server actions `months.ts` (`newMonth` via `supabase.rpc`, `closeMonth`, `reopenMonth`). `ConfirmModal` réutilisable (composé sur `Modal`). Dashboard : bannière de bascule (`MonthRolloverBanner`, si mois actif en retard) + bloc « Crédits en cours » (`src/lib/data/credits.ts`). Réglages : section « Gestion des mois » (`MonthManagementSection` : statut + Nouveau mois / Clôturer / Rouvrir, chacun confirmé). `saveTargets` écrit désormais sur le mois actif (param `month`). Avance d'un seul mois à la fois (préserve les décréments crédit). `next build` + lint OK. |
| 2026-06-24 | Correctifs post-Phase 9 | Correctifs : bouton Rouvrir, saisie bloquée mois clôturé, détail imprévues au tap, filtre IS NULL dépenses imprévues. |
| 2026-06-28 | Navigation mois + lecture seule | **Blocage navigation future + mois clôturés en lecture seule (tous écrans)**. `MonthSelector` : prop `maxMonth` → flèche « suivant » désactivée (grisée, non cliquable) dès que le mois affiché atteint le mois calendaire (jamais de mois futur) ; Flore/Historique passent `maxMonth = calendarMonth`/`currentMonthStart()`. Lecture seule sur mois `closed` (statut du mois AFFICHÉ pour les écrans à sélecteur, du mois actif pour Dashboard/Budget) : composant partagé `ClosedMonthBanner` (« Mois clôturé — consultation uniquement », surface-2/ink-2, sans bordure) ; champs `disabled` + grisés (`disabled:bg-surface-2 disabled:text-ink-3`) ; boutons d'action masqués. Couvre Flore (FloreInputs, FloreProrataExpenses CTA/édition/suppression, FlorePayments CTA/suppression), Historique (TransactionList lignes inertes, RevenusPanel salaire/autres), Dashboard (MonthNote), Budget (bandeau aligné sur le composant partagé, readOnly déjà en place). Historique : `status` ajouté au `select` monthly_settings. FAB inchangé (lié au mois actif, reste accessible). Aucune logique de calcul ni action de revalidation touchée. `next build` + lint OK. |
| 2026-06-28 | Bugfix Flore | **⚠️ DIAGNOSTIC ERRONÉ — ce correctif n'a PAS résolu le bug (vraie cause identifiée le 2026-07-10, voir dernière ligne). Conservé pour traçabilité.** ~~Duplication DOM sur `/flore` (revalidation App Router)~~. Symptôme : copies de l'écran Flore empilées dans le DOM = nb de mois d'écart depuis le mois actif (cache PWA exclu). Cause : `revalidatePath('/flore')` (type 'page' par défaut) sur une route dynamique `?month=` empile des segments dans le cache routeur ; déclenché en masse par `upsertFloreInputs` (blur APL/Revenus) puis révélé en navigation. Fix : toutes les revalidations de `/flore` (+ `/historique`, même route `?month=`) passent en `revalidatePath(path, 'layout')`. Touche `monthlySettings.ts` (`revalidateAll` + set `DYNAMIC_MONTH_PATHS`), `expenses.ts` (helper `revalidateProrata`, 3 call sites prorata), `florePayments.ts` (2 appels). Routes non dynamiques (/dashboard, /budget, /reglages) restent en 'page'. `next build` + lint OK. Vérif déploiement : naviguer juin→avril→août→mai sans doublon. |
| 2026-06-28 | Phase 13a | **PWA + swipe drawer**. PWA : `public/manifest.json` (standalone, portrait, start_url `/dashboard`, background `#F4F5F7`, theme `#0C0E12`) ; `layout.tsx` via API Metadata Next 16 (`manifest`, `appleWebApp` → status-bar black-translucent + title ; legacy `apple-mobile-web-app-capable` via `other` car Next 16 n'émet plus que `mobile-web-app-capable`). Icônes générées via `sharp` (€ clair `#F4F5F7` sur fond `#0C0E12`, DejaVu Sans Bold) : `public/icon-192.png`, `icon-512.png` (+ purpose maskable), `apple-touch-icon.png` 180px. `viewportFit: 'cover'` déjà présent. Safe areas (PWA standalone, encoche + home indicator) : contenu `(app)/layout` pt/pb `env(safe-area-inset-*)`, header + drawer `pt env(top)` / `pb env(bottom)`, FAB `bottom calc(2rem + env(bottom))`. Swipe : listeners `touchstart/end` passifs sur `window` dans `AppHeader` (monté partout → geste global), pilotent le même état `open` (pas de second système). Détection au touchend (pas de preventDefault → scroll vertical + swipe-retour iOS intacts) : horizontal dominant + (≥60px ou vitesse ≥0,5px/ms) ; ouverture ignore les 20px du bord gauche (zone retour iOS) ; fermeture sur swipe gauche. Transition drawer inchangée (300ms). `next build` + lint OK. |
| 2026-06-27 | Phase 10c | **Dépenses prorata gérées depuis Flore**. Migration 006 (`expenses.prorata_total_amount numeric null` — à exécuter manuellement). Modèle : `prorata_total_amount` = total (source de vérité) ; `monthly_budgets.planned_amount` = part nette de Melvin (snapshot, comportement besoins_fixes pour dashboard + `roll_to_next_month`) ; part nette recalculée à la volée à l'affichage (Flore + Budget) via `floreRatio` (APL exclue, décision produit pour cohérence/non-circularité). Décision : les prorata quittent la Section 3 « Charges partagées » (50/50 uniquement) et vivent dans une section dédiée. `ExpenseForm` : `split_prorata` retiré du sélecteur (conservé si la dépense éditée l'est déjà — legacy). Actions `expenses.ts` : `addProrataExpense` (insert expense besoins_fixes/split_prorata/couleur défaut + ligne budget mois actif = part nette) et `updateProrataExpense` (label + total, rafraîchit la part nette du mois actif uniquement — mois passés intacts), revalident `/flore /budget /dashboard /reglages`. `flore/page.tsx` : requête prorata dédiée, héro « Flore me doit » recalculé (50/50 + prorata sur le total) ; `FloreProrataExpenses.tsx` (section CTA + liste part nette / Total · Part Flore / cas Flore=0 + hint legacy + modales add/edit, suppression = `archiveExpense`). Budget : `ProrataExpenseRow` non éditable inline (part nette + « Géré depuis l'onglet Flore »), totaux Besoins sur la part nette. Historique : jointure étendue + sous-ligne « Montant total : X€ ». `next build` + lint OK. |
| 2026-06-27 | Phase 10b | **Module Flore — remboursements**. Aucune migration (`flore_payments` + types déjà présents). Module ISOLÉ (SPECS §9.2) : actions `florePayments.ts` (`addFlorePayment` — `month` figé serveur via `monthStartOfDate`, `deleteFlorePayment`) ne revalident que `/flore` (aucun impact revenus/charges/ratios). Helper `formatDateLong` (« 12 juin 2026 », absolu avec année, vs `formatDayLabel` relatif). `flore/page.tsx` : 3ᵉ requête `flore_payments` du mois (tri date desc) ; Section 5 `<FlorePayments>` rendue **hors du bloc `hasFlore`** (toujours visible, `key={month}`). `FlorePayments.tsx` (client) : en-tête + CTA lime « Flore m'a remboursé » → `Modal` d'ajout (date défaut aujourd'hui, montant FR, note optionnelle), liste avec suppression via `ConfirmModal`, récap « Déjà remboursé » / « Reste à recevoir » (= `totalDue` théorique 10a − Σ remboursements ; « ✓ Solde apuré » en `--up` si ≤ 0). Le total « Flore me doit » (Section 4) reste inchangé par les remboursements. `next build` + lint OK. |
| 2026-06-24 | Phase 10a | **Module Flore — saisie & calculs**. Aucune migration (colonnes `apl` / `revenue_flore` déjà présentes). Helpers `calculs.ts` : `floreRatio` (ratio calculé sur les revenus de base salaire+autres / revenue_flore, **APL exclue** pour éviter la circularité — l'APL est répartie via ce ratio) et `floreShare` (50/50 → moitié, prorata → × ratio_flore). `revenusReelsMelvin` reste réservée aux ratios besoins/envies/épargne (part APL incluse). Action `upsertFloreInputs` (`monthlySettings.ts`, APL + revenue_flore au blur) + ajout `/flore` aux `REVALIDATE_PATHS` (l'APL se répercute dans Historique > Revenus). `flore/page.tsx` Server Component : mois actif par défaut (override `?month=` via `MonthSelector`), requête `monthly_budgets` joints `expenses!inner` filtrés `archived=false` + `share_mode in (split_50_50, split_prorata)`. Sections : inputs (`FloreInputs` client), ratio (2 colonnes, si flore > 0), détail charges (pastille couleur + badge mode + total + parts Moi/Flore, ligne « APL (déduite) » en négatif), carte héro `--ink` « Flore me doit » (= Σ parts Flore − part APL Flore) avec sous-ligne « Charges X€ − APL X€ ». Si `revenue_flore = 0` → bannière 100 % perso, sections 2-4 masquées. Montants à 2 décimales, `tabular`. `next build` + lint OK. |
| 2026-07-10 | Bugfix Flore (vrai correctif) | **Duplication DOM sur `/flore` — vraie cause : collision de keys React (invalide le diagnostic du 2026-06-28)**. Symptôme : à chaque navigation entre mois (`?month=`), les blocs APL/Revenus (`FloreInputs`), Remboursements (`FlorePayments`) et Dépenses au prorata (`FloreProrataExpenses`) se dupliquaient — 1 copie de plus par navigation, hard refresh nettoie (donc DOM/réconciliation, pas données ni cache PWA). **Cause racine** : ces 3 composants sont des **frères directs** dans `flore/page.tsx` et portaient **tous** `key={month}` (même valeur, ex. `2026-07-01`) → React interdit des keys identiques entre siblings (« Encountered two children with the same key »), casse sa réconciliation par key et duplique/omet des enfants au fil des updates. Confirmé par logs temporaires MOUNT/UNMOUNT (anciennes instances jamais démontées) + erreur console pointant `page.tsx:244/255`. Le fix du 2026-06-28 (`revalidatePath 'layout'`) reposait sur un mauvais diagnostic (cache routeur) et ne touchait pas le chemin de navigation — laissé en place, sans effet de bord connu. **Fix** (à la source, léger) : keys préfixées par section — `key={\`inputs-${month}\`}` / `payments-` / `prorata-` — `month` conservé dedans, donc remount au changement de mois préservé (fix state-staleness d'origine intact) et plus aucune collision. Logs temporaires retirés. Pattern ailleurs : Historique/Budget n'ont qu'un seul élément keyé par mois (dans un wrapper client) → pas de collision ; Dashboard n'a que des clés de liste. `tsc --noEmit` + `eslint` + `next build` OK. Testé iPhone réel : navigation multi-mois sans doublon, console propre, blur enregistré sur le bon mois. |
| 2026-09-01 | Saisie rapide depuis le Dashboard | **Raccourci de saisie sur une ligne de dépense**. Tap sur une ligne de « Dépenses du mois » → bottom sheet `ExpenseQuickEntrySheet` (`src/components/expense/`) : en-tête (libellé + `Prévu · Dépensé · Restant`), champ Montant **pré-rempli au restant** (`planned − Σ transactions`, arrondi 2 déc., sélectionné au focus via `ref` + rAF — `autoFocus` peu fiable dans une modale iOS), Date, Note (→ colonne `description`), CTA lime dont le libellé suit la saisie (« Valider 455,30 € », 2 décimales), puis la liste des transactions du mois sur cette dépense (tap → édition). **Sheet à DEUX VUES dans une seule `Modal`** (jamais deux modales empilées : `Modal` verrouille/rend le scroll du body au montage/démontage, une modale interne qui se ferme le rendrait trop tôt) ; la vue édition réutilise `TransactionForm` (+ nouvelle prop optionnelle `onCancel`, défaut `onDone` → « Annuler » revient à la saisie au lieu de fermer). **Aucune nouvelle Server Action** : `createTransaction` fait déjà `requireClient` + `{ error }` + `month` figé depuis la date + `category` relue depuis `expenses` + `revalidatePath('/dashboard')`. Nouveau helper `defaultDateForMonth` (`lib/month.ts`) : aujourd'hui si l'on est dans le mois affiché, sinon dernier jour de ce mois — évite qu'une saisie faite depuis un mois actif en retard sur le calendrier (cf. `MonthRolloverBanner`) atterrisse dans un autre mois et disparaisse de la vue. `ExpenseLine` extraite de `dashboard/page.tsx` vers `ExpenseLineCard.tsx` (client, `<button>` + `ChevronRight`, porte l'état de sa sheet ; visuel inchangé) ; la requête transactions du dashboard gagne `id, date, description` + tri date/created_at desc, et le mois charge `getMonthExpenseOptions` (vue édition). `Input` typé `ComponentPropsWithRef<'input'>` (ref-as-prop React 19). Mois clôturé : sheet en consultation (`ClosedMonthBanner`, pas de formulaire, lignes inertes) — blocage client uniquement, comme le FAB, qui reste inchangé. Corps de la sheet borné `max-h-[70vh]` + scroll interne (petit écran / clavier ouvert). **Périmètre volontairement limité au Dashboard** : le portage sur Budget et Flore est bloqué par la dette « divergence prorata » (cf. section dédiée). `tsc --noEmit` + `eslint` + `next build` OK. |
