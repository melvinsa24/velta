import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { createClient } from '@/lib/supabase/server'
import { currentMonthStart, formatMonthLabel } from '@/lib/month'
import { getMonthExpenseOptions } from '@/lib/data/expenseOptions'
import { TransactionList, type TransactionRow } from './TransactionList'

/*
 * Écran Transactions (SPECS §7.4). Server Component : charge les transactions du
 * mois courant (chronologique inverse) jointes au libellé + couleur de leur
 * dépense, ainsi que les dépenses prévues du mois (pour les filtres et le
 * formulaire d'édition). Tri, groupement par jour, filtres et édition /
 * suppression sont délégués au client `TransactionList`.
 */
export default async function TransactionsPage() {
  const supabase = await createClient()
  const month = currentMonthStart()

  const [txRes, expenseOptions] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, expenses(label, color)')
      .eq('month', month)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    getMonthExpenseOptions(month),
  ])

  const transactions = (txRes.data as TransactionRow[] | null) ?? []

  return (
    <>
      <ScreenHeader
        title="Transactions"
        subtitle={formatMonthLabel(month)}
      />
      <TransactionList
        transactions={transactions}
        expenseOptions={expenseOptions}
      />
    </>
  )
}
