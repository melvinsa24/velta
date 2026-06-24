'use client'

import { useState, useTransition } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

/*
 * Modale de confirmation pour les actions sensibles (Phase 9 : clôture / nouveau
 * mois / réouverture). Compose le `Modal` générique avec un message, un bouton
 * d'annulation et un CTA de confirmation. Gère l'état `pending` et l'affichage
 * d'une erreur renvoyée par l'action ({ error }). Ferme automatiquement au succès.
 */
type ConfirmModalProps = {
  open: boolean
  onClose: () => void
  title: string
  message: React.ReactNode
  confirmLabel?: string
  pendingLabel?: string
  /** Action serveur à exécuter ; renvoie { error } (pattern des Server Actions). */
  onConfirm: () => Promise<{ error: string | null }>
  onSuccess?: () => void
}

export function ConfirmModal({
  open,
  onClose,
  title,
  message,
  confirmLabel = 'Confirmer',
  pendingLabel = 'En cours…',
  onConfirm,
  onSuccess,
}: ConfirmModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const res = await onConfirm()
      if (res.error) {
        setError('Échec de l’opération. Réessaie.')
        return
      }
      onSuccess?.()
      onClose()
    })
  }

  function handleClose() {
    if (pending) return // ne pas fermer pendant l'exécution
    setError(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="text-sm text-ink-2">{message}</div>

        {error && (
          <p className="text-sm text-down" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
            disabled={pending}
          >
            Annuler
          </Button>
          <Button className="flex-1" onClick={handleConfirm} disabled={pending}>
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
