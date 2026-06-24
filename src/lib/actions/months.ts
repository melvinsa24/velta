'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/*
 * Server Actions du workflow de gestion des mois (Phase 9, SPECS §7.2). Mêmes
 * conventions que les autres actions : auth via requireClient(), retour { error }
 * (jamais de throw vers l'UI), revalidation des écrans qui dépendent du mois.
 *
 * Le statut d'un mois vit sur `monthly_settings.status` (migration 005). Les
 * actions « clôturer » / « rouvrir » sont de simples upserts ; « nouveau mois »
 * délègue à la fonction Postgres `roll_to_next_month` pour une bascule ATOMIQUE
 * (clôture + création + reconduction + décréments crédit dans une transaction).
 */

type ActionResult = { error: string | null }

const REVALIDATE_PATHS = ['/dashboard', '/budget', '/reglages', '/historique']

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
 * « Nouveau mois » : clôt le mois actif et ouvre le mois suivant (reconduction
 * des budgets besoins + revenu prévisionnel, décréments crédit). Tout est fait
 * côté base dans une seule transaction (roll_to_next_month) : pas d'état partiel.
 * Idempotent : si le mois suivant est déjà ouvert, la fonction ne fait rien.
 */
export async function newMonth(month: string): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase.rpc('roll_to_next_month', { p_month: month })
  if (error) return { error: error.message }
  revalidateAll()
  return { error: null }
}

/*
 * « Clôturer ce mois » : passe le mois en `closed` sans créer de mois suivant.
 * Upsert sur la PK `month` : crée la ligne (statut closed) si elle n'existait pas.
 */
export async function closeMonth(month: string): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase
    .from('monthly_settings')
    .upsert({ month, status: 'closed' }, { onConflict: 'month' })
  if (error) return { error: error.message }
  revalidateAll()
  return { error: null }
}

/*
 * « Rouvrir » : repasse un mois clôturé en `in_progress`. Ne touche à aucune
 * autre donnée (ni transactions, ni budgets du mois suivant — SPECS §7.2). La
 * visibilité du bouton (mois précédent closed) est gérée côté UI.
 */
export async function reopenMonth(month: string): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase
    .from('monthly_settings')
    .upsert({ month, status: 'in_progress' }, { onConflict: 'month' })
  if (error) return { error: error.message }
  revalidateAll()
  return { error: null }
}
