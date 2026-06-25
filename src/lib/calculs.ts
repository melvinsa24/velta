/*
 * Calculs financiers du mois — tous à la volée, aucune valeur dérivée stockée
 * (SPECS §9.1). Source unique pour le Dashboard : ne jamais recalculer ces
 * formules inline ailleurs.
 */

import { CATEGORY_PARENT } from '@/lib/categoryMeta'
import type {
  CategoryType,
  MonthlySettings,
  ParentType,
  ShareMode,
} from '@/types/database'

/** Sous-ensemble de `monthly_settings` nécessaire au revenu réel de Melvin. */
export type RevenueSettings = Pick<
  MonthlySettings,
  'apl' | 'revenue_salaire' | 'revenue_autres' | 'revenue_flore'
>

/**
 * Revenu réel de Melvin du mois = salaire + autres + part d'APL lui revenant.
 *
 * La part d'APL est calculée au prorata des revenus (SPECS §6) :
 *   apl × (salaire + autres) / (salaire + autres + revenue_flore)
 * Elle est nulle s'il n'y a pas d'APL ou si Flore n'a aucun revenu (dans ce cas
 * tout bascule en 100 % perso, SPECS §9.3).
 *
 * Valeur JAMAIS stockée : toujours obtenue via ce helper (SPECS §9.1).
 */
export function revenusReelsMelvin(settings: RevenueSettings): number {
  const base = settings.revenue_salaire + settings.revenue_autres
  const aplPart =
    settings.apl && settings.revenue_flore > 0
      ? (settings.apl * base) / (base + settings.revenue_flore)
      : 0
  return base + aplPart
}

/**
 * Ventile la somme des transactions du mois par Type (Besoins / Envies /
 * Épargne), via le mapping Catégorie → Type. Sert de base aux jauges du
 * Dashboard (le réel par type).
 */
export function realTotalsByParent(
  transactions: { amount: number; category: CategoryType }[],
): Record<ParentType, number> {
  const totals: Record<ParentType, number> = { besoin: 0, envie: 0, epargne: 0 }
  for (const t of transactions) totals[CATEGORY_PARENT[t.category]] += t.amount
  return totals
}

/** Ratio de répartition Melvin / Flore d'un mois (module Flore, SPECS §7.6). */
export type FloreRatio = {
  ratioMelvin: number
  ratioFlore: number
}

/**
 * Ratio de répartition des charges entre Melvin et Flore (SPECS §7.6 / brief
 * Phase 10a). Calculé sur les revenus de BASE uniquement — APL EXCLUE :
 *
 *   base_melvin  = revenue_salaire + revenue_autres
 *   base_flore   = revenue_flore
 *   ratio_melvin = base_melvin / (base_melvin + base_flore)
 *   ratio_flore  = base_flore  / (base_melvin + base_flore)
 *
 * L'APL est elle-même répartie via ce ratio (part_apl = apl × ratio) : l'inclure
 * dans la base créerait une circularité (l'APL entrerait dans le ratio qui sert
 * à la répartir). `revenusReelsMelvin` (qui inclut la part APL de Melvin) reste
 * réservée aux ratios besoins/envies/épargne, hors module Flore.
 *
 * Si la base totale est nulle, tout bascule en 100 % Melvin (SPECS §9.3).
 * Aucune valeur dérivée n'est stockée (SPECS §9.1).
 */
export function floreRatio(settings: RevenueSettings): FloreRatio {
  const baseMelvin = settings.revenue_salaire + settings.revenue_autres
  const baseFlore = settings.revenue_flore
  const total = baseMelvin + baseFlore
  if (total <= 0) return { ratioMelvin: 1, ratioFlore: 0 }
  return {
    ratioMelvin: baseMelvin / total,
    ratioFlore: baseFlore / total,
  }
}

/**
 * Part revenant à Flore pour une dépense partagée (SPECS §7.6) :
 *   - split_50_50   → moitié du montant prévu
 *   - split_prorata → montant prévu × ratio_flore
 *   - perso_100     → 0 (jamais partagée)
 */
export function floreShare(
  plannedAmount: number,
  shareMode: ShareMode,
  ratioFlore: number,
): number {
  if (shareMode === 'split_50_50') return plannedAmount / 2
  if (shareMode === 'split_prorata') return plannedAmount * ratioFlore
  return 0
}
