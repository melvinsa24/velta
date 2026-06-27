import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { createClient } from '@/lib/supabase/server'
import { normalizeMonth } from '@/lib/month'
import { getMonthExpenseOptions } from '@/lib/data/expenseOptions'
import { HistoriqueScreen } from './HistoriqueScreen'
import { type TransactionRow } from './TransactionList'
import type { MonthlySettings } from '@/types/database'

/*
 * Écran Historique (SPECS §7.5). Server Component : le mois affiché vient du
 * paramètre d'URL `?month=YYYY-MM-01` (défaut = mois en cours), ce qui permet de
 * naviguer dans le passé et corrige l'affichage des transactions antidatées.
 *
 * Charge, pour le mois sélectionné : les transactions (chronologique inverse,
 * jointes au libellé + couleur de leur dépense), les dépenses prévues (filtres /
 * édition) et les revenus réels du mois (sous-onglet Revenus + APL via Flore).
 */
export default async function HistoriquePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: monthParam } = await searchParams
  const month = normalizeMonth(monthParam)

  const supabase = await createClient()

  const [txRes, expenseOptions, settingsRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, expenses(label, color, prorata_total_amount, share_mode)')
      .eq('month', month)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    getMonthExpenseOptions(month),
    supabase
      .from('monthly_settings')
      .select('revenue_salaire, revenue_autres, apl, revenue_flore')
      .eq('month', month)
      .maybeSingle(),
  ])

  const transactions = (txRes.data as TransactionRow[] | null) ?? []
  const settings = settingsRes.data as Pick<
    MonthlySettings,
    'revenue_salaire' | 'revenue_autres' | 'apl' | 'revenue_flore'
  > | null

  return (
    <>
      <ScreenHeader title="Historique" />
      <HistoriqueScreen
        month={month}
        transactions={transactions}
        expenseOptions={expenseOptions}
        revenus={{
          revenue_salaire: settings?.revenue_salaire ?? 0,
          revenue_autres: settings?.revenue_autres ?? 0,
          apl: settings?.apl ?? null,
          revenue_flore: settings?.revenue_flore ?? 0,
        }}
      />
    </>
  )
}
