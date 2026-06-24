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

### Phase 10 — Répartition Flore
- [ ] Écran dédié
- [ ] Inputs revenus (moi + Flore + APL)
- [ ] Calcul ratio prorata automatique
- [ ] Liste des dépenses partagées avec parts respectives
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
- [ ] Donut annuel par type
- [ ] Tableau 12 mois (3 lignes : besoins / envies / épargne)
- [ ] Affichage propre des mois vides (tirets, pas d'erreurs)

### Phase 13 — Export & PWA
- [ ] Bouton export CSV (toutes les transactions + budgets + dépenses)
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
