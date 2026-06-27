'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button, Input, Modal, ConfirmModal } from '@/components/ui'
import { formatDateLong, todayIso } from '@/lib/month'
import {
  addFlorePayment,
  deleteFlorePayment,
} from '@/lib/actions/florePayments'
import type { FlorePayment } from '@/types/database'

/*
 * Section 5 de l'onglet Flore (SPECS §7.6 / brief Phase 10b) : suivi des
 * remboursements RÉELS de Flore pour le mois affiché. Module isolé — ces
 * montants ne touchent jamais aux revenus, charges ou ratios (SPECS §9.2).
 *
 * `payments` est fourni filtré (mois actif) et trié (date desc) côté serveur.
 * `totalDue` est la dette théorique « Flore me doit » calculée en 10a, INCHANGÉE
 * par les remboursements : on l'utilise seulement pour le « reste à recevoir ».
 */

/* Parse une saisie FR (virgule décimale tolérée) ; 0 si vide / invalide. */
function parseAmount(value: string): number {
  if (!value.trim()) return 0
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function formatEuros(n: number): string {
  return `${n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`
}

export function FlorePayments({
  payments,
  totalDue,
}: {
  payments: FlorePayment[]
  totalDue: number
}) {
  const [addOpen, setAddOpen] = useState(false)
  // Remboursement en cours de suppression (null = aucune confirmation ouverte).
  const [deleting, setDeleting] = useState<FlorePayment | null>(null)

  const alreadyPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = totalDue - alreadyPaid
  const settled = remaining <= 0

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight text-ink">
          Remboursements
        </h2>
        <Button onClick={() => setAddOpen(true)}>Flore m&apos;a remboursé</Button>
      </div>

      {/* Liste des remboursements du mois. */}
      {payments.length === 0 ? (
        <p className="text-sm text-ink-3">Aucun remboursement ce mois</p>
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {payments.map((p, i) => (
            <PaymentRow
              key={p.id}
              payment={p}
              border={i > 0}
              onDelete={() => setDeleting(p)}
            />
          ))}
        </div>
      )}

      {/* Récap : déjà remboursé + reste à recevoir (ou solde apuré). */}
      <div className="flex flex-col gap-1.5 rounded-card border border-border bg-surface-2 px-[18px] py-3">
        <div className="flex items-center justify-between text-sm text-ink-2">
          <span>Déjà remboursé</span>
          <span className="tabular font-medium text-ink">
            {formatEuros(alreadyPaid)}
          </span>
        </div>
        {settled ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-2">Reste à recevoir</span>
            <span className="font-medium text-up">✓ Solde apuré</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-2">Reste à recevoir</span>
            <span className="tabular font-medium text-ink">
              {formatEuros(remaining)}
            </span>
          </div>
        )}
      </div>

      <AddPaymentModal open={addOpen} onClose={() => setAddOpen(false)} />

      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Supprimer ce remboursement"
        message="Ce remboursement sera définitivement supprimé."
        confirmLabel="Supprimer"
        pendingLabel="Suppression…"
        onConfirm={() => deleteFlorePayment(deleting!.id)}
      />
    </section>
  )
}

/* Ligne d'un remboursement : date, note éventuelle, montant, suppression. */
function PaymentRow({
  payment,
  border,
  onDelete,
}: {
  payment: FlorePayment
  border: boolean
  onDelete: () => void
}) {
  return (
    <div
      className={`flex items-center gap-3 px-[18px] py-3 ${
        border ? 'border-t border-border' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink">{formatDateLong(payment.date)}</p>
        {payment.note && (
          <p className="truncate text-xs text-ink-3">{payment.note}</p>
        )}
      </div>
      <span className="tabular shrink-0 text-sm font-medium text-ink">
        {formatEuros(payment.amount)}
      </span>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Supprimer ce remboursement"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card text-ink-3 transition-colors hover:text-down"
      >
        <Trash2 size={18} aria-hidden="true" />
      </button>
    </div>
  )
}

/* Modale d'ajout : date (défaut aujourd'hui), montant, note optionnelle. */
function AddPaymentModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [date, setDate] = useState(todayIso())
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function reset() {
    setDate(todayIso())
    setAmount('')
    setNote('')
    setError(null)
  }

  function handleClose() {
    if (pending) return
    reset()
    onClose()
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const value = parseAmount(amount)
    if (value <= 0) {
      setError('Le montant doit être supérieur à 0.')
      return
    }

    startTransition(async () => {
      // `month` n'est pas transmis : le serveur le calcule depuis la date saisie.
      const result = await addFlorePayment({
        date,
        amount: value,
        note: note.trim() || null,
      })
      if (result.error) {
        setError("Échec de l'enregistrement. Réessaie.")
        return
      }
      reset()
      onClose()
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Ajouter un remboursement">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Date" htmlFor="fp-date">
          <Input
            id="fp-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </Field>

        <Field label="Montant (€)" htmlFor="fp-amount">
          <Input
            id="fp-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="ex : 120,50"
            className="tabular"
            required
          />
        </Field>

        <Field label="Note (optionnel)" htmlFor="fp-note">
          <Input
            id="fp-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ex : virement du 12 juin"
          />
        </Field>

        {error && (
          <p className="text-sm text-down" role="alert">
            {error}
          </p>
        )}

        <div className="mt-1 flex gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/* Champ étiqueté (aligné sur TransactionForm / ExpenseForm). */
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm text-ink-2">
        {label}
      </label>
      {children}
    </div>
  )
}
