'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Modal } from '@/components/ui'
import {
  TransactionForm,
  type ExpenseOption,
} from '@/components/transaction/TransactionForm'

/*
 * FAB « + » flottant (saisie rapide d'une transaction, SPECS §7.4). Fixe en bas
 * à droite, assez haut pour éviter la barre Safari iOS. z-index sous le drawer
 * mais au-dessus du contenu. Ouvre la modale de saisie depuis n'importe quel
 * écran. Les dépenses prévues du mois (pour le rattachement) sont fournies par
 * le layout — qui les recharge à chaque navigation (dette technique notée pour
 * la Phase 14 si les transitions iPhone deviennent lentes).
 */
export function Fab({ expenseOptions }: { expenseOptions: ExpenseOption[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function handleDone() {
    setOpen(false)
    // Rafraîchit l'écran courant (ex : la liste des transactions) après saisie.
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ajouter une transaction"
        className={cn(
          'fixed bottom-8 right-[18px] z-40 flex h-16 w-16 items-center justify-center rounded-full',
          'bg-accent text-accent-ink shadow-accent',
          'transition-transform duration-150 hover:-translate-y-0.5 active:bg-accent-press',
        )}
      >
        <Plus size={28} aria-hidden="true" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nouvelle transaction"
      >
        {/* key remonte le formulaire à chaque ouverture → champs réinitialisés. */}
        <TransactionForm
          key={open ? 'open' : 'closed'}
          expenseOptions={expenseOptions}
          onDone={handleDone}
        />
      </Modal>
    </>
  )
}
