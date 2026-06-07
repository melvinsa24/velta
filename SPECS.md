
# Dashboard financier personnel — Spécifications

> Application web personnelle de gestion de budget. Mono-utilisateur (Melvin). Architecture mobile-first, installable comme PWA sur iPhone via Safari.
> Nom de l'application : Velta

---

## 1. Vision produit

Un dashboard financier qui me permet de :

1. Définir un **budget prévisionnel mensuel** par catégorie
2. Suivre mes **dépenses réelles** au fil du mois (saisie rapide depuis mobile)
3. Visualiser le **ratio besoins / envies / épargne** vs un objectif fixé
4. Calculer la **répartition équitable des charges** avec ma copine Flore (qui n'utilise pas l'outil)
5. **Simuler** l'impact d'une dépense ponctuelle sur mon budget mensuel
6. Avoir un **récap annuel** avec graphiques

**Philosophie** : pas de connexion bancaire, je saisis manuellement. L'outil est un coach, pas un tracker automatique.

---

## 2. Stack technique

- **Framework** : Next.js (App Router) + TypeScript
- **Style** : Tailwind CSS
- **Base de données + Auth** : Supabase (plan gratuit)
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

### Code couleur catégories

Chaque catégorie créée par l'utilisateur a une couleur personnalisable (sélecteur avec palette de 12-16 couleurs prédéfinies harmonieuses avec la charte).

---

## 4. Structure de l'application

### Navigation

**Tab bar basse** (mobile), comportant 4 onglets + un bouton **+** central pour la saisie rapide d'une transaction. Détails visuels (verre dépoli, point lime sur l'onglet actif) dans `VELTA_DESIGN_SYSTEM.md`.

Les 4 onglets principaux à définir au design, sachant qu'il faut couvrir au total 7 écrans :

1. Dashboard du mois en cours
2. Budget prévisionnel
3. Liste des transactions
4. Répartition Flore
5. Simulateur
6. Récap annuel
7. Réglages (catégories, objectif %, export, compte)

**Structure validée de la tab bar :**

| Position | Écran | Icône Lucide |
|---|---|---|
| 1 | Dashboard | `LayoutDashboard` |
| 2 | Budget | `Wallet` |
| 3 | **+** (saisie transaction) | `Plus` — bouton lime central |
| 4 | Flore | `Users` |
| 5 | Réglages | `Settings` |

Les écrans Transactions, Simulateur et Récap annuel sont accessibles depuis les onglets principaux (Transactions depuis Dashboard, Simulateur depuis Budget, Récap annuel depuis Dashboard ou Réglages).

**Bibliothèque d'icônes : Lucide React** (`lucide-react`). Aucune autre bibliothèque d'icônes ne doit être utilisée.

### Layout mobile

- Bouton **+** central de la tab bar : saisie rapide d'une transaction depuis n'importe quel écran.
- Marge d'écran : 18px (cf. design system).

---

## 5. Modèle de données

### Table `categories`
- `id` (uuid)
- `name` (text) — ex: "Besoins fixes", "Vélo", "PEA"
- `type` (enum: `besoins_fixes`, `besoins_variables`, `envies_velo`, `envies_autres`, `epargne`)
- `parent_type` (enum calculé : `besoin` / `envie` / `epargne`)
- `color` (text, code hex)
- `share_mode` (enum: `perso_100`, `split_50_50`, `split_prorata`) — défaut: `perso_100`
- `is_credit` (boolean) — si true, expose les champs ci-dessous
- `credit_remaining_months` (int, nullable)
- `credit_end_date` (date, nullable)
- `credit_total_remaining` (numeric, nullable)
- `created_at`, `updated_at`

> Hiérarchie : `parent_type` (besoins / envies / épargne) > `type` (sous-niveau imposé) > `category` (libellés libres créés par l'utilisateur). Les **libellés de transactions** (ex: "coiffeur", "courses Leclerc") sont stockés dans le champ `description` des transactions, pas comme catégorie.

### Table `monthly_budgets`
- `id` (uuid)
- `month` (date, premier jour du mois)
- `category_id` (uuid, foreign key)
- `planned_amount` (numeric)
- `status` (enum: `in_progress`, `closed`)
- `note` (text, nullable) — la note libre du mois est attachée au mois, pas à une catégorie
- `created_at`, `updated_at`

> Une ligne par catégorie par mois.

### Table `transactions`
- `id` (uuid)
- `date` (date)
- `amount` (numeric)
- `category_id` (uuid, foreign key)
- `description` (text) — ex: "coiffeur", "courses Leclerc"
- `month` (date, premier jour du mois) — calculé pour faciliter les agrégations
- `created_at`, `updated_at`

### Table `monthly_settings`
- `month` (date, premier jour du mois, primary key)
- `revenue_melvin` (numeric) — mes revenus du mois
- `revenue_flore` (numeric) — revenus de Flore (pour calcul prorata). Si 0, toutes les charges partagées deviennent 100% à moi
- `apl` (numeric, nullable) — APL touchée par moi, à reverser au prorata à Flore
- `target_needs_pct` (numeric) — ex: 50
- `target_wants_pct` (numeric) — ex: 30
- `target_savings_pct` (numeric) — ex: 20
- `note` (text, nullable)

### Table `flore_payments`
- `id` (uuid)
- `date` (date)
- `amount` (numeric)
- `month` (date) — le mois auquel le remboursement se rapporte
- `note` (text, nullable)

> Enregistre les remboursements de Flore. N'apparaît jamais dans les revenus ou les charges.

---

## 6. Fonctionnalités détaillées

### 6.1 Dashboard du mois

**Affichage en haut** :
- Mois en cours (ex: "Mai 2026")
- Bouton "Nouveau mois" (voir 6.2)
- Bouton "Archiver ce mois"

**Carte héro (Reste à dépenser)** — fond `--ink`, voir design system :
- **Reste à dépenser réel** : `revenus du mois − Σ(transactions réelles)` → gros chiffre central tabulaire
- **Reste à dépenser après charges fixes prévues** : `revenus − Σ(transactions) − Σ(budgets prévus non encore dépensés des besoins fixes)` (affichage secondaire)

**Bloc ratios** :
- **Ratio actuel besoins / envies / épargne** vs objectif → 3 jauges horizontales (jauge lime sur piste `--surface-2`) avec code couleur sémantique (vert `--up` si dans la cible ±5%, orange en vigilance 5-15%, rouge `--down` >15%)

**Bloc catégories** :
- Liste des catégories actives ce mois sur cartes `--surface`
- Pour chaque ligne : icône carrée (10px) à la couleur de la catégorie, nom, budget prévu, dépensé réel, mini-jauge `--ink`
- Si dépassement → bordure rouge `--down` + petit message d'alerte ("⚠ Tu as dépassé ton budget courses de 23€")

**Notifications visuelles (in-app uniquement)** :
- Approche du plafond (>80% utilisé) → couleur orange
- Dépassement → couleur rouge `--down` + message
- Aucune notif push ni mail

**Note du mois** : champ texte libre en bas du dashboard, sauvegarde auto.

### 6.2 Workflow "Nouveau mois"

Quand je clique sur "Nouveau mois" :

1. L'outil **sauvegarde** le mois en cours (status `closed`) mais le rend accessible (je peux le rouvrir si erreur)
2. Crée un nouveau mois `in_progress`
3. **Reprend les catégories de type `besoins_fixes` et `besoins_variables`** avec leurs montants prévisionnels du mois précédent
4. **Conserve les libellés** des catégories envies/épargne mais remet leurs montants à 0
5. Réel à zéro pour toutes
6. Pour les **catégories type crédit** : décrémente `credit_remaining_months` ; si 0 → la catégorie disparaît automatiquement du nouveau mois (mais reste dans les paramètres pour historique)

**Erreur de manip** : un bouton "Rouvrir ce mois" permet de remettre un mois fermé en statut `in_progress`.

### 6.3 Budget prévisionnel

- Liste éditable de toutes les catégories du mois
- Regroupées par `parent_type` (besoins / envies / épargne)
- Pour chaque ligne : nom, montant prévu (éditable inline), bouton suppression
- Bouton "+" en bas de chaque section pour créer une nouvelle catégorie à la volée
- En haut : suggestion d'auto-remplissage "Reprendre les montants du mois précédent"
- En bas : récap des 3 totaux (besoins / envies / épargne) avec les % vs objectif

### 6.4 Saisie d'une transaction

**Écran rapide** (accessible via bouton **+** central de la tab bar) :
- **Date** : pré-remplie à aujourd'hui, modifiable
- **Montant** (€)
- **Catégorie** : sélecteur cascade (parent_type → catégorie). Si la catégorie n'existe pas, bouton "Créer une nouvelle catégorie" qui ouvre une modale rapide.
- **Description** : champ texte libre (ex: "coiffeur")
- **Bouton "Enregistrer"** (CTA accent lime)

**Vue liste des transactions** :
- Liste chronologique inversée du mois en cours
- Filtres : par catégorie, par parent_type
- Édition / suppression possible (icônes sur chaque ligne)

### 6.5 Répartition Flore

**Inputs** (en haut de l'écran) :
- Mes revenus du mois : préremplis depuis `monthly_settings.revenue_melvin`
- Revenus de Flore : préremplis depuis `monthly_settings.revenue_flore`
- APL : préremplie depuis `monthly_settings.apl`
- Si revenu Flore = 0 → toutes les charges partagées sont automatiquement 100% à moi (lui afficher un message explicatif)

**Affichage** :
- Ratio de répartition (ex: 73,6% / 26,4%)
- Liste des catégories marquées `split_50_50` ou `split_prorata` avec calcul auto :
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

### 6.6 Simulateur (MVP : court terme uniquement)

**Écran** :
- Champ "Ajouter une dépense fictive"
  - Montant
  - Catégorie cible
- Affichage temps réel de l'impact :
  - Nouveau "reste à dépenser"
  - Nouveau ratio besoins/envies/épargne vs objectif
  - Indication "Cette dépense te ferait sortir de ton objectif épargne" (si applicable)
- Bouton "Convertir en vraie transaction" si je décide d'y aller (CTA accent lime)
- Bouton "Effacer la simulation"

> Le simulateur ne modifie jamais la base de données tant que je ne convertis pas.

**À noter pour la v2** : simulation long terme (projection sur 12 mois) + simulation de changement de répartition (passer de 50/30/20 à 60/30/10).

### 6.7 Récap annuel

**Affichage** :
1. **Graphiques** (priorité) — palette restreinte au design system (`--ink`, `--accent`, `--up`, `--down`, `--ink-2` pour les séries secondaires) :
   - Courbe d'évolution mensuelle de mes revenus
   - Courbe d'évolution besoins / envies / épargne (3 séries)
   - Barres empilées : répartition mensuelle besoins/envies/épargne
   - Donut annuel : part de chaque parent_type sur l'année
2. **Tableau** (en dessous, plus simple que dans le fichier Excel actuel) :
   - Lignes : besoins / envies / épargne (juste les 3 totaux, pas le détail par sous-catégorie)
   - Colonnes : 12 mois + moyenne + total annuel

Les mois non remplis affichent un tiret, pas un `#DIV/0!`.

### 6.8 Réglages

- **Catégories** : CRUD complet, avec couleur, mode de partage, flag crédit
- **Objectif %** : 3 champs (besoins / envies / épargne). Quand 2 sont remplis, le 3e se complète automatiquement à `100 − somme des deux autres`. Total doit faire 100%.
- **Export** : bouton "Exporter en CSV" qui télécharge un fichier avec toutes les transactions + tous les budgets mensuels
- **Compte** : changer mot de passe, déconnexion

---

## 7. Authentification

- Compte unique (le mien)
- Login email + mot de passe via Supabase Auth
- Pas de signup public (compte créé manuellement dans Supabase au lancement)
- Session persistante (je ne me reconnecte pas à chaque fois)

---

## 8. Comportements spéciaux à respecter

1. **Aucune valeur calculée n'est stockée** : tous les ratios, restes, totaux sont calculés à la volée depuis les données brutes. Évite la désynchronisation.
2. **Les remboursements Flore ne touchent jamais aux ratios besoins/envies/épargne**. Module isolé.
3. **Si revenu Flore = 0** sur un mois, basculer tout en 100% perso, afficher message informatif.
4. **Les transactions du mois en cours sont saisissables même si je suis sur un écran d'archive** : on est toujours implicitement sur "le mois en cours" pour la saisie, sauf si je sélectionne explicitement un autre mois dans le sélecteur.
5. **Les charges programmées non saisies n'apparaissent PAS dans le "reste à dépenser réel"**. Mais elles apparaissent en colonne "objectif" qui me sert de référence visuelle.

---

## 9. Étapes de développement recommandées

(Voir `ROADMAP.md` pour le détail)

1. Setup projet + Supabase + auth
2. Modèle de données + migrations
3. CRUD catégories + paramètres
4. Saisie budget prévisionnel
5. Saisie transactions + liste
6. Dashboard mensuel (sans graphiques)
7. Workflow nouveau mois / archivage
8. Module répartition Flore
9. Simulateur
10. Récap annuel + graphiques
11. Export CSV
12. PWA + ajout écran accueil iOS
13. Polish UI + animations

---

## 10. Hors périmètre v1 (à garder en tête pour v2+)

- Pot commun "provisions" (sinking funds pour cadeaux Noël, contrôle technique, etc.)
- Objectifs d'épargne nommés avec suivi cumulé (fonds urgence X€, voyage Y€)
- Simulation long terme et changement de format objectif
- Pilotage portefeuille d'investissement (PEA, CTO, cryptos)
- Mode sombre
- Notifications push / mail
- Multi-utilisateur (si Flore change d'avis)
- Catégorie "compte commun courses" plus fine
- Stats avancées (top dépenses, tendances par catégorie)

---

## 11. Notes pour Claude Code

- **Charte graphique** : la source unique est `VELTA_DESIGN_SYSTEM.md`. Lire ce fichier avant tout travail UI. Ne jamais inventer une couleur, une taille, un rayon ou une typo qui n'y figure pas.
- Code propre, fonctions courtes, composants réutilisables.
- Commentaires en français pour les parties métier.
- Toutes les sommes en `numeric` côté base, jamais en `float`.
- Format date ISO partout, affichage français à la présentation uniquement.
- Privilégier les Server Components Next.js quand possible.
- Tester sur mobile (Chrome DevTools responsive) à chaque écran.
- Performance : pas de re-render inutile, debounce sur les inputs budget.
