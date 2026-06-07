'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
}

/*
 * Modale mobile-first : feuille basse (bottom sheet) sur petit écran.
 * Ferme au clic sur le fond ou via Échap. Le contenu reste vide pour
 * l'instant (la saisie de transaction arrive en Phase 7).
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Empêche le scroll de l'arrière-plan tant que la modale est ouverte.
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Fond assombri */}
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panneau */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-t-card border border-border bg-surface',
          'p-[18px] shadow-hero sm:rounded-card',
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-11 w-11 items-center justify-center rounded-card text-ink-2 hover:bg-surface-2"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
