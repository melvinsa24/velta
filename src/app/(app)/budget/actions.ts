'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { previousMonthStart } from '@/lib/month'
import type { MonthlyBudget } from '@/types/database'

/*
 * Server Actions de l'écran Budget prévisionnel (Phase 6).
 *
 * Les montants prévisionnels vivent dans `monthly_budgets` (une ligne par
 * catégorie par mois — contrainte unique (month, category_id)).
 */

type ActionResult = { error: string | null }

async function requireClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return supabase
}

/*
 * Enregistre le montant prévu d'une catégorie pour un mois (upsert sur la clé
 * unique (month, category_id)). Pas de revalidatePath : la saisie est
 * optimiste côté client (debounce / blur), inutile de refetch à chaque frappe.
 */
export async function upsertBudget(
  month: string,
  categoryId: string,
  plannedAmount: number,
): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase.from('monthly_budgets').upsert(
    {
      month,
      category_id: categoryId,
      planned_amount: plannedAmount,
    },
    { onConflict: 'month,category_id' },
  )
  if (error) return { error: error.message }
  return { error: null }
}

/*
 * « Reprendre les montants du mois précédent » : copie les planned_amount de
 * N-1 vers le mois courant (upsert). Renvoie la map { category_id: montant }
 * pour que le client mette à jour ses champs sans refetch complet.
 */
export async function copyPreviousMonth(
  month: string,
): Promise<ActionResult & { amounts: Record<string, number> }> {
  const supabase = await requireClient()
  const prev = previousMonthStart(month)

  const { data, error: readError } = await supabase
    .from('monthly_budgets')
    .select('category_id, planned_amount')
    .eq('month', prev)

  if (readError) return { error: readError.message, amounts: {} }

  const prevRows =
    (data as Pick<MonthlyBudget, 'category_id' | 'planned_amount'>[] | null) ??
    []

  if (prevRows.length === 0) return { error: null, amounts: {} }

  const rows = prevRows.map((r) => ({
    month,
    category_id: r.category_id,
    planned_amount: r.planned_amount,
  }))

  const { error: writeError } = await supabase
    .from('monthly_budgets')
    .upsert(rows, { onConflict: 'month,category_id' })

  if (writeError) return { error: writeError.message, amounts: {} }

  const amounts: Record<string, number> = {}
  for (const r of prevRows) amounts[r.category_id] = r.planned_amount

  revalidatePath('/budget')
  return { error: null, amounts }
}
