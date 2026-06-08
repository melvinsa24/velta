import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { createClient } from '@/lib/supabase/server'
import {
  currentMonthStart,
  formatMonthLabel,
  previousMonthStart,
} from '@/lib/month'
import { BudgetEditor } from './BudgetEditor'
import type { Category, MonthlyBudget, MonthlySettings } from '@/types/database'

/*
 * Écran Budget prévisionnel (Phase 6). Server Component : charge les catégories,
 * les montants prévus du mois courant et de N-1, et les réglages du mois
 * (revenu + objectifs %). Toute l'interaction (saisie inline, totaux, récap,
 * création de catégorie) est déléguée au client BudgetEditor.
 */
export default async function BudgetPage() {
  const supabase = await createClient()
  const month = currentMonthStart()
  const prevMonth = previousMonthStart(month)

  const [categoriesRes, budgetsRes, prevBudgetsRes, settingsRes] =
    await Promise.all([
      supabase.from('categories').select('*').order('created_at'),
      supabase
        .from('monthly_budgets')
        .select('category_id, planned_amount')
        .eq('month', month),
      supabase
        .from('monthly_budgets')
        .select('category_id')
        .eq('month', prevMonth),
      supabase
        .from('monthly_settings')
        .select('*')
        .eq('month', month)
        .maybeSingle(),
    ])

  const categories = (categoriesRes.data as Category[] | null) ?? []
  const settings = (settingsRes.data as MonthlySettings | null) ?? null

  // Map { category_id: planned_amount } pour le mois courant.
  const budgets: Record<string, number> = {}
  const budgetRows =
    (budgetsRes.data as Pick<
      MonthlyBudget,
      'category_id' | 'planned_amount'
    >[] | null) ?? []
  for (const row of budgetRows) budgets[row.category_id] = row.planned_amount

  // « Reprendre N-1 » : proposé seulement si N-1 a des données ET qu'il reste
  // des lignes vides ce mois (catégorie sans montant ou à 0).
  const prevHasData = ((prevBudgetsRes.data as unknown[] | null) ?? []).length > 0
  const hasEmptyLines = categories.some(
    (c) => !(c.id in budgets) || budgets[c.id] === 0,
  )

  return (
    <>
      <ScreenHeader
        title="Budget"
        subtitle={`Prévisionnel · ${formatMonthLabel(month)}`}
      />
      <BudgetEditor
        month={month}
        categories={categories}
        budgets={budgets}
        revenue={settings?.revenue_melvin ?? 0}
        targets={{
          needs: settings?.target_needs_pct ?? 50,
          wants: settings?.target_wants_pct ?? 30,
          savings: settings?.target_savings_pct ?? 20,
        }}
        canCopyPrevious={prevHasData && hasEmptyLines}
      />
    </>
  )
}
