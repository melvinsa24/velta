'use client'

import { useEffect, useState } from 'react'
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
 *
 * Quand le mois actif est clôturé (`monthClosed`), la saisie est bloquée : un
 * toast invite à rouvrir le mois dans Réglages, la modale ne s'ouvre pas.
 */
export function Fab({
  expenseOptions,
  monthClosed = false,
}: {
  expenseOptions: ExpenseOption[]
  monthClosed?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(false)

  // Toast auto-dismiss ~1,6 s (cf. design system : pilule --ink, texte blanc).
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(false), 1600)
    return () => clearTimeout(timer)
  }, [toast])

  function handleClick() {
    if (monthClosed) {
      setToast(true)
      return
    }
    setOpen(true)
  }

  function handleDone() {
    setOpen(false)
    // Rafraîchit l'écran courant (ex : la liste des transactions) après saisie.
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Ajouter une transaction"
        className={cn(
          // bottom = 32px + home indicator iOS (safe area, PWA standalone).
          'fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] right-[18px] z-40 flex h-16 w-16 items-center justify-center rounded-full',
          'bg-accent text-accent-ink shadow-accent',
          'transition-transform duration-150 hover:-translate-y-0.5 active:bg-accent-press',
        )}
      >
        <Plus size={28} aria-hidden="true" />
      </button>

      {toast && (
        <div
          role="status"
          className={cn(
            'fixed inset-x-4 bottom-28 z-50 mx-auto max-w-xs rounded-full bg-ink',
            'px-4 py-2.5 text-center text-sm text-white shadow-hero',
          )}
        >
          Le mois est clôturé — rouvre-le dans Réglages pour saisir une transaction.
        </div>
      )}

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
