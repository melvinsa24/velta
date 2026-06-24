import { createClient } from '@/lib/supabase/server'
import { CATEGORY_TYPE_OPTIONS } from '@/lib/categoryMeta'
import type { CategoryType } from '@/types/database'

/*
 * Dépenses imprévues du mois (SPECS §7.1, bloc Dashboard) : transactions SANS
 * rattachement à une dépense prévue, regroupées par catégorie.
 *
 * Le filtre est strict au niveau requête (`.is('expense_id', null)`) : une
 * transaction rattachée (expense_id non null) ne peut donc jamais apparaître ici
 * — elle est comptée dans le bloc de sa dépense prévue (correctif Bug 4).
 */

export type UnplannedTx = {
  id: string
  date: string // ISO 'YYYY-MM-DD'
  description: string | null
  amount: number
}

export type UnplannedCategory = {
  category: CategoryType
  total: number
  items: UnplannedTx[]
}

export async function getUnplannedDetail(
  month: string,
): Promise<UnplannedCategory[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('transactions')
    .select('id, date, description, amount, category')
    .eq('month', month)
    .is('expense_id', null) // strict : uniquement les transactions non rattachées
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  const rows =
    (data as (UnplannedTx & { category: CategoryType })[] | null) ?? []

  // Regroupe par catégorie (les transactions sont déjà triées par date desc).
  const byCategory = new Map<CategoryType, UnplannedCategory>()
  for (const row of rows) {
    const entry = byCategory.get(row.category) ?? {
      category: row.category,
      total: 0,
      items: [],
    }
    entry.total += row.amount
    entry.items.push({
      id: row.id,
      date: row.date,
      description: row.description,
      amount: row.amount,
    })
    byCategory.set(row.category, entry)
  }

  // Ordre d'affichage stable = ordre des catégories (categoryMeta).
  return CATEGORY_TYPE_OPTIONS.map((opt) => byCategory.get(opt.value)).filter(
    (entry): entry is UnplannedCategory => entry !== undefined,
  )
}
