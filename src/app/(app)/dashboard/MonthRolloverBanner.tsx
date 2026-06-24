'use client'

import { useState } from 'react'
import { Button, ConfirmModal } from '@/components/ui'
import { newMonth } from '@/lib/actions/months'

/*
 * Bannière de bascule de mois (Phase 9, SPECS §7.2). Affichée en haut du
 * Dashboard quand le mois actif est en retard sur le calendrier. Respecte le
 * design system : surface blanche, bordure --border, texte --ink-2, CTA lime.
 * Le clic ouvre une confirmation avant d'exécuter « Nouveau mois ».
 */
export function MonthRolloverBanner({
  activeMonth,
  activeLabel,
  nextLabel,
}: {
  activeMonth: string
  activeLabel: string
  nextLabel: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-[14px] shadow-card">
      <p className="text-sm text-ink-2">
        <span className="font-medium text-ink">{activeLabel}</span> est terminé —
        passer en {nextLabel} ?
      </p>
      <Button onClick={() => setOpen(true)} className="shrink-0">
        Nouveau mois
      </Button>

      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        title="Nouveau mois"
        confirmLabel="Nouveau mois"
        pendingLabel="Création…"
        message={
          <>
            {activeLabel} sera clôturé et {nextLabel} ouvert : tes budgets de
            besoins et ton revenu prévisionnel sont reconduits, les envies et
            l’épargne repartent à 0, et les crédits en cours sont décrémentés.
          </>
        }
        onConfirm={() => newMonth(activeMonth)}
      />
    </div>
  )
}
