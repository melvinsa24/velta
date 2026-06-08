'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { currentMonthStart } from '@/lib/month'

/*
 * Server Action propre à l'écran Réglages : enregistrement des objectifs %.
 * Le CRUD catégorie partagé vit dans `@/lib/actions/categories`.
 */

type ActionResult = { error: string | null }

async function requireClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return supabase
}

export async function saveTargets(input: {
  needs: number
  wants: number
  savings: number
}): Promise<ActionResult> {
  const supabase = await requireClient()
  const month = currentMonthStart()
  // Upsert sur la PK `month` : on ne touche qu'aux 3 cibles, les revenus
  // éventuels du mois restent intacts (les colonnes non fournies gardent leur
  // valeur existante / leur défaut à l'insertion).
  const { error } = await supabase.from('monthly_settings').upsert(
    {
      month,
      target_needs_pct: input.needs,
      target_wants_pct: input.wants,
      target_savings_pct: input.savings,
    },
    { onConflict: 'month' },
  )
  if (error) return { error: error.message }
  revalidatePath('/reglages')
  return { error: null }
}
