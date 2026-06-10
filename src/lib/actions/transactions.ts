'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { monthStartOfDate } from '@/lib/month'
import type { CategoryType, Expense } from '@/types/database'

/*
 * Server Actions du CRUD « Transaction » (table `transactions`), utilisées par
 * le FAB de saisie rapide et l'écran Transactions. Mêmes conventions que
 * `expenses.ts` : vérification d'auth, retour { error } (jamais de throw vers
 * l'UI), revalidation des écrans concernés.
 *
 * Invariants métier (SPECS §6, §9) garantis ICI, côté serveur :
 *   - `month` est TOUJOURS recalculé depuis `date` (premier jour du mois),
 *     jamais reçu du client ni laissé null.
 *   - `category` est TOUJOURS rempli : en rattachement à une dépense (option A),
 *     on relit `expenses.category` et on la fige en snapshot (la valeur cliente
 *     est ignorée) ; en saisie libre (option B), on prend la catégorie choisie.
 */

export type TransactionFormInput = {
  date: string // 'YYYY-MM-DD'
  amount: number
  /** null = saisie libre (option B) ; sinon rattachement à une dépense (option A). */
  expense_id: string | null
  /** Catégorie de la saisie libre. Ignorée si `expense_id` est fourni. */
  category: CategoryType
  description: string | null
}

type ActionResult = { error: string | null }

const REVALIDATE_PATHS = ['/historique', '/dashboard']

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
 * Détermine la catégorie à figer sur la transaction. En option A, on relit la
 * catégorie de la dépense pour garantir un snapshot fidèle au moment de l'écriture
 * (et ne pas faire confiance à une valeur cliente potentiellement obsolète).
 */
async function resolveCategory(
  supabase: Awaited<ReturnType<typeof requireClient>>,
  input: TransactionFormInput,
): Promise<{ category: CategoryType | null; error: string | null }> {
  if (!input.expense_id) return { category: input.category, error: null }

  const { data, error } = await supabase
    .from('expenses')
    .select('category')
    .eq('id', input.expense_id)
    .single()

  if (error || !data) {
    return { category: null, error: error?.message ?? 'Dépense introuvable' }
  }
  return { category: (data as Pick<Expense, 'category'>).category, error: null }
}

/* Colonnes communes à l'insert et à l'update, dérivées de l'input + la catégorie figée. */
function transactionColumns(input: TransactionFormInput, category: CategoryType) {
  return {
    date: input.date,
    amount: input.amount,
    expense_id: input.expense_id,
    category,
    description: input.description?.trim() || null,
    month: monthStartOfDate(input.date),
  }
}

/* Crée une transaction (SPECS §7.4). `month` et `category` figés côté serveur. */
export async function createTransaction(
  input: TransactionFormInput,
): Promise<ActionResult> {
  const supabase = await requireClient()

  const { category, error: catError } = await resolveCategory(supabase, input)
  if (catError || !category) return { error: catError ?? 'Catégorie manquante' }

  const { error } = await supabase
    .from('transactions')
    .insert(transactionColumns(input, category))

  if (error) return { error: error.message }
  revalidateAll()
  return { error: null }
}

/*
 * Met à jour une transaction existante (édition via la liste). `month` est
 * recalculé depuis la nouvelle date ; la catégorie est re-figée selon le
 * rattachement courant (cohérent avec la création).
 */
export async function updateTransaction(
  id: string,
  input: TransactionFormInput,
): Promise<ActionResult> {
  const supabase = await requireClient()

  const { category, error: catError } = await resolveCategory(supabase, input)
  if (catError || !category) return { error: catError ?? 'Catégorie manquante' }

  const { error } = await supabase
    .from('transactions')
    .update(transactionColumns(input, category))
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateAll()
  return { error: null }
}

/*
 * Supprime définitivement une transaction. Contrairement à une dépense (qu'on
 * archive pour préserver l'historique), une transaction est un enregistrement
 * réel ponctuel : sa suppression est une vraie suppression (SPECS §7.4).
 */
export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return { error: null }
}
