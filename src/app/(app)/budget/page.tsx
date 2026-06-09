import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { createClient } from '@/lib/supabase/server'
import {
  currentMonthStart,
  formatMonthLabel,
  previousMonthStart,
} from '@/lib/month'
import { BudgetEditor } from './BudgetEditor'
import type { BudgetLine } from './actions'
import type { Category, MonthlySettings } from '@/types/database'

/*
 * Écran Budget prévisionnel. Server Component : charge les catégories, les
 * dépenses nommées du mois courant (label + montant) et les réglages du mois
 * (revenu + objectifs %). Toute l'interaction (saisie inline du label et du
 * montant, ajout/suppression de dépenses, totaux, récap, création de catégorie)
 * est déléguée au client BudgetEditor.
 */
export default async function BudgetPage() {
  const supabase = await createClient()
  const month = currentMonthStart()
  const prevMonth = previousMonthStart(month)

  const [categoriesRes, linesRes, prevLinesRes, settingsRes] =
    await Promise.all([
      supabase.from('categories').select('*').order('created_at'),
      supabase
        .from('monthly_budgets')
        .select('id, category_id, label, planned_amount')
        .eq('month', month)
        .order('created_at'),
      supabase.from('monthly_budgets').select('id').eq('month', prevMonth),
      supabase
        .from('monthly_settings')
        .select('*')
        .eq('month', month)
        .maybeSingle(),
    ])

  const categories = (categoriesRes.data as Category[] | null) ?? []
  const settings = (settingsRes.data as MonthlySettings | null) ?? null
  const lines = (linesRes.data as BudgetLine[] | null) ?? []

  // « Reprendre N-1 » : proposé seulement si N-1 a des dépenses ET que le mois
  // courant est encore vide (la copie n'a pas de dédoublonnage).
  const prevHasData = ((prevLinesRes.data as unknown[] | null) ?? []).length > 0
  const canCopyPrevious = prevHasData && lines.length === 0

  return (
    <>
      <ScreenHeader
        title="Budget"
        subtitle={`Prévisionnel · ${formatMonthLabel(month)}`}
      />
      <BudgetEditor
        month={month}
        categories={categories}
        lines={lines}
        revenue={settings?.revenue_melvin ?? 0}
        targets={{
          needs: settings?.target_needs_pct ?? 50,
          wants: settings?.target_wants_pct ?? 30,
          savings: settings?.target_savings_pct ?? 20,
        }}
        canCopyPrevious={canCopyPrevious}
      />
    </>
  )
}
