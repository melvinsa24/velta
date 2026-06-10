'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Modal } from '@/components/ui'

/*
 * FAB « + » flottant (saisie rapide). Fixe en bas à droite, assez haut pour
 * éviter la barre Safari iOS. z-index sous le drawer mais au-dessus du
 * contenu. La modale de saisie reste vide (la saisie arrive en Phase 7).
 */
export function Fab() {
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setQuickAddOpen(true)}
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
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        title="Nouvelle transaction"
      >
        <p className="text-sm text-ink-2">
          La saisie rapide arrivera en Phase 7.
        </p>
      </Modal>
    </>
  )
}
