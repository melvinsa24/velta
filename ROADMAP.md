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

### Phase 5bis — Pivot modèle Dépenses ✅
> Suite à la clarification produit du 09/06/2026, le modèle de données change. Cf. SPECS §4–§6.
> Réalisée en 2 sessions : **session 1 = backend**, **session 2 = refonte UI**.
- [x] **(S1)** Migration SQL `003_expenses_pivot.sql` : table `expenses`, `monthly_budgets.expense_id` + unique (month, expense_id), `transactions.expense_id` + `category`, drop table `categories` (exécutée dans Supabase)
- [x] **(S1)** Types (`expenses`, MonthlyBudget/Transaction repivotés) + `categoryMeta` (map `CATEGORY_PARENT`)
- [x] **(S1)** Actions `expenses.ts` (create/update/archive) + `budget/actions.ts` repivoté (`upsertBudget`, `copyPreviousMonth` sur expense_id)
- [x] **(S1)** Composant `ExpenseForm` (ex-CategoryForm) + `ColorPicker` déplacés dans `components/expense/`
- [x] **(S2)** Écran Réglages finalisé : Objectifs % + Export (placeholder) + Compte, sans section Catégories
- [x] **(S2)** Écran Budget refondu : sections Type > regroupement par Catégorie (`CATEGORIES_BY_PARENT`), saisie inline du montant (debounce + flush) via `upsertBudget`, modale `ExpenseForm` création (pré-filtrée) / édition + montant du mois
- [x] **(S2)** Archivage de dépense (confirmation inline dans `ExpenseForm`) + reprise N-1 ; récap totaux via `CATEGORY_PARENT` ; suppression de `BudgetEditor.tsx.bak`

### Phase 6 — Budget prévisionnel ✅ (à refondre en Phase 5bis)
- [x] Écran budget prévisionnel
- [x] Liste éditable des dépenses par parent_type
- [x] Saisie inline des montants
- [x] Récap des 3 totaux + comparaison à l'objectif %

### Phase 7 — Transactions ✅
- [x] Bouton "+" opérationnel (désormais le **FAB** flottant, plus la tab bar — cf. refonte navigation)
- [x] Modale de saisie : date, montant, rattachement (dépense prévue OU catégorie libre), description
- [x] Liste des transactions du mois (chronologique inverse, groupée par jour)
- [x] Édition / suppression des transactions
- [x] Filtres par catégorie + "imprévues uniquement" (filtre « par dépense prévue » de SPECS §7.4 **volontairement reporté** : liste courte en usage réel, le filtre catégorie suffit)

### Phase 8 — Dashboard du mois
- [ ] Affichage du mois en cours + sélecteur de mois
- [ ] Bloc "reste à dépenser" (réel + après charges fixes)
- [ ] 3 jauges besoins / envies / épargne vs objectif
- [ ] Liste des dépenses avec budget vs réel + barres de progression
- [ ] Bloc "Dépenses imprévues" (transactions sans expense_id)
- [ ] Alertes visuelles (>80%, dépassement)
- [ ] Note du mois (champ texte libre)

### Phase 9 — Workflow mois
- [ ] Bouton "Nouveau mois" (avec confirmation)
- [ ] Logique de reprise par catégorie (Besoins → montants ; Envies/Épargne → libellés à 0)
- [ ] Décrément automatique des crédits, archivage à 0
- [ ] Bouton "Archiver" et "Rouvrir un mois"

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
| 2026-06-09 | Phase 5bis · S1 | **Backend** : migration 003 (expenses + repivot monthly_budgets/transactions), types repivotés, `categoryMeta.CATEGORY_PARENT`, actions `expenses.ts` + `budget/actions.ts` (upsertBudget/copyPreviousMonth sur expense_id), `ExpenseForm`+`ColorPicker` dans `components/expense/`. Stubs build-green (Réglages sans Catégories, Budget placeholder). `BudgetEditor.tsx.bak` conservé. Migration non exécutée (à coller dans Supabase). UI Budget → session 2. |
| 2026-06-09 | Phase 5bis · S2 | **Refonte UI** : migration 003 exécutée. Budget refondu (`BudgetEditor` v2 : sections Type > sous-groupes Catégorie via `CATEGORIES_BY_PARENT`, saisie inline du montant → `upsertBudget`, modale `ExpenseForm` création pré-filtrée / édition + montant du mois, archivage avec confirmation inline, reprise N-1, récap via `CATEGORY_PARENT`). Réglages finalisé (Objectifs % + Export + Compte). `BudgetEditor.tsx.bak` supprimé. Phase 5bis terminée. |
| 2026-06-10 | Phase 7 | **Transactions**. Actions `lib/actions/transactions.ts` (create/update/delete ; `month` recalculé serveur depuis `date`, `category` figée depuis `expenses` en option A). `TransactionForm` partagé FAB + édition (toggle Dépense prévue / Catégorie libre, suppression confirmée inline). Écran `/transactions` (liste groupée par jour, filtres catégorie + imprévues). FAB câblé via `getMonthExpenseOptions` chargé dans `(app)/layout` (async → dette technique notée : refetch à chaque navigation, à optimiser Phase 14). Helpers `month.ts` (`todayIso`, `monthStartOfDate`, `formatDayLabel`). Lien temporaire « Voir les transactions » dans le drawer (à retirer Phase 8). |
