import { createClient } from '@/lib/supabase/server'
import type { Expense } from '@/types/database'

/*
 * Crédits en cours (SPECS §7.1, bloc Dashboard) : dépenses `is_credit = true` et
 * non archivées. La mensualité affichée est le `planned_amount` de la dépense
 * pour le mois actif (jointe ici) ; le décrément du capital / des mensualités est
 * géré par le workflow « Nouveau mois » (RPC roll_to_next_month), jamais ici.
 */

export type CreditRow = {
  id: string
  label: string
  color: string
  /** Mensualité = montant prévu de la dépense pour le mois actif (0 si absent). */
  monthly: number
  remainingMonths: number | null
  totalRemaining: number | null
}

type ExpenseCreditFields = Pick<
  Expense,
  'id' | 'label' | 'color' | 'credit_remaining_months' | 'credit_total_remaining'
>

export async function getCreditsInProgress(month: string): Promise<CreditRow[]> {
  const supabase = await createClient()

  const [expensesRes, budgetsRes] = await Promise.all([
    supabase
      .from('expenses')
      .select('id, label, color, credit_remaining_months, credit_total_remaining')
      .eq('is_credit', true)
      .eq('archived', false)
      .order('created_at'),
    supabase
      .from('monthly_budgets')
      .select('expense_id, planned_amount')
      .eq('month', month),
  ])

  const expenses = (expensesRes.data as ExpenseCreditFields[] | null) ?? []
  const budgets =
    (budgetsRes.data as { expense_id: string; planned_amount: number }[] | null) ?? []
  const plannedByExpense = new Map(
    budgets.map((b) => [b.expense_id, b.planned_amount]),
  )

  return expenses.map((e) => ({
    id: e.id,
    label: e.label,
    color: e.color,
    monthly: plannedByExpense.get(e.id) ?? 0,
    remainingMonths: e.credit_remaining_months,
    totalRemaining: e.credit_total_remaining,
  }))
}
