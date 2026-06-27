'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { monthStartOfDate } from '@/lib/month'

/*
 * Server Actions du module « Remboursements de Flore » (table `flore_payments`,
 * SPECS §7.6 / brief Phase 10b). Mêmes conventions que `transactions.ts` :
 * vérification d'auth, retour { error } (jamais de throw vers l'UI).
 *
 * Module ISOLÉ (SPECS §9.2) : ces remboursements n'apparaissent ni dans les
 * revenus, ni dans les charges, ni dans les ratios. Seul `/flore` est revalidé.
 *
 * Invariant métier : `month` est TOUJOURS recalculé côté serveur depuis `date`
 * (premier jour du mois), jamais reçu du client.
 */

export type FlorePaymentFormInput = {
  date: string // 'YYYY-MM-DD'
  amount: number
  note: string | null
}

type ActionResult = { error: string | null }

async function requireClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return supabase
}

/* Ajoute un remboursement. `month` figé serveur depuis la date saisie. */
export async function addFlorePayment(
  input: FlorePaymentFormInput,
): Promise<ActionResult> {
  const supabase = await requireClient()

  const { error } = await supabase.from('flore_payments').insert({
    date: input.date,
    amount: input.amount,
    month: monthStartOfDate(input.date),
    note: input.note?.trim() || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/flore')
  return { error: null }
}

/* Supprime un remboursement (vraie suppression, comme une transaction). */
export async function deleteFlorePayment(id: string): Promise<ActionResult> {
  const supabase = await requireClient()
  const { error } = await supabase.from('flore_payments').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/flore')
  return { error: null }
}
