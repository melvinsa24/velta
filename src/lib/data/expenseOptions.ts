import { createClient } from '@/lib/supabase/server'
import type { ExpenseOption } from '@/components/transaction/TransactionForm'

/*
 * Dépenses « prévues » d'un mois : celles ayant une ligne `monthly_budgets` ce
 * mois-ci ET non archivées. C'est l'ensemble proposé en option A (rattachement)
 * de la saisie d'une transaction (SPECS §7.4). Deux requêtes simples plutôt
 * qu'une jointure imbriquée, pour rester sur le client Supabase non typé.
 *
 * Utilisé par le layout (FAB) et par l'écran Transactions. NB : le layout
 * l'invoque à chaque navigation — dette technique acceptée (cf. Fab), à
 * optimiser en Phase 14 si besoin.
 */
export async function getMonthExpenseOptions(
  month: string,
): Promise<ExpenseOption[]> {
  const supabase = await createClient()

  const { data: budgetRows } = await supabase
    .from('monthly_budgets')
    .select('expense_id')
    .eq('month', month)

  const ids = ((budgetRows as { expense_id: string }[] | null) ?? []).map(
    (r) => r.expense_id,
  )
  if (ids.length === 0) return []

  const { data } = await supabase
    .from('expenses')
    .select('id, label, category, color')
    .in('id', ids)
    .eq('archived', false)
    .order('created_at')

  return (data as ExpenseOption[] | null) ?? []
}
