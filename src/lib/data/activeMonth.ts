import { createClient } from '@/lib/supabase/server'
import {
  currentMonthStart,
  nextMonthStart,
  previousMonthStart,
} from '@/lib/month'
import type { BudgetStatus } from '@/types/database'

/*
 * Résolution du « mois actif » (Phase 9, SPECS §7.2). Depuis la migration 005,
 * le statut d'un mois (in_progress / closed) vit sur `monthly_settings`.
 *
 * Le mois actif est le plus grand mois `in_progress` ; à défaut (aucune ligne,
 * install neuve), on retombe sur le mois calendaire. Les écrans (Dashboard,
 * Budget, Réglages) s'appuient sur ce mois plutôt que sur le mois calendaire :
 * tant qu'on n'a pas cliqué « Nouveau mois », on continue de voir le mois actif
 * même si le calendrier a déjà basculé.
 */

export type MonthContext = {
  /** Premier jour du mois calendaire courant (date serveur). */
  calendarMonth: string
  /** Mois sur lequel l'app travaille (plus grand mois in_progress, sinon calendaire). */
  activeMonth: string
  activeStatus: BudgetStatus
  /** Le mois actif est-il en retard sur le calendrier ? → bannière de bascule. */
  isBehind: boolean
  /** Mois suivant le mois actif (cible de « Nouveau mois »). */
  nextMonth: string
  /** Mois précédent le mois actif + son statut (pour « Rouvrir »). */
  prevMonth: string
  prevStatus: BudgetStatus | null
}

export async function getMonthContext(): Promise<MonthContext> {
  const supabase = await createClient()
  const calendarMonth = currentMonthStart()

  const { data } = await supabase.from('monthly_settings').select('month, status')
  const rows = (data as { month: string; status: BudgetStatus }[] | null) ?? []
  const statusByMonth = new Map(rows.map((r) => [r.month, r.status]))

  // Les mois sont au format 'YYYY-MM-01' → tri lexicographique = tri chronologique.
  const inProgress = rows
    .filter((r) => r.status === 'in_progress')
    .map((r) => r.month)
    .sort()
  const activeMonth =
    inProgress.length > 0 ? inProgress[inProgress.length - 1] : calendarMonth
  const prevMonth = previousMonthStart(activeMonth)

  return {
    calendarMonth,
    activeMonth,
    activeStatus: statusByMonth.get(activeMonth) ?? 'in_progress',
    isBehind: activeMonth < calendarMonth,
    nextMonth: nextMonthStart(activeMonth),
    prevMonth,
    prevStatus: statusByMonth.get(prevMonth) ?? null,
  }
}
