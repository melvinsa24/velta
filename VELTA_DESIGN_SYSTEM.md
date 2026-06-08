# Velta — Design System (v2)

Application de **gestion de budget personnel**. Direction : premium, minimaliste, épuré.
Inspirations : Notion (calme, typographique) + Revolut (carte sombre vedette, fintech).

## Principes
1. **Light only** — pas de dark mode global. Une seule carte « héro » est en near-black ; ce n'est pas un thème sombre, c'est un accent de contraste.
2. **Mobile-first** — tout est pensé pour le tactile (cibles ≥ 44px), une colonne, navigation par tab bar basse.
3. **Accent fluo rare** — le lime n'apparaît que sur les points d'action (CTA principal, onglet actif, jauge de budget, chip de variation). Objectif : **5 à 10 % de la surface** visible. Jamais en grande surface, jamais en texte long.
4. **Une seule typo** — Helvetica. La hiérarchie se joue au poids / à la taille / au crénage.
5. **Un seul rayon** — 10px sur toutes les surfaces ; pilules & avatar exceptés (ronds).

---

## Design tokens

### Couleurs
| Token | Valeur | Usage |
|---|---|---|
| `--bg` | `#F4F5F7` | Fond d'application (blanc froid) |
| `--surface` | `#FFFFFF` | Cartes, listes, barres |
| `--surface-2` | `#F8F9FB` | Fonds internes, pistes de jauge |
| `--ink` | `#0C0E12` | Texte principal **et** carte héro |
| `--ink-2` | `#5B6472` | Texte secondaire |
| `--ink-3` | `#9BA3AF` | Texte tertiaire, méta, icônes inactives |
| `--border` | `#ECEEF1` | Séparateurs, contours de cartes |
| `--border-2` | `#E0E3E8` | Contours plus marqués |
| `--accent` | `oklch(0.90 0.19 124)` ≈ `#C5F23F` | **Lime fluo** — CTA, onglet actif, jauge, chip ↑ |
| `--accent-press` | `oklch(0.85 0.19 124)` | État pressé de l'accent |
| `--accent-ink` | `#0C0E12` | Texte/icône posé SUR l'accent (toujours sombre) |
| `--up` | `oklch(0.60 0.12 155)` ≈ `#1F9D6B` | Micro-indicateur positif (montants +) |
| `--down` | `oklch(0.62 0.16 25)` ≈ `#DB5A4C` | Micro-indicateur négatif |
| `--warn` | `oklch(0.78 0.15 70)` ≈ `#D97706` | **Ambre** — état « vigilance » (hors cible budget, ±5 à ±15 % de l'objectif) |
| `--warn-ink` | `#0C0E12` | Texte/icône posé SUR l'ambre (toujours sombre) |

> **Règle d'accent.** Un seul élément lime visible par zone d'écran. Le lime est un *signal*, pas une décoration. Il se pose sur `--ink`, jamais en petit texte sur blanc (contraste insuffisant).

### Typographie — Helvetica
`font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;`
Montants : `font-variant-numeric: tabular-nums;` (chiffres alignés).

| Rôle | Poids | Taille / Interligne | Crénage |
|---|---|---|---|
| Solde / Display | 700 | 40 / 44 | -3.5% · tnum |
| Titre de section | 700 | 24 / 30 | -3% |
| En-tête de carte | 700 | 16 / 22 | -2% |
| Texte courant | 500 | 14 / 20 | 0 |
| Label / méta | 600 | 11 · UPPERCASE | +14% |

### Rayon
| Token | Valeur | Usage |
|---|---|---|
| `--r` | `10px` | Cartes, listes, héro, boutons, inputs, icônes carrées |
| `--r-full` | `999px` | Pilules, chips, jauges, avatar |

### Espacement
Base **4px**. Échelle : `4 · 8 · 12 · 16 · 20 · 24`. Gouttières de cartes : 18px. Marge d'écran mobile : 18px.

### Ombres
- Carte / dashboard : `0 1px 2px rgba(12,14,18,.04)` (repos) → `0 6px 16px -8px rgba(12,14,18,.22)` (hover).
- Carte héro : `0 18px 40px -20px rgba(12,14,18,.5)`.
- Bouton accent : `0 10px 22px -6px rgba(160,200,30,.6)`.

---

## Variables CSS (à copier)
```css
:root {
  --bg: #F4F5F7;
  --surface: #FFFFFF;
  --surface-2: #F8F9FB;
  --ink: #0C0E12;
  --ink-2: #5B6472;
  --ink-3: #9BA3AF;
  --border: #ECEEF1;
  --border-2: #E0E3E8;
  --card-ink: #0C0E12;
  --accent: oklch(0.90 0.19 124);      /* ≈ #C5F23F */
  --accent-press: oklch(0.85 0.19 124);
  --accent-ink: #0C0E12;
  --up: oklch(0.60 0.12 155);          /* ≈ #1F9D6B */
  --down: oklch(0.62 0.16 25);         /* ≈ #DB5A4C */
  --warn: oklch(0.78 0.15 70);         /* ≈ #D97706 — état vigilance */
  --warn-ink: #0C0E12;
  --r: 10px;
  --r-full: 999px;
  --font: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
```

## Tailwind (extrait `theme.extend`)
```js
extend: {
  colors: {
    bg: '#F4F5F7', surface: '#FFFFFF', 'surface-2': '#F8F9FB',
    ink: { DEFAULT: '#0C0E12', 2: '#5B6472', 3: '#9BA3AF' },
    border: { DEFAULT: '#ECEEF1', 2: '#E0E3E8' },
    accent: { DEFAULT: '#C5F23F', ink: '#0C0E12' },
    up: '#1F9D6B', down: '#DB5A4C', warn: '#D97706',
  },
  borderRadius: { DEFAULT: '10px', full: '9999px' },
  fontFamily: { sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'] },
}
```

---

## Composants de l'écran Dashboard
- **Header** — avatar (cercle, `--ink`), salutation, bouton cloche (carré 10px) avec pastille lime.
- **Carte solde (héro)** — fond `--ink`, solde tabulaire, chip `↑ 2,4 %` lime, sparkline lime, segment Semaine/Mois, bouton œil masquer/afficher.
- **Actions rapides** — 4 boutons carrés (Ajouter / Envoyer / Scanner / Plus), élévation au hover.
- **Budget du mois** — carte blanche, montant tabulaire, jauge de progression **lime**, chip « % restant ».
- **Catégories** — lignes avec icône carrée, mini-jauge `--ink`, montant à droite.
- **Transactions** — liste groupée ; montants en `--ink`, positifs en `--up`.
- **Tab bar** — verre dépoli, 4 onglets + bouton **+** central lime ; onglet actif = point lime sous le libellé.

## États & interactions
- Hover boutons : translateY(-2px) + ombre douce.
- Onglet actif : icône + libellé `--ink`, point lime.
- Masquage du solde persistant souhaitable (localStorage) en prod.
- Toasts : pilule `--ink`, texte blanc, auto-dismiss ~1,6 s.

## À ne pas faire
- Pas de dégradés décoratifs, pas d'emoji, pas de rayon variable.
- Pas de lime en aplat large ni en texte de paragraphe.
- Pas d'autre famille typographique.
