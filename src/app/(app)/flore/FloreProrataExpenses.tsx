'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button, Input, Modal, ConfirmModal } from '@/components/ui'
import {
  addProrataExpense,
  updateProrataExpense,
  archiveProrataExpense,
} from '@/lib/actions/expenses'

/*
 * Section « Dépenses au prorata » de l'onglet Flore (brief Phase 10c). Les
 * dépenses `split_prorata` sont créées et gérées ICI (et non plus depuis la
 * modale Budget classique). Elles restent des `expenses` normales (catégorie
 * `besoins_fixes`), seul leur point d'entrée change.
 *
 * Le total est porté par la dépense (`prorata_total_amount`) ; la part nette de
 * Melvin et la part de Flore sont recalculées à la volée côté serveur (props
 * `lines`) — aucune valeur dérivée n'est stockée (SPECS §9.1). Si Flore n'a aucun
 * revenu, on affiche le total (100 % à charge de Melvin, SPECS §9.3).
 */

export type ProrataLine = {
  id: string
  label: string
  /** Total de la charge (null si non renseigné — donnée legacy). */
  total: number | null
  floreShare: number
  melvinShare: number
}

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

type ModalState = { mode: 'add' } | { mode: 'edit'; line: ProrataLine } | null

export function FloreProrataExpenses({
  lines,
  hasFlore,
  readOnly = false,
}: {
  lines: ProrataLine[]
  hasFlore: boolean
  readOnly?: boolean
}) {
  const [modal, setModal] = useState<ModalState>(null)
  const [deleting, setDeleting] = useState<ProrataLine | null>(null)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight text-ink">
          Dépenses au prorata
        </h2>
        {!readOnly && (
          <Button onClick={() => setModal({ mode: 'add' })}>Ajouter</Button>
        )}
      </div>

      {lines.length === 0 ? (
        <p className="text-sm text-ink-3">Aucune dépense au prorata</p>
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {lines.map((line, i) => (
            <ProrataRow
              key={line.id}
              line={line}
              hasFlore={hasFlore}
              border={i > 0}
              readOnly={readOnly}
              onEdit={() => setModal({ mode: 'edit', line })}
              onDelete={() => setDeleting(line)}
            />
          ))}
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={
          modal?.mode === 'edit'
            ? 'Modifier la dépense'
            : 'Ajouter une dépense au prorata'
        }
      >
        {modal?.mode === 'add' && <ProrataForm onDone={() => setModal(null)} />}
        {modal?.mode === 'edit' && (
          <ProrataForm
            key={modal.line.id}
            initial={modal.line}
            onDone={() => setModal(null)}
          />
        )}
      </Modal>

      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Supprimer cette dépense"
        message="Elle disparaît des mois suivants ; les transactions passées la conservent."
        confirmLabel="Supprimer"
        pendingLabel="Suppression…"
        onConfirm={() => archiveProrataExpense(deleting!.id)}
      />
    </section>
  )
}

/* Une dépense prorata : libellé + part nette (ou total si Flore non renseigné),
 * sous-ligne détaillée, actions éditer / supprimer. */
function ProrataRow({
  line,
  hasFlore,
  border,
  readOnly,
  onEdit,
  onDelete,
}: {
  line: ProrataLine
  hasFlore: boolean
  border: boolean
  readOnly: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const hasTotal = line.total !== null

  // Valeur mise en avant : part nette si Flore a un revenu, sinon le total.
  const primary = !hasTotal
    ? '—'
    : hasFlore
      ? formatEuros(line.melvinShare)
      : formatEuros(line.total!)

  // Sous-ligne explicative.
  const sub = !hasTotal
    ? 'Montant total à renseigner'
    : hasFlore
      ? `Total : ${formatEuros(line.total!)} · Part Flore : ${formatEuros(line.floreShare)}`
      : 'Revenus Flore non renseignés — 100 % à votre charge'

  return (
    <div className={`px-[18px] py-3 ${border ? 'border-t border-border' : ''}`}>
      <div className="flex items-center gap-2.5">
        <span className="min-w-0 flex-1 truncate text-sm text-ink">
          {line.label}
        </span>
        <span className="tabular shrink-0 text-sm font-medium text-ink">
          {primary}
        </span>
        {!readOnly && (
          <>
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Modifier ${line.label}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card text-ink-3 transition-colors hover:text-ink"
            >
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Supprimer ${line.label}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card text-ink-3 transition-colors hover:text-down"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      <p className="tabular mt-1 text-xs text-ink-3">{sub}</p>
    </div>
  )
}

/* Formulaire d'ajout / édition : libellé + montant total. La part nette est
 * recalculée côté serveur (action). */
function ProrataForm({
  initial,
  onDone,
}: {
  initial?: ProrataLine
  onDone: () => void
}) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [total, setTotal] = useState(
    initial?.total != null ? String(initial.total) : '',
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!label.trim()) {
      setError('Le libellé est obligatoire.')
      return
    }
    const amount = parseAmount(total)
    if (amount <= 0) {
      setError('Le montant total doit être supérieur à 0.')
      return
    }

    startTransition(async () => {
      const result = initial
        ? await updateProrataExpense({
            id: initial.id,
            label,
            prorata_total_amount: amount,
          })
        : await addProrataExpense({ label, prorata_total_amount: amount })
      if (result.error) {
        setError("Échec de l'enregistrement. Réessaie.")
        return
      }
      onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Libellé" htmlFor="prorata-label">
        <Input
          id="prorata-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="ex : Loyer"
          required
        />
      </Field>

      <Field label="Montant total (€)" htmlFor="prorata-total">
        <Input
          id="prorata-total"
          inputMode="decimal"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          placeholder="ex : 600"
          className="tabular"
          required
        />
      </Field>

      {error && (
        <p className="text-sm text-down" role="alert">
          {error}
        </p>
      )}

      <div className="mt-1 flex gap-3">
        <Button type="button" variant="secondary" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}

/* Champ étiqueté (aligné sur les autres formulaires). */
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
