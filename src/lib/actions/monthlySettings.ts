'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/*
 * Server Actions de `monthly_settings` liées aux revenus et à la note du mois
 * (SPECS §6, §7.3, §7.5). Mêmes conventions que les autres actions : auth via
 * requireClient(), retour { error }, revalidation des écrans concernés.
 *
 * Toutes ces écritures sont des upserts sur la clé primaire `month` : seules les
 * colonnes fournies sont touchées, les autres (objectifs %, APL, revenus de
 * Flore…) gardent leur valeur. Aucune valeur dérivée n'est stockée (SPECS §9.1) :
 * la part d'APL revenant à Melvin et le revenu réel total sont calculés à la volée
 * à l'affichage, jamais persistés.
 */

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
 * Revenus réels du mois (Historique > Revenus). Salaire et « autres » sont
 * toujours envoyés ensemble (sauvegarde au blur de l'un ou l'autre champ).
 */
export async function upsertRevenusReels({
  month,
  revenue_salaire,
  revenue_autres,
}: {
  month: string
  revenue_salaire: number
  revenue_autres: number
}): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase
    .from('monthly_settings')
    .upsert(
      { month, revenue_salaire, revenue_autres },
      { onConflict: 'month' },
    )
  if (error) return { error: error.message }
  revalidateAll()
  return { error: null }
}

/*
 * Revenu prévisionnel du mois (écran Budget). Base des % besoins/envies/épargne
 * du récap. Sauvegarde au blur.
 */
export async function upsertRevenuPlanned({
  month,
  revenue_planned,
}: {
  month: string
  revenue_planned: number
}): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase
    .from('monthly_settings')
    .upsert({ month, revenue_planned }, { onConflict: 'month' })
  if (error) return { error: error.message }
  revalidateAll()
  return { error: null }
}

/*
 * Note libre du mois (utilisée en Phase 8b — Dashboard). Créée maintenant pour
 * que le formulaire de note s'y branche directement.
 */
export async function upsertNote({
  month,
  note,
}: {
  month: string
  note: string | null
}): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase
    .from('monthly_settings')
    .upsert({ month, note }, { onConflict: 'month' })
  if (error) return { error: error.message }
  revalidateAll()
  return { error: null }
}
