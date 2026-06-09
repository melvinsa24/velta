'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { previousMonthStart } from '@/lib/month'
import type { MonthlyBudget } from '@/types/database'

/*
 * Server Actions de l'écran Budget prévisionnel.
 *
 * Depuis la migration 002, `monthly_budgets` stocke une ligne par DÉPENSE
 * NOMMÉE (label + montant), rattachée à une catégorie. Plusieurs lignes peuvent
 * partager la même category_id sur un même mois : il n'y a plus de contrainte
 * d'unicité, les lignes sont créées / éditées / supprimées par leur `id`.
 */

type ActionResult = { error: string | null }

/** Forme d'une ligne renvoyée au client (sous-ensemble de MonthlyBudget). */
export type BudgetLine = Pick<
  MonthlyBudget,
  'id' | 'category_id' | 'label' | 'planned_amount'
>

const LINE_COLUMNS = 'id, category_id, label, planned_amount'

async function requireClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return supabase
}

/*
 * Crée une nouvelle dépense nommée (label vide à remplir) pour une catégorie et
 * un mois. Renvoie la ligne créée (avec son id) pour que le client l'ajoute sans
 * refetch complet.
 */
export async function createBudgetLine(
  month: string,
  categoryId: string,
): Promise<ActionResult & { line: BudgetLine | null }> {
  const supabase = await requireClient()
  const { data, error } = await supabase
    .from('monthly_budgets')
    .insert({ month, category_id: categoryId, label: '', planned_amount: 0 })
    .select(LINE_COLUMNS)
    .single()
  if (error) return { error: error.message, line: null }
  return { error: null, line: data as BudgetLine }
}

/*
 * Met à jour le label et/ou le montant d'une ligne (par id). Pas de
 * revalidatePath : la saisie est optimiste côté client (debounce / blur).
 */
export async function updateBudgetLine(
  id: string,
  patch: { label?: string; planned_amount?: number },
): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase
    .from('monthly_budgets')
    .update(patch)
    .eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

/*
 * Supprime une dépense prévue (par id). Les transactions éventuellement reliées
 * conservent leur ligne (FK on delete set null), elles perdent juste le
 * rattachement à la prévision.
 */
export async function deleteBudgetLine(id: string): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase.from('monthly_budgets').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

/*
 * « Reprendre le mois précédent » : recopie toutes les dépenses de N-1 (label +
 * montant + catégorie) vers le mois courant. Réservé au cas où le mois courant
 * est encore vide (cf. gating `canCopyPrevious` côté page) — pas de dédoublonnage
 * possible sans contrainte d'unicité. Renvoie les lignes créées.
 */
export async function copyPreviousMonth(
  month: string,
): Promise<ActionResult & { lines: BudgetLine[] }> {
  const supabase = await requireClient()
  const prev = previousMonthStart(month)

  const { data, error: readError } = await supabase
    .from('monthly_budgets')
    .select('category_id, label, planned_amount')
    .eq('month', prev)
    .order('created_at')

  if (readError) return { error: readError.message, lines: [] }

  const prevRows =
    (data as Pick<
      MonthlyBudget,
      'category_id' | 'label' | 'planned_amount'
    >[] | null) ?? []

  if (prevRows.length === 0) return { error: null, lines: [] }

  const rows = prevRows.map((r) => ({
    month,
    category_id: r.category_id,
    label: r.label,
    planned_amount: r.planned_amount,
  }))

  const { data: inserted, error: writeError } = await supabase
    .from('monthly_budgets')
    .insert(rows)
    .select(LINE_COLUMNS)

  if (writeError) return { error: writeError.message, lines: [] }

  revalidatePath('/budget')
  return { error: null, lines: (inserted as BudgetLine[] | null) ?? [] }
}
