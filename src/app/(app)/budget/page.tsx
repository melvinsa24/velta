import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { createClient } from '@/lib/supabase/server'
import {
  currentMonthStart,
  formatMonthLabel,
  previousMonthStart,
} from '@/lib/month'
import { BudgetEditor } from './BudgetEditor'
import type { BudgetLine } from './actions'
import type { Expense, MonthlySettings } from '@/types/database'

/*
 * Écran Budget prévisionnel (SPECS §7.3). Server Component : charge les dépenses
 * non archivées (entités durables), leurs montants prévisionnels du mois courant,
 * un indicateur de présence de montants sur le mois N-1 (pour la reprise) et les
 * réglages du mois (revenu + objectifs %). Toute l'interaction (saisie inline,
 * modale de création / édition, archivage, reprise, récap) est déléguée au
 * client BudgetEditor.
 */
export default async function BudgetPage() {
  const supabase = await createClient()
  const month = currentMonthStart()
  const prevMonth = previousMonthStart(month)

  const [expensesRes, budgetsRes, prevBudgetsRes, settingsRes] =
    await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .eq('archived', false)
        .order('created_at'),
      supabase
        .from('monthly_budgets')
        .select('expense_id, planned_amount')
        .eq('month', month),
      supabase.from('monthly_budgets').select('expense_id').eq('month', prevMonth),
      supabase
        .from('monthly_settings')
        .select('*')
        .eq('month', month)
        .maybeSingle(),
    ])

  const expenses = (expensesRes.data as Expense[] | null) ?? []
  const budgets =
    (budgetsRes.data as Pick<BudgetLine, 'expense_id' | 'planned_amount'>[] | null) ??
    []
  const settings = (settingsRes.data as MonthlySettings | null) ?? null
  const prevHasData = ((prevBudgetsRes.data as unknown[] | null) ?? []).length > 0

  return (
    <>
      <ScreenHeader
        title="Budget"
        subtitle={`Prévisionnel · ${formatMonthLabel(month)}`}
      />
      <BudgetEditor
        month={month}
        expenses={expenses}
        budgets={budgets}
        revenue={settings?.revenue_melvin ?? 0}
        targets={{
          needs: settings?.target_needs_pct ?? 50,
          wants: settings?.target_wants_pct ?? 30,
          savings: settings?.target_savings_pct ?? 20,
        }}
        prevHasData={prevHasData}
      />
    </>
  )
}
