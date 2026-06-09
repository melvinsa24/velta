'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { previousMonthStart } from '@/lib/month'
import type { MonthlyBudget } from '@/types/database'

/*
 * Server Actions de l'écran Budget prévisionnel.
 *
 * Depuis la migration 003 (pivot « Dépenses »), `monthly_budgets` stocke le
 * montant prévisionnel d'une DÉPENSE (`expense_id`) pour un mois, avec une
 * contrainte unique (month, expense_id). Le label / la couleur / la catégorie
 * vivent sur la dépense (table `expenses`), plus ici.
 */

type ActionResult = { error: string | null }

/** Forme d'une ligne renvoyée au client (sous-ensemble de MonthlyBudget). */
export type BudgetLine = Pick<
  MonthlyBudget,
  'id' | 'expense_id' | 'planned_amount'
>

const LINE_COLUMNS = 'id, expense_id, planned_amount'

async function requireClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return supabase
}

/*
 * Définit / met à jour le montant prévisionnel d'une dépense pour un mois.
 * Upsert sur la contrainte unique (month, expense_id) : crée la ligne si elle
 * n'existe pas, met à jour `planned_amount` sinon. Pas de revalidatePath : la
 * saisie est optimiste côté client (debounce / blur).
 */
export async function upsertBudget(
  month: string,
  expenseId: string,
  plannedAmount: number,
): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase
    .from('monthly_budgets')
    .upsert(
      { month, expense_id: expenseId, planned_amount: plannedAmount },
      { onConflict: 'month,expense_id' },
    )
  if (error) return { error: error.message }
  return { error: null }
}

/*
 * « Reprendre le mois précédent » : recopie les prévisions de N-1 (expense_id +
 * montant) vers le mois courant. Upsert avec ignoreDuplicates : les dépenses
 * déjà prévues ce mois-ci ne sont pas écrasées. Renvoie les lignes du mois.
 */
export async function copyPreviousMonth(
  month: string,
): Promise<ActionResult & { lines: BudgetLine[] }> {
  const supabase = await requireClient()
  const prev = previousMonthStart(month)

  const { data, error: readError } = await supabase
    .from('monthly_budgets')
    .select('expense_id, planned_amount')
    .eq('month', prev)
    .order('created_at')

  if (readError) return { error: readError.message, lines: [] }

  const prevRows =
    (data as Pick<MonthlyBudget, 'expense_id' | 'planned_amount'>[] | null) ?? []

  if (prevRows.length === 0) return { error: null, lines: [] }

  const rows = prevRows.map((r) => ({
    month,
    expense_id: r.expense_id,
    planned_amount: r.planned_amount,
  }))

  const { error: writeError } = await supabase
    .from('monthly_budgets')
    .upsert(rows, { onConflict: 'month,expense_id', ignoreDuplicates: true })

  if (writeError) return { error: writeError.message, lines: [] }

  // Relit l'état du mois courant après reprise (lignes existantes + insérées).
  const { data: current, error: refetchError } = await supabase
    .from('monthly_budgets')
    .select(LINE_COLUMNS)
    .eq('month', month)
    .order('created_at')

  if (refetchError) return { error: refetchError.message, lines: [] }

  revalidatePath('/budget')
  return { error: null, lines: (current as BudgetLine[] | null) ?? [] }
}
