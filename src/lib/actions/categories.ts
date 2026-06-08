'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CategoryType, ShareMode } from '@/types/database'

/*
 * Server Actions partagées du CRUD catégorie (utilisées par Réglages ET Budget,
 * cf. réutilisation de la même modale de création). Chaque action vérifie
 * l'authentification puis revalide les deux écrans qui affichent des catégories.
 * On renvoie { error } plutôt que de lever, afin que l'UI affiche un message.
 */

export type CategoryFormInput = {
  name: string
  type: CategoryType
  color: string
  share_mode: ShareMode
  is_credit: boolean
  credit_remaining_months: number | null
  credit_end_date: string | null
  credit_total_remaining: number | null
}

type ActionResult = { error: string | null }

const REVALIDATE_PATHS = ['/reglages', '/budget']

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
 * Si la catégorie n'est pas à crédit, on force les 3 champs crédit à null pour
 * ne pas laisser de données orphelines incohérentes en base.
 */
function creditFields(input: CategoryFormInput) {
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

function categoryColumns(input: CategoryFormInput) {
  return {
    name: input.name.trim(),
    type: input.type,
    color: input.color,
    share_mode: input.share_mode,
    is_credit: input.is_credit,
    ...creditFields(input),
  }
}

export async function createCategory(
  input: CategoryFormInput,
): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase
    .from('categories')
    .insert(categoryColumns(input))
  if (error) return { error: error.message }
  revalidateAll()
  return { error: null }
}

export async function updateCategory(
  id: string,
  input: CategoryFormInput,
): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase
    .from('categories')
    .update(categoryColumns(input))
    .eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return { error: null }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await requireClient()
  // La FK transactions.category_id est `on delete restrict` : si des
  // transactions y sont rattachées, Postgres bloque la suppression. L'UI
  // empêche déjà le clic dans ce cas ; on renvoie le message en filet de
  // sécurité.
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateAll()
  return { error: null }
}
