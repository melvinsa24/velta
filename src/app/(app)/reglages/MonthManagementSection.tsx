'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, ConfirmModal } from '@/components/ui'
import { cn } from '@/lib/cn'
import { newMonth, closeMonth, reopenMonth } from '@/lib/actions/months'
import type { BudgetStatus } from '@/types/database'

/*
 * Section « Gestion des mois » de l'écran Réglages (Phase 9, SPECS §7.2).
 * Donne les mêmes actions que la bannière du Dashboard, plus la clôture sèche et
 * la réouverture du mois précédent. Chaque action passe par une confirmation.
 */
type ModalKind = 'new' | 'close' | 'reopen' | null

type Props = {
  activeMonth: string
  activeLabel: string
  activeStatus: BudgetStatus
  nextLabel: string
  /** « Nouveau mois » n'a de sens que si le mois actif est en retard sur le calendrier. */
  canNewMonth: boolean
  prevMonth: string
  prevLabel: string
  /** Le mois précédent est-il clôturé ? → affiche « Rouvrir ». */
  prevClosed: boolean
}

export function MonthManagementSection({
  activeMonth,
  activeLabel,
  activeStatus,
  nextLabel,
  canNewMonth,
  prevMonth,
  prevLabel,
  prevClosed,
}: Props) {
  const router = useRouter()
  const [modal, setModal] = useState<ModalKind>(null)
  const close = () => setModal(null)
  // Rafraîchit les données serveur (statut du mois, cibles de réouverture) après
  // chaque action, en complément du revalidatePath côté Server Action.
  const refresh = () => router.refresh()

  const isClosed = activeStatus === 'closed'
  // Cible de réouverture : le mois actif lui-même s'il est clôturé (cas « je viens
  // de clôturer »), sinon le mois précédent s'il est clôturé (cas post « nouveau
  // mois »). Permet de rouvrir le mois qu'on vient de fermer.
  const reopenTarget = isClosed
    ? { month: activeMonth, label: activeLabel }
    : prevClosed
      ? { month: prevMonth, label: prevLabel }
      : null

  return (
    <section>
      <h2 className="mb-1 text-base font-bold tracking-tight text-ink">
        Gestion des mois
      </h2>
      <p className="mb-3 text-sm text-ink-2">
        Clôture le mois en cours et ouvre le suivant, ou corrige une erreur en
        rouvrant le mois précédent.
      </p>

      <Card className="flex flex-col gap-4">
        {/* Mois actif + statut */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-2">Mois en cours</span>
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">{activeLabel}</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-[0.04em]',
                activeStatus === 'in_progress'
                  ? 'bg-surface-2 text-ink-2'
                  : 'bg-ink text-white',
              )}
            >
              {activeStatus === 'in_progress' ? 'En cours' : 'Clôturé'}
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={() => setModal('new')} disabled={!canNewMonth}>
            {canNewMonth ? `Nouveau mois (${nextLabel})` : 'Nouveau mois'}
          </Button>
          {!canNewMonth && (
            <p className="text-xs text-ink-3">
              Disponible une fois le mois calendaire écoulé.
            </p>
          )}

          <Button
            variant="secondary"
            onClick={() => setModal('close')}
            disabled={isClosed}
          >
            {isClosed ? 'Mois déjà clôturé' : 'Clôturer ce mois'}
          </Button>

          {reopenTarget && (
            <Button variant="secondary" onClick={() => setModal('reopen')}>
              Rouvrir {reopenTarget.label}
            </Button>
          )}
        </div>
      </Card>

      {/* Confirmations */}
      <ConfirmModal
        open={modal === 'new'}
        onClose={close}
        title="Nouveau mois"
        confirmLabel="Nouveau mois"
        pendingLabel="Création…"
        message={
          <>
            {activeLabel} sera clôturé et {nextLabel} ouvert : budgets de besoins
            et revenu prévisionnel reconduits, envies et épargne à 0, crédits
            décrémentés.
          </>
        }
        onConfirm={() => newMonth(activeMonth)}
        onSuccess={refresh}
      />

      <ConfirmModal
        open={modal === 'close'}
        onClose={close}
        title="Clôturer ce mois"
        confirmLabel="Clôturer"
        pendingLabel="Clôture…"
        message={
          <>
            {activeLabel} passera en « clôturé », sans créer de nouveau mois. Tu
            pourras le rouvrir ensuite.
          </>
        }
        onConfirm={() => closeMonth(activeMonth)}
        onSuccess={refresh}
      />

      <ConfirmModal
        open={modal === 'reopen'}
        onClose={close}
        title={`Rouvrir ${reopenTarget?.label ?? ''}`}
        confirmLabel="Rouvrir"
        pendingLabel="Réouverture…"
        message={
          <>
            {reopenTarget?.label} repassera « en cours ». Aucune donnée n’est
            modifiée (ni les transactions, ni les budgets du mois suivant).
          </>
        }
        onConfirm={() => reopenMonth(reopenTarget?.month ?? activeMonth)}
        onSuccess={refresh}
      />
    </section>
  )
}
