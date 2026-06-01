# Velta — Specs

> Dashboard financier personnel. Mono-utilisateur (Melvin). Mobile-first, installable comme PWA sur iPhone via Safari.

---

## 0. Comment travailler avec ce fichier

**Ce fichier est la source de vérité du projet.** Toute décision produit, métier, ou data passe par ici.

Règles de collaboration avec Claude Code :

- **Lire en priorité à chaque session** : au minimum le sommaire + la section concernée par la tâche en cours.
- **Ne jamais dévier** : si une demande de l'utilisateur contredit les specs, signaler le conflit avant de coder.
- **Pas de feature non spécifiée** : si une idée nouvelle surgit, on l'ajoute d'abord à `ROADMAP.md`, on ne l'improvise pas dans le code.
- **Suivre l'ordre de la roadmap** : ne pas anticiper sur des phases ultérieures, même si "ce serait pas long".
- **Commenter en français** pour le métier (logique, calculs), code technique standard en anglais.

---

## 1. Vision produit

Velta me permet de :

1. Définir un **budget prévisionnel mensuel** par catégorie
2. Suivre mes **dépenses réelles** au fil du mois (saisie rapide depuis mobile)
3. Visualiser le **ratio besoins / envies / épargne** vs un objectif fixé
4. Calculer la **répartition équitable des charges** avec ma copine Flore (qui n'utilise pas l'outil)
5. **Simuler** l'impact d'une dépense ponctuelle sur mon budget mensuel
6. Avoir un **récap annuel** avec graphiques

**Philosophie** : pas de connexion bancaire, saisie manuelle. L'outil est un coach, pas un tracker automatique.

---

## 2. Stack technique

- **Framework** : Next.js (App Router) + TypeScript
- **Style** : Tailwind CSS
- **Base de données + Auth** : Supabase (plan gratuit, région Europe)
- **Hébergement** : Vercel (plan gratuit)
- **Graphiques** : Recharts
- **PWA** : configuration pour ajout à l'écran d'accueil iOS

---

## 3. Charte graphique

### Couleurs (variables CSS dans `globals.css`)

| Usage | Couleur |
|---|---|
| Fond principal | `#FDFCFB` |
| Surfaces / panneaux / cartes | `#F4F2ED` |
| Texte principal | `#1A1B1F` |
| Texte secondaire | `#79766F` |
| Accent (actions, signaux) | `#CFF24A` |
| Bordures fines | `#E5E2DC` |

### Typographie

- Police : **Helvetica** (fallback `Helvetica Neue, Arial, sans-serif`)
- Hiérarchie : titre 24-32px / sous-titre 18px / corps 14-16px / petit 12px
- Pas de mode sombre en v1

### Style général

- Coins arrondis : **10px** sur cartes/panneaux, **6px** sur boutons et inputs
- Bordures fines (1px `#E5E2DC`) plutôt que des ombres
- Beaucoup d'espace blanc, design épuré
- Signaux couleur pour les écarts budget : vert = ok, orange = vigilance, rouge = dépassement

### Code couleur catégories

Chaque catégorie créée par l'utilisateur a une couleur personnalisable (palette de 12 à 16 couleurs prédéfinies harmonieuses avec la charte).

---

## 4. Structure de l'application

### Navigation

- **Menu burger** en haut à gauche (mobile et desktop)
- Onglets accessibles depuis le menu :
  1. Dashboard du mois en cours
  2. Budget prévisionnel
  3. Saisie / liste des transactions
  4. Répartition Flore
  5. Simulateur
  6. Récap annuel
  7. Paramètres (catégories, objectif %, export)

### Layout mobile

- Bottom navigation envisageable en alternative au burger pour les 3-4 actions principales (à arbitrer au design).
- Bouton flottant "+" pour saisir rapidement une transaction depuis n'importe quel écran.

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

**Bloc résumé** :
- **Reste à dépenser réel** : `revenus du mois − Σ(transactions réelles)` → gros chiffre central
- **Reste à dépenser après charges fixes prévues** : `revenus − Σ(transactions) − Σ(budgets prévus non encore dépensés des besoins fixes)`
- **Ratio actuel besoins / envies / épargne** vs objectif → 3 jauges horizontales avec code couleur (vert si dans la cible ±5%, orange 5-15%, rouge >15%)

**Bloc catégories** :
- Liste des catégories actives ce mois
- Pour chaque ligne : nom, couleur, budget prévu, dépensé réel, barre de progression
- Si dépassement → bordure orange/rouge + petit message d'alerte (ex: "⚠ Tu as dépassé ton budget courses de 23€")

**Notifications visuelles (in-app uniquement)** :
- Approche du plafond (>80% utilisé) → couleur orange
- Dépassement → couleur rouge + message
- Aucune notif push ni mail

**Note du mois** : champ texte libre en bas du dashboard, sauvegarde auto.

### 6.2 Workflow "Nouveau mois"

Au clic sur "Nouveau mois" :

1. Sauvegarde du mois en cours (status `closed`) mais reste accessible (réouverture possible si erreur)
2. Création d'un nouveau mois `in_progress`
3. **Reprise des catégories `besoins_fixes` et `besoins_variables`** avec leurs montants prévisionnels du mois précédent
4. **Conservation des libellés** des catégories envies/épargne mais remise des montants à 0
5. Réel à zéro pour toutes
6. Pour les **catégories crédit** : décrément de `credit_remaining_months` ; si 0 → la catégorie disparaît automatiquement du nouveau mois (mais reste dans les paramètres pour historique)

**Erreur de manip** : un bouton "Rouvrir ce mois" permet de remettre un mois fermé en statut `in_progress`.

### 6.3 Budget prévisionnel

- Liste éditable de toutes les catégories du mois
- Regroupées par `parent_type` (besoins / envies / épargne)
- Pour chaque ligne : nom, montant prévu (éditable inline), bouton suppression
- Bouton "+" en bas de chaque section pour créer une nouvelle catégorie à la volée
- En haut : suggestion d'auto-remplissage "Reprendre les montants du mois précédent"
- En bas : récap des 3 totaux (besoins / envies / épargne) avec les % vs objectif

### 6.4 Saisie d'une transaction

**Écran rapide** (accessible via bouton "+" flottant) :
- **Date** : pré-remplie à aujourd'hui, modifiable
- **Montant** (€)
- **Catégorie** : sélecteur cascade (parent_type → catégorie). Si la catégorie n'existe pas, bouton "Créer une nouvelle catégorie" qui ouvre une modale rapide.
- **Description** : champ texte libre (ex: "coiffeur")
- **Bouton "Enregistrer"**

**Vue liste des transactions** :
- Liste chronologique inversée du mois en cours
- Filtres : par catégorie, par parent_type
- Édition / suppression possible (icônes sur chaque ligne)

### 6.5 Répartition Flore

**Inputs (en haut de l'écran)** :
- Mes revenus du mois : préremplis depuis `monthly_settings.revenue_melvin`
- Revenus de Flore : préremplis depuis `monthly_settings.revenue_flore`
- APL : préremplie depuis `monthly_settings.apl`
- Si revenu Flore = 0 → toutes les charges partagées sont automatiquement 100% à moi (afficher un message explicatif)

**Affichage** :
- Ratio de répartition (ex: 73,6% / 26,4%)
- Liste des catégories marquées `split_50_50` ou `split_prorata` avec calcul auto :
  - Loyer (prorata) : ma part X€, part de Flore Y€
  - Énergie (50/50) : ma part X€, part de Flore X€
- APL (prorata, à reverser à Flore)
- **Total : "Flore me doit ce mois X€"** (gros chiffre)

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
- Bouton "Convertir en vraie transaction" si je décide d'y aller
- Bouton "Effacer la simulation"

> Le simulateur ne modifie jamais la base de données tant que je ne convertis pas.

**À noter pour la v2** : simulation long terme (projection sur 12 mois) + simulation de changement de répartition (passer de 50/30/20 à 60/30/10).

### 6.7 Récap annuel

**Affichage** :
1. **Graphiques** (priorité) :
   - Courbe d'évolution mensuelle de mes revenus
   - Courbe d'évolution besoins / envies / épargne (3 séries)
   - Barres empilées : répartition mensuelle besoins/envies/épargne
   - Donut annuel : part de chaque parent_type sur l'année
2. **Tableau** (en dessous, plus simple que dans le fichier Excel actuel) :
   - Lignes : besoins / envies / épargne (juste les 3 totaux, pas le détail par sous-catégorie)
   - Colonnes : 12 mois + moyenne + total annuel

Les mois non remplis affichent un tiret, pas un `#DIV/0!`.

### 6.8 Paramètres

- **Catégories** : CRUD complet, avec couleur, mode de partage, flag crédit
- **Objectif %** : 3 champs (besoins / envies / épargne). Quand 2 sont remplis, le 3e se complète automatiquement à `100 − somme des deux autres`. Total doit faire 100%.
- **Export** : bouton "Exporter en CSV" qui télécharge un fichier avec toutes les transactions + tous les budgets mensuels
- **Compte** : changer mot de passe, déconnexion

---

## 7. Authentification

- Compte unique (le mien)
- Login email + mot de passe via Supabase Auth
- Pas de signup public (compte créé manuellement dans Supabase au lancement)
- Session persistante (pas de reconnexion à chaque visite)

---

## 8. Règles métier critiques

> Ces règles sont l'âme du projet. Toute implémentation qui les viole introduit des bugs invisibles. À relire avant chaque feature qui touche aux calculs.

1. **Aucune valeur calculée n'est stockée.** Tous les ratios, restes, totaux sont calculés à la volée depuis les données brutes. Évite la désynchronisation à tout prix.
2. **Les remboursements Flore ne touchent jamais aux ratios besoins/envies/épargne.** Module isolé.
3. **Si revenu Flore = 0** sur un mois, basculer tout en 100% perso, afficher un message informatif.
4. **Les transactions du mois en cours sont saisissables même depuis un écran d'archive** : on est toujours implicitement sur "le mois en cours" pour la saisie, sauf si je sélectionne explicitement un autre mois dans le sélecteur.
5. **Les charges programmées non saisies n'apparaissent PAS dans le "reste à dépenser réel"**, mais elles apparaissent en colonne "objectif" comme référence visuelle.
6. **Toutes les sommes en `numeric` côté base**, jamais en `float` (précision décimale critique pour de l'argent).
7. **Format date ISO partout** côté code et base, formatage français uniquement à la présentation.

---

## 9. Conventions de code

- Code propre, fonctions courtes, composants réutilisables.
- Commentaires en français pour la logique métier, anglais pour la technique standard.
- Privilégier les **Server Components Next.js** quand possible. Client Components uniquement si interactivité requise (`'use client'` en haut du fichier).
- Pas de re-render inutile : `useMemo` / `useCallback` quand un calcul est lourd.
- Debounce sur les inputs budget (300ms) pour éviter les requêtes intempestives.
- Tester sur mobile (Chrome DevTools responsive ou device réel) à chaque écran avant validation.
- Pas de librairie ajoutée sans discussion — chaque dépendance est un coût de maintenance.

---

## 10. Structure du projet (proposée)

```
velta/
├── app/                      # App Router Next.js (pages, layouts)
│   ├── (auth)/               # Routes liées à l'auth (login, etc.)
│   ├── dashboard/
│   ├── budget/
│   ├── transactions/
│   ├── flore/
│   ├── simulateur/
│   ├── recap/
│   ├── parametres/
│   └── layout.tsx
├── components/               # Composants UI réutilisables
│   ├── ui/                   # Primitives (Button, Card, Input, Select)
│   └── ...                   # Composants métier
├── lib/                      # Logique métier, helpers, calculs
│   ├── supabase/             # Client Supabase + helpers
│   ├── calculs/              # Calculs ratios, restes, prorata
│   └── utils/                # Helpers génériques (dates, formats)
├── types/                    # Types TypeScript partagés
├── public/                   # Assets statiques + manifest PWA
├── SPECS.md
├── ROADMAP.md
└── README.md
```

Les calculs métier (prorata Flore, ratios besoins/envies/épargne, reste à dépenser) vivent dans `lib/calculs/` et sont **purs** (entrées → sortie, pas d'effet de bord). Ça les rend testables et réutilisables côté serveur et client.

---

## 11. Hors périmètre v1

Tout ce qui suit est volontairement reporté en v2 ou v3. Si l'envie d'y toucher arrive, c'est le signe qu'il faut d'abord finir la v1.

- Pot commun "provisions" (sinking funds : cadeaux Noël, contrôle technique, etc.)
- Objectifs d'épargne nommés avec suivi cumulé (fonds urgence X€, voyage Y€)
- Simulation long terme et changement de format objectif
- Pilotage portefeuille d'investissement (PEA, CTO, cryptos)
- Mode sombre
- Notifications push / mail
- Multi-utilisateur (si Flore change d'avis)
- Catégorie "compte commun courses" plus fine
- Stats avancées (top dépenses, tendances par catégorie)

Le détail des phases et l'ordre exact sont dans `ROADMAP.md`.
