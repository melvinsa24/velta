'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getMonthContext } from '@/lib/data/activeMonth'
import { floreRatio, type RevenueSettings } from '@/lib/calculs'
import { CATEGORY_COLORS } from '@/lib/categoryMeta'
import type { CategoryType, Expense, MonthlySettings, ShareMode } from '@/types/database'

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
  /** Total de la charge partagée — uniquement pour les dépenses split_prorata. */
  prorata_total_amount: number | null
  is_credit: boolean
  credit_remaining_months: number | null
  credit_end_date: string | null
  credit_total_remaining: number | null
}

type ActionResult = { error: string | null }

const REVALIDATE_PATHS = ['/budget', '/reglages']
// Les dépenses prorata sont saisies depuis Flore et impactent le budget + le
// dashboard (via leur part nette dans monthly_budgets) : on revalide plus large.
const PRORATA_REVALIDATE_PATHS = ['/flore', '/budget', '/dashboard', '/reglages']

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
 * Revalidation des écrans impactés par une dépense prorata. `/flore` est une
 * route dynamique (?month=) : on la revalide en 'layout' (et non 'page') pour
 * éviter l'empilement de segments dans le cache routeur App Router, qui
 * provoquait des doublons DOM au fil de la navigation entre mois.
 */
function revalidateProrata() {
  for (const path of PRORATA_REVALIDATE_PATHS) {
    revalidatePath(path, path === '/flore' ? 'layout' : 'page')
  }
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
    // Total conservé seulement pour les prorata, sinon null (pas de donnée orpheline).
    prorata_total_amount:
      input.share_mode === 'split_prorata' ? input.prorata_total_amount : null,
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

// --- Dépenses au prorata (gérées depuis l'onglet Flore, brief Phase 10c) -----

/*
 * Archive une dépense au prorata depuis l'onglet Flore. Identique à
 * `archiveExpense` mais revalide le même périmètre que add/update prorata
 * (`/flore` inclus) : sans `/flore`, la suppression laissait l'écran dans un état
 * de cache incohérent (item supprimé encore affiché + doublon de rendu).
 */
export async function archiveProrataExpense(id: string): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase
    .from('expenses')
    .update({ archived: true })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidateProrata()
  return { error: null }
}

/*
 * Part nette de Melvin pour une charge au prorata (SPECS §7.6) : total × ratio
 * Melvin. On réutilise `floreRatio` (APL exclue de la base, pour rester cohérent
 * avec le reste du module Flore et éviter la circularité). Si Flore n'a aucun
 * revenu, le ratio vaut 1 → la part nette redevient le total (SPECS §9.3).
 * Calcul à la volée (SPECS §9.1) ; seul ce snapshot atterrit dans monthly_budgets.
 */
function prorataNetMelvin(total: number, settings: RevenueSettings): number {
  return total * floreRatio(settings).ratioMelvin
}

/* Réglages revenus du mois actif (défauts à 0 si aucune ligne). */
async function activeRevenueSettings(
  supabase: Awaited<ReturnType<typeof requireClient>>,
  month: string,
): Promise<RevenueSettings> {
  const { data } = await supabase
    .from('monthly_settings')
    .select('apl, revenue_salaire, revenue_autres, revenue_flore')
    .eq('month', month)
    .maybeSingle()
  const s = data as Pick<
    MonthlySettings,
    'apl' | 'revenue_salaire' | 'revenue_autres' | 'revenue_flore'
  > | null
  return {
    apl: s?.apl ?? null,
    revenue_salaire: s?.revenue_salaire ?? 0,
    revenue_autres: s?.revenue_autres ?? 0,
    revenue_flore: s?.revenue_flore ?? 0,
  }
}

/*
 * Crée une dépense au prorata depuis Flore : toujours `besoins_fixes` /
 * `split_prorata`, couleur par défaut. La ligne monthly_budgets du mois actif
 * reçoit la part nette de Melvin (snapshot) — elle se comporte ensuite comme une
 * besoins_fixes normale (dashboard, reconduction roll_to_next_month).
 */
export async function addProrataExpense(input: {
  label: string
  prorata_total_amount: number
}): Promise<ActionResult> {
  const supabase = await requireClient()
  const { activeMonth } = await getMonthContext()
  const settings = await activeRevenueSettings(supabase, activeMonth)

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      label: input.label.trim(),
      description: null,
      category: 'besoins_fixes',
      color: CATEGORY_COLORS[0],
      share_mode: 'split_prorata',
      prorata_total_amount: input.prorata_total_amount,
      is_credit: false,
      archived: false,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Échec' }

  const expense = data as Pick<Expense, 'id'>
  const planned = prorataNetMelvin(input.prorata_total_amount, settings)

  const { error: budgetError } = await supabase
    .from('monthly_budgets')
    .insert({ month: activeMonth, expense_id: expense.id, planned_amount: planned })

  if (budgetError) return { error: budgetError.message }

  revalidateProrata()
  return { error: null }
}

/*
 * Met à jour une dépense au prorata (libellé + total). Rafraîchit aussi la part
 * nette du MOIS ACTIF uniquement (les mois passés ne sont jamais modifiés,
 * SPECS §9). Le budget du mois actif est upserté pour rester cohérent avec le
 * dashboard si une ligne existe déjà ; sinon on la crée.
 */
export async function updateProrataExpense(input: {
  id: string
  label: string
  prorata_total_amount: number
}): Promise<ActionResult> {
  const supabase = await requireClient()
  const { activeMonth } = await getMonthContext()
  const settings = await activeRevenueSettings(supabase, activeMonth)

  const { error } = await supabase
    .from('expenses')
    .update({
      label: input.label.trim(),
      prorata_total_amount: input.prorata_total_amount,
    })
    .eq('id', input.id)

  if (error) return { error: error.message }

  const planned = prorataNetMelvin(input.prorata_total_amount, settings)
  const { error: budgetError } = await supabase
    .from('monthly_budgets')
    .upsert(
      { month: activeMonth, expense_id: input.id, planned_amount: planned },
      { onConflict: 'month,expense_id' },
    )

  if (budgetError) return { error: budgetError.message }

  revalidateProrata()
  return { error: null }
}
