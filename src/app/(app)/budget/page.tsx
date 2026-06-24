import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { createClient } from '@/lib/supabase/server'
import { formatMonthLabel, previousMonthStart } from '@/lib/month'
import { getMonthContext } from '@/lib/data/activeMonth'
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
  const { activeMonth: month, activeStatus } = await getMonthContext()
  const prevMonth = previousMonthStart(month)

  const [expensesRes, budgetsRes, prevBudgetsRes, settingsRes, prevSettingsRes] =
    await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .eq('archived', false)
        .order('created_at'),
      // !inner + archived=false : n'expose que les budgets de dépenses non
      // archivées (cohérent avec la liste `expenses` filtrée juste au-dessus).
      supabase
        .from('monthly_budgets')
        .select('expense_id, planned_amount, expenses!inner(archived)')
        .eq('month', month)
        .eq('expenses.archived', false),
      supabase
        .from('monthly_budgets')
        .select('expense_id, expenses!inner(archived)')
        .eq('month', prevMonth)
        .eq('expenses.archived', false),
      supabase
        .from('monthly_settings')
        .select('*')
        .eq('month', month)
        .maybeSingle(),
      supabase
        .from('monthly_settings')
        .select('revenue_planned')
        .eq('month', prevMonth)
        .maybeSingle(),
    ])

  const expenses = (expensesRes.data as Expense[] | null) ?? []
  const budgets =
    (budgetsRes.data as Pick<BudgetLine, 'expense_id' | 'planned_amount'>[] | null) ??
    []
  const settings = (settingsRes.data as MonthlySettings | null) ?? null
  const prevHasData = ((prevBudgetsRes.data as unknown[] | null) ?? []).length > 0

  // Revenu prévisionnel : valeur du mois, sinon reconduite du mois précédent
  // pour pré-remplissage (SPECS §7.3). On considère 0 comme « non renseigné ».
  const prevPlanned =
    (prevSettingsRes.data as Pick<MonthlySettings, 'revenue_planned'> | null)
      ?.revenue_planned ?? 0
  const currentPlanned = settings?.revenue_planned ?? 0
  const revenuePlanned = currentPlanned > 0 ? currentPlanned : prevPlanned

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
        revenuePlanned={revenuePlanned}
        targets={{
          needs: settings?.target_needs_pct ?? 50,
          wants: settings?.target_wants_pct ?? 30,
          savings: settings?.target_savings_pct ?? 20,
        }}
        prevHasData={prevHasData}
        readOnly={activeStatus === 'closed'}
      />
    </>
  )
}
