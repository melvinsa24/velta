'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CategoryType, Expense, ShareMode } from '@/types/database'

/*
 * Server Actions du CRUD « Dépense » (table `expenses`), utilisées par l'écran
 * Budget (modale « Nouvelle dépense » / édition). Chaque action vérifie
 * l'authentification puis revalide les écrans qui affichent des dépenses.
 * On renvoie { error } plutôt que de lever, afin que l'UI affiche un message.
 *
 * Vocabulaire (SPECS §4) : une DÉPENSE appartient à une CATÉGORIE (enum fixe),
 * elle-même rattachée à un TYPE déduit. La couleur / le mode de partage / le
 * crédit sont des propriétés de la dépense.
 */

export type ExpenseFormInput = {
  label: string
  description: string | null
  category: CategoryType
  color: string
  share_mode: ShareMode
  is_credit: boolean
  credit_remaining_months: number | null
  credit_end_date: string | null
  credit_total_remaining: number | null
}

type ActionResult = { error: string | null }

const REVALIDATE_PATHS = ['/budget', '/reglages']

async function requireClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return supabase
}

function revalidateAll() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path)
}

/*
 * Si la dépense n'est pas à crédit, on force les 3 champs crédit à null pour ne
 * pas laisser de données orphelines incohérentes en base.
 */
function creditFields(input: ExpenseFormInput) {
  if (!input.is_credit) {
    return {
      credit_remaining_months: null,
      credit_end_date: null,
      credit_total_remaining: null,
    }
  }
  return {
    credit_remaining_months: input.credit_remaining_months,
    credit_end_date: input.credit_end_date,
    credit_total_remaining: input.credit_total_remaining,
  }
}

function expenseColumns(input: ExpenseFormInput) {
  return {
    label: input.label.trim(),
    description: input.description?.trim() || null,
    category: input.category,
    color: input.color,
    share_mode: input.share_mode,
    is_credit: input.is_credit,
    ...creditFields(input),
  }
}

/*
 * Crée une dépense + sa ligne de prévision pour le mois courant (SPECS §7.3 :
 * « au submit : création d'une ligne dans expenses + une ligne dans
 * monthly_budgets pour le mois en cours »). Renvoie l'id de la dépense créée.
 */
export async function createExpense(
  input: ExpenseFormInput,
  month: string,
  plannedAmount: number,
): Promise<ActionResult & { expenseId: string | null }> {
  const supabase = await requireClient()

  const { data, error } = await supabase
    .from('expenses')
    .insert(expenseColumns(input))
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Échec', expenseId: null }

  const expense = data as Pick<Expense, 'id'>

  const { error: budgetError } = await supabase
    .from('monthly_budgets')
    .insert({ month, expense_id: expense.id, planned_amount: plannedAmount })

  if (budgetError) return { error: budgetError.message, expenseId: expense.id }

  revalidateAll()
  return { error: null, expenseId: expense.id }
}

/*
 * Met à jour les propriétés durables de la dépense (label, couleur, share_mode,
 * crédit…). S'applique aux mois passés et futurs ; les transactions historiques
 * conservent leur snapshot `category` (SPECS §9.6). Ne touche pas au montant
 * prévisionnel mensuel (cf. budget/actions → upsertBudget).
 */
export async function updateExpense(
  id: string,
  input: ExpenseFormInput,
): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase
    .from('expenses')
    .update(expenseColumns(input))
    .eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return { error: null }
}

/*
 * Supprimer une dépense = l'archiver (SPECS §9.7). Les transactions passées la
 * conservent en référence ; elle disparaît des mois futurs et des sélecteurs.
 */
export async function archiveExpense(id: string): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase
    .from('expenses')
    .update({ archived: true })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return { error: null }
}
