
# Dashboard financier personnel — Spécifications

> Application web personnelle de gestion de budget. Mono-utilisateur (Melvin). Architecture mobile-first, installable comme PWA sur iPhone via Safari.
> Nom de l'application : Velta

---

## 1. Vision produit

Un dashboard financier qui me permet de :

1. Définir un **budget prévisionnel mensuel** sous forme de **dépenses prévues** (Loyer, Courses, PEA, etc.)
2. Suivre mes **transactions réelles** au fil du mois (saisie rapide depuis mobile), reliées à une dépense prévue ou non
3. Visualiser le **ratio besoins / envies / épargne** vs un objectif fixé
4. Calculer la **répartition équitable des charges** avec ma copine Flore (qui n'utilise pas l'outil)
5. **Simuler** l'impact d'une dépense ponctuelle sur mon budget mensuel
6. Avoir un **récap annuel** avec graphiques

**Philosophie** : pas de connexion bancaire, je saisis manuellement. L'outil est un coach, pas un tracker automatique.

---

## 2. Stack technique

- **Framework** : Next.js (App Router) + TypeScript
- **Style** : Tailwind CSS v4 (CSS-first, via `@theme` dans `globals.css`)
- **Base de données + Auth** : Supabase (plan gratuit, région Europe)
- **Hébergement** : Vercel (plan gratuit)
- **Graphiques** : Recharts
- **PWA** : configuration pour ajout à l'écran d'accueil iOS

---

## 3. Charte graphique

> **Source unique de vérité : `VELTA_DESIGN_SYSTEM.md`** (à la racine du projet).
>
> Ce fichier contient l'intégralité des décisions de design : tokens couleurs (variables CSS + équivalents Tailwind), typographie, rayons, espacement, ombres, composants de l'écran dashboard, états & interactions, do/don't.
>
> **Aucune décision de design ne doit être prise en dehors de ce fichier.** Si un point n'y est pas couvert, demander avant de coder — ne pas improviser.

### Principes directeurs (rappels)

- **Light only**, pas de dark mode global en v1. Une seule carte « héro » est en near-black (`--ink`), c'est un accent de contraste, pas un thème sombre.
- **Mobile-first** : cibles tactiles ≥ 44px, une colonne.
- **Accent lime rare** : 5 à 10 % de la surface visible maximum. Un seul élément lime visible par zone d'écran. Le lime est un *signal*, pas une décoration.
- **Une seule typo** : Helvetica.
- **Un seul rayon** : 10px partout, sauf pilules/chips/jauges/avatar (ronds, `999px`).

### Code couleur dépenses

Chaque dépense créée par l'utilisateur a une couleur personnalisable (sélecteur avec palette de 12 couleurs prédéfinies harmonieuses avec la charte, définies dans `categoryMeta.ts`).

---

## 4. Vocabulaire & hiérarchie

Trois niveaux à bien distinguer :

| Niveau | Nom | Valeurs | Origine |
|---|---|---|---|
| 1 | **Type** | Besoins · Envies · Épargne | Fixe, hardcodé |
| 2 | **Catégorie** | Besoins fixes · Besoins variables · Envies vélo · Envies autres · Épargne | Fixe, hardcodé |
| 3 | **Dépense** | Loyer, Courses, PEA, Resto, etc. | Créée par l'utilisateur |

**Mapping catégorie → type :**
- `besoins_fixes`, `besoins_variables` → Besoins
- `envies_velo`, `envies_autres` → Envies
- `epargne` → Épargne

> Une **dépense** appartient à une **catégorie**, qui appartient à un **type**. Les types et catégories ne sont jamais créés à la main par l'utilisateur — ils sont prédéfinis et fixes.

---

## 5. Structure de l'application

### Navigation

**Tab bar basse** (mobile), comportant 4 onglets + un bouton **+** central pour la saisie rapide d'une transaction. Détails visuels (verre dépoli, point lime sur l'onglet actif) dans `VELTA_DESIGN_SYSTEM.md`.

**Structure de la tab bar :**

| Position | Écran | Icône Lucide |
|---|---|---|
| 1 | Dashboard | `LayoutDashboard` |
| 2 | Budget | `Wallet` |
| 3 | **+** (saisie transaction) | `Plus` — bouton lime central |
| 4 | Flore | `Users` |
| 5 | Réglages | `Settings` |

**Écrans secondaires** (accessibles depuis les onglets principaux) : Transactions (depuis Dashboard), Simulateur (depuis Budget), Récap annuel (depuis Dashboard ou Réglages).

**Bibliothèque d'icônes : Lucide React** (`lucide-react`). Aucune autre bibliothèque d'icônes ne doit être utilisée.

### Layout mobile

- Bouton **+** central de la tab bar : saisie rapide d'une transaction depuis n'importe quel écran.
- Marge d'écran : 18px (cf. design system).

---

## 6. Modèle de données

### Table `expenses` — Définitions de dépenses (persistantes)

Une dépense est une définition durable (Loyer, Courses, PEA). Elle existe indépendamment des mois ; le montant prévisionnel mensuel est dans `monthly_budgets`.

- `id` (uuid)
- `label` (text) — ex: "Loyer", "Courses", "PEA"
- `description` (text, nullable) — description longue optionnelle
- `category` (enum: `besoins_fixes`, `besoins_variables`, `envies_velo`, `envies_autres`, `epargne`)
- `color` (text, code hex)
- `share_mode` (enum: `perso_100`, `split_50_50`, `split_prorata`) — défaut: `perso_100`
- `is_credit` (boolean) — si true, expose les champs ci-dessous
- `credit_remaining_months` (int, nullable)
- `credit_end_date` (date, nullable)
- `credit_total_remaining` (numeric, nullable)
- `archived` (boolean, défaut false) — une dépense supprimée est archivée, pas effacée (pour préserver l'historique des transactions)
- `created_at`, `updated_at`

> Le `parent_type` (Besoins / Envies / Épargne) est dérivé de `category`, pas stocké.

### Table `monthly_budgets` — Montants prévisionnels par mois

- `id` (uuid)
- `month` (date, premier jour du mois)
- `expense_id` (uuid, foreign key → `expenses`)
- `planned_amount` (numeric)
- `status` (enum: `in_progress`, `closed`) — sur le mois, pas sur la ligne
- `created_at`, `updated_at`

> Une ligne par dépense par mois. Plusieurs dépenses de la même catégorie peuvent coexister (ex: Loyer + EDF dans Besoins fixes).
> Contrainte unique : `(month, expense_id)`.

### Table `transactions` — Dépenses réelles saisies via "+"

- `id` (uuid)
- `date` (date)
- `amount` (numeric)
- `expense_id` (uuid, foreign key → `expenses`, nullable) — si la transaction est reliée à une dépense prévue
- `category` (enum) — toujours rempli ; copié depuis `expenses.category` au moment de la création si `expense_id` est fourni, sinon choisi directement par l'utilisateur
- `description` (text, nullable) — ex: "Intermarché courses", "Coiffeur"
- `month` (date, premier jour du mois) — calculé pour faciliter les agrégations
- `created_at`, `updated_at`

> La duplication de `category` sur la transaction est volontaire : elle permet (1) les requêtes d'agrégat sans jointure, (2) un snapshot historique stable si la dépense parent est modifiée plus tard.

### Table `monthly_settings`

- `month` (date, premier jour du mois, primary key)
- `revenue_melvin` (numeric) — mes revenus du mois
- `revenue_flore` (numeric) — revenus de Flore (pour calcul prorata). Si 0, toutes les charges partagées deviennent 100% à moi
- `apl` (numeric, nullable) — APL touchée par moi, à reverser au prorata à Flore
- `target_needs_pct` (numeric) — ex: 50
- `target_wants_pct` (numeric) — ex: 30
- `target_savings_pct` (numeric) — ex: 20
- `note` (text, nullable) — la note libre du mois

### Table `flore_payments`

- `id` (uuid)
- `date` (date)
- `amount` (numeric)
- `month` (date) — le mois auquel le remboursement se rapporte
- `note` (text, nullable)

> Enregistre les remboursements de Flore. N'apparaît jamais dans les revenus ou les charges.

---

## 7. Fonctionnalités détaillées

### 7.1 Dashboard du mois

**Affichage en haut** :
- Mois en cours (ex: "Mai 2026")
- Bouton "Nouveau mois" (voir 7.2)
- Bouton "Archiver ce mois"

**Carte héro (Reste à dépenser)** — fond `--ink`, voir design system :
- **Reste à dépenser réel** : `revenus du mois − Σ(transactions réelles)` → gros chiffre central tabulaire
- **Reste à dépenser après charges fixes prévues** : `revenus − Σ(transactions) − Σ(planned_amount des dépenses de catégorie besoins_fixes non encore couvertes par une transaction)` (affichage secondaire)

**Bloc ratios** :
- **Ratio actuel besoins / envies / épargne** vs objectif → 3 jauges horizontales (jauge lime sur piste `--surface-2`) avec code couleur sémantique : vert `--up` si dans la cible ±5%, ambre `--warn` en vigilance 5-15%, rouge `--down` >15%.

**Bloc dépenses** :
- Liste des dépenses du mois (toutes les `monthly_budgets` du mois en cours) sur cartes `--surface`
- Pour chaque ligne : icône carrée (10px) à la couleur de la dépense, libellé, montant prévu, dépensé réel (= somme des transactions reliées à cette dépense), mini-jauge `--ink`
- Si dépassement → bordure rouge `--down` + petit message d'alerte ("⚠ Tu as dépassé ton budget courses de 23€")
- En dessous, un bloc "Dépenses imprévues" liste les transactions du mois sans `expense_id`, regroupées par catégorie

**Notifications visuelles (in-app uniquement)** :
- Approche du plafond (>80% utilisé) → couleur ambre `--warn`
- Dépassement → couleur rouge `--down` + message
- Aucune notif push ni mail

**Note du mois** : champ texte libre en bas du dashboard, sauvegarde auto dans `monthly_settings.note`.

### 7.2 Workflow "Nouveau mois"

Quand je clique sur "Nouveau mois" :

1. L'outil **sauvegarde** le mois en cours (status `closed`) mais le rend accessible (je peux le rouvrir si erreur)
2. Crée un nouveau mois `in_progress`
3. Pour chaque `expense` non archivée :
   - Si `category` ∈ {`besoins_fixes`, `besoins_variables`} → crée une ligne `monthly_budgets` avec `planned_amount` = montant du mois précédent (ou 0 si pas de ligne précédente)
   - Si `category` ∈ {`envies_velo`, `envies_autres`, `epargne`} → crée une ligne `monthly_budgets` avec `planned_amount` = 0 (libellé conservé, montant à saisir)
   - Si `is_credit = true` → décrémente `credit_remaining_months` de 1 ; si arrive à 0 → `archived = true` (la dépense disparaît automatiquement du mois suivant mais reste visible en historique)

**Erreur de manip** : un bouton "Rouvrir ce mois" permet de remettre un mois fermé en statut `in_progress`.

### 7.3 Budget prévisionnel

**Affichage** :
- 3 sections verticales : **Besoins**, **Envies**, **Épargne**
- Dans chaque section, les dépenses sont **regroupées par catégorie** :
  - Besoins → sous-groupes Besoins fixes / Besoins variables
  - Envies → sous-groupes Envies vélo / Envies autres
  - Épargne → pas de sous-groupe, simple liste
- Pour chaque dépense : pastille couleur, libellé, montant prévu (éditable inline)
- Bouton "**+ Ajouter une dépense**" en bas de chaque section parent_type (Besoins / Envies / Épargne)

**Modale "Nouvelle dépense"** :
- Libellé (texte court)
- Catégorie (sélecteur parmi les 5 valeurs ; pré-filtré sur le parent_type de la section depuis laquelle on clique)
- Couleur (palette de 12)
- Mode de partage (`perso_100` / `split_50_50` / `split_prorata`)
- À crédit (checkbox) ; si activé : 3 champs (mensualités restantes, date de fin, capital restant)
- Montant prévisionnel pour le mois en cours

Au submit : création d'une ligne dans `expenses` + une ligne dans `monthly_budgets` pour le mois en cours.

**Édition d'une dépense** :
- Tap sur la dépense → modale d'édition (mêmes champs)
- Modifier le **montant** → met à jour `monthly_budgets.planned_amount` pour le mois en cours uniquement
- Modifier **libellé / couleur / share_mode / is_credit / etc.** → met à jour `expenses` (s'applique aux mois passés et futurs ; les transactions historiques conservent leur snapshot de catégorie)
- Bouton "Supprimer" → archive l'expense (`archived = true`). Les transactions passées la conservent en référence ; elle disparaît des mois suivants.

**Récap en bas de page** :
- 3 totaux (Besoins / Envies / Épargne) avec % calculé sur `revenue_melvin`
- Comparaison à l'objectif % (vert `--up` ±5%, ambre `--warn` 5-15%, rouge `--down` >15%)
- Total global prévu

### 7.4 Saisie d'une transaction

**Modale accessible via bouton "+" central de la tab bar, depuis n'importe quel écran** :
- **Date** : pré-remplie à aujourd'hui, modifiable
- **Montant** (€)
- **Rattachement** (choix obligatoire) :
  - **Option A — Relier à une dépense prévue** : sélecteur des dépenses du mois en cours (regroupées par catégorie). La catégorie est déduite automatiquement.
  - **Option B — Saisie libre** : pas de rattachement à une dépense prévue. L'utilisateur choisit alors une catégorie directement (sélecteur des 5 valeurs).
- **Description** : champ texte libre (ex: "Intermarché courses", "Coiffeur")
- **Bouton "Enregistrer"** (CTA accent lime)

Au submit : insertion dans `transactions` avec ou sans `expense_id`. `category` est toujours rempli (copié depuis l'expense en option A, choisi par l'utilisateur en option B).

**Vue liste des transactions** :
- Liste chronologique inversée du mois en cours
- Filtres : par catégorie, par dépense prévue (montre les transactions liées), "Imprévues uniquement"
- Édition / suppression possible

### 7.5 Répartition Flore

**Inputs** (en haut de l'écran) :
- Mes revenus du mois : préremplis depuis `monthly_settings.revenue_melvin`
- Revenus de Flore : préremplis depuis `monthly_settings.revenue_flore`
- APL : préremplie depuis `monthly_settings.apl`
- Si revenu Flore = 0 → toutes les charges partagées sont automatiquement 100% à moi (lui afficher un message explicatif)

**Affichage** :
- Ratio de répartition (ex: 73,6% / 26,4%)
- Liste des **dépenses** dont `share_mode` est `split_50_50` ou `split_prorata`, avec calcul auto :
  - Loyer (prorata) : ma part X€, part de Flore Y€
  - Énergie (50/50) : ma part X€, part de Flore X€
- APL (prorata, à reverser à Flore)
- **Total : "Flore me doit ce mois X€"** (gros chiffre, idéalement sur carte héro `--ink`)

**Module "Remboursements de Flore"** :
- Liste des remboursements enregistrés ce mois
- Bouton "Flore m'a remboursé X€" qui ajoute une ligne `flore_payments`
- Solde restant dû : "Flore me doit encore X€"
- **Important** : ces remboursements n'apparaissent ni dans les revenus, ni dans les charges. Module isolé.

**Logique pour les charges payées en totalité par moi** (ex: facture énergie 101€) :
- Dans le dashboard et les transactions, j'affiche ma part nette (50,50€)
- Le montant total apparaît uniquement dans le module Flore pour le calcul
- Si revenu Flore = 0, le montant affiché redevient le total (101€)

### 7.6 Simulateur (MVP : court terme uniquement)

**Écran** :
- Champ "Ajouter une dépense fictive"
  - Montant
  - Rattachement (dépense prévue ou catégorie directe, comme la saisie d'une transaction)
- Affichage temps réel de l'impact :
  - Nouveau "reste à dépenser"
  - Nouveau ratio besoins/envies/épargne vs objectif
  - Indication "Cette dépense te ferait sortir de ton objectif épargne" (si applicable)
- Bouton "Convertir en vraie transaction" si je décide d'y aller (CTA accent lime)
- Bouton "Effacer la simulation"

> Le simulateur ne modifie jamais la base de données tant que je ne convertis pas.

### 7.7 Récap annuel

**Affichage** :
1. **Graphiques** — palette restreinte au design system (`--ink`, `--accent`, `--up`, `--down`, `--ink-2`) :
   - Courbe d'évolution mensuelle de mes revenus
   - Courbe d'évolution besoins / envies / épargne (3 séries)
   - Barres empilées : répartition mensuelle besoins/envies/épargne
   - Donut annuel : part de chaque type sur l'année
2. **Tableau** :
   - Lignes : Besoins / Envies / Épargne (juste les 3 totaux)
   - Colonnes : 12 mois + moyenne + total annuel

Les mois non remplis affichent un tiret, pas un `#DIV/0!`.

### 7.8 Réglages

> La gestion des dépenses se fait depuis l'écran Budget, pas depuis Réglages.

- **Objectif %** : 3 champs (besoins / envies / épargne). Quand 2 sont remplis, le 3e se complète automatiquement à `100 − somme des deux autres`. Total doit faire 100%.
- **Export** : bouton "Exporter en CSV" qui télécharge un fichier avec toutes les transactions + tous les budgets mensuels + toutes les dépenses
- **Compte** : changer mot de passe, déconnexion

---

## 8. Authentification

- Compte unique (le mien)
- Login email + mot de passe via Supabase Auth
- Pas de signup public (compte créé manuellement dans Supabase au lancement)
- Session persistante (je ne me reconnecte pas à chaque fois)

---

## 9. Comportements spéciaux à respecter

1. **Aucune valeur calculée n'est stockée** : tous les ratios, restes, totaux sont calculés à la volée depuis les données brutes. Évite la désynchronisation.
2. **Les remboursements Flore ne touchent jamais aux ratios besoins/envies/épargne**. Module isolé.
3. **Si revenu Flore = 0** sur un mois, basculer tout en 100% perso, afficher message informatif.
4. **Les transactions du mois en cours sont saisissables même si je suis sur un écran d'archive** : on est toujours implicitement sur "le mois en cours" pour la saisie, sauf si je sélectionne explicitement un autre mois dans le sélecteur.
5. **Les charges programmées non saisies n'apparaissent PAS dans le "reste à dépenser réel"**. Mais elles apparaissent en colonne "objectif" qui sert de référence visuelle.
6. **Modifier une dépense ne casse pas l'historique** : les transactions passées conservent leur snapshot `category` et leur `expense_id`. Si l'expense est renommée ("Courses" → "Alimentation"), les transactions liées suivent le nouveau nom (via la FK) ; si la catégorie de l'expense est changée, les transactions passées conservent l'ancienne catégorie (champ `category` figé à la création).
7. **Supprimer une dépense = archiver** (`archived = true`). Les transactions passées restent. L'expense disparaît des mois futurs et des sélecteurs.

---

## 10. Étapes de développement recommandées

(Voir `ROADMAP.md` pour le détail)

1. Setup projet + Supabase + auth ✅
2. Modèle de données + migrations ✅ → **refonte en cours suite au pivot Dépenses**
3. Charte graphique + navigation ✅
4. Réglages (objectifs %) — la partie catégories est obsolète
5. Budget prévisionnel — refonte pour utiliser le nouveau modèle Dépenses
6. Saisie transactions + liste
7. Dashboard mensuel
8. Workflow nouveau mois / archivage
9. Module répartition Flore
10. Simulateur
11. Récap annuel + graphiques
12. Export CSV
13. PWA + ajout écran accueil iOS
14. Polish UI + animations

---

## 11. Hors périmètre v1 (à garder en tête pour v2+)

- Pot commun "provisions" (sinking funds pour cadeaux Noël, contrôle technique, etc.)
- Objectifs d'épargne nommés avec suivi cumulé (fonds urgence X€, voyage Y€)
- Simulation long terme et changement de format objectif
- Pilotage portefeuille d'investissement (PEA, CTO, cryptos)
- Mode sombre
- Notifications push / mail
- Multi-utilisateur (si Flore change d'avis)
- Stats avancées (top dépenses, tendances par catégorie)

---

## 12. Notes pour Claude Code

- **Charte graphique** : la source unique est `VELTA_DESIGN_SYSTEM.md`. Lire ce fichier avant tout travail UI. Ne jamais inventer une couleur, une taille, un rayon ou une typo qui n'y figure pas.
- **Vocabulaire** : `Type` (Besoins/Envies/Épargne, fixe) > `Catégorie` (5 valeurs fixes) > `Dépense` (créée par l'utilisateur). Ne jamais confondre.
- Code propre, fonctions courtes, composants réutilisables.
- Commentaires en français pour les parties métier.
- Toutes les sommes en `numeric` côté base, jamais en `float`.
- Format date ISO partout, affichage français à la présentation uniquement.
- Privilégier les Server Components Next.js quand possible.
- Tester sur mobile (Chrome DevTools responsive) à chaque écran.
- Performance : pas de re-render inutile, debounce sur les inputs budget.
