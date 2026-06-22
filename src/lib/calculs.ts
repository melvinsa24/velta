/*
 * Calculs financiers du mois — tous à la volée, aucune valeur dérivée stockée
 * (SPECS §9.1). Source unique pour le Dashboard : ne jamais recalculer ces
 * formules inline ailleurs.
 */

import { CATEGORY_PARENT } from '@/lib/categoryMeta'
import type { CategoryType, MonthlySettings, ParentType } from '@/types/database'

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
