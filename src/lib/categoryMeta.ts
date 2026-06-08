/*
 * Métadonnées des catégories : palette de couleurs, libellés FR des énumérations,
 * ordre et libellés des groupes parents.
 *
 * Source de vérité design : VELTA_DESIGN_SYSTEM.md. La charte délègue
 * explicitement le choix d'une « palette de 12-16 couleurs prédéfinies
 * harmonieuses » pour les catégories (SPECS §3). On retient ici 12 tons sourds,
 * façon Notion. Le lime (--accent) en est ABSENT : il reste réservé aux signaux
 * d'action (CTA, onglet actif, jauge), jamais une couleur de catégorie.
 */

import type { CategoryType, ParentType, ShareMode } from '@/types/database'

/** Palette de 12 couleurs prédéfinies, harmonieuses avec la charte. */
export const CATEGORY_COLORS = [
  '#6B7A99', // bleu ardoise
  '#5B9BD5', // bleu ciel
  '#4FA8A0', // sarcelle
  '#7CA982', // vert sauge
  '#9DA65B', // olive sourd
  '#E0A458', // ambre
  '#C77B5A', // terre cuite
  '#D58CA0', // rose poudré
  '#9B7DB5', // mauve
  '#6C6FB0', // indigo
  '#8C8780', // pierre
  '#5B6472', // graphite
] as const

/** Libellés FR des sous-types (le parent_type se déduit automatiquement en base). */
export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  besoins_fixes: 'Besoins fixes',
  besoins_variables: 'Besoins variables',
  envies_velo: 'Envies — Vélo',
  envies_autres: 'Envies — Autres',
  epargne: 'Épargne',
}

export const CATEGORY_TYPE_OPTIONS = (
  Object.keys(CATEGORY_TYPE_LABELS) as CategoryType[]
).map((value) => ({ value, label: CATEGORY_TYPE_LABELS[value] }))

/** Libellés FR des modes de partage avec Flore. */
export const SHARE_MODE_LABELS: Record<ShareMode, string> = {
  perso_100: '100 % perso',
  split_50_50: '50 / 50 avec Flore',
  split_prorata: 'Au prorata des revenus',
}

export const SHARE_MODE_OPTIONS = (
  Object.keys(SHARE_MODE_LABELS) as ShareMode[]
).map((value) => ({ value, label: SHARE_MODE_LABELS[value] }))

/** Ordre d'affichage des groupes parents. */
export const PARENT_ORDER: ParentType[] = ['besoin', 'envie', 'epargne']

export const PARENT_LABELS: Record<ParentType, string> = {
  besoin: 'Besoins',
  envie: 'Envies',
  epargne: 'Épargne',
}
