'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Modal } from '@/components/ui'
import { ClosedMonthBanner } from '@/components/layout/ClosedMonthBanner'
import { cn } from '@/lib/cn'
import { defaultDateForMonth, formatDayLabel } from '@/lib/month'
import { formatEuros, formatEurosCents, parseAmount } from '@/lib/format'
import { isOverspent } from '@/lib/calculs'
import { createTransaction } from '@/lib/actions/transactions'
import {
  TransactionForm,
  type ExpenseOption,
} from '@/components/transaction/TransactionForm'
import type { CategoryType, Transaction } from '@/types/database'

/*
 * Saisie rapide d'une transaction depuis une ligne de dépense (raccourci du
 * Dashboard, en plus du FAB qui reste inchangé). Bottom sheet à DEUX VUES dans
 * une seule `Modal` — jamais deux modales empilées : `Modal` verrouille le
 * scroll du body à l'ouverture et le rend au démontage, donc une modale interne
 * qui se ferme rendrait le scroll alors que la sheet est encore ouverte.
 *   - vue « saisie »  : montant pré-rempli au restant + date + note + CTA, puis
 *     la liste des transactions du mois déjà rattachées à cette dépense ;
 *   - vue « édition » : `TransactionForm` (la modale de l'Historique,
 *     suppression incluse), atteinte au tap sur une ligne de cette liste.
 *
 * Le composant ne fait AUCUN calcul propre à un écran : `planned` arrive déjà
 * résolu (pour une dépense au prorata, c'est la part nette lue dans
 * `monthly_budgets.planned_amount`) et `transactions` déjà filtrées sur la
 * dépense + le mois. Il est donc réutilisable tel quel — voir la dette technique
 * « divergence prorata » du ROADMAP avant de le porter sur Budget ou Flore.
 *
 * Mois clôturé (`readOnly`) : la sheet s'ouvre en consultation (bandeau, pas de
 * formulaire, lignes inertes), cohérent avec le reste de l'app. Le blocage est
 * client uniquement, comme pour le FAB.
 */

/** Dépense présentée par la sheet (la catégorie n'est qu'une valeur de cohérence). */
export type QuickEntryExpense = {
  id: string
  label: string
  color: string
  category: CategoryType
}

/** Transaction du mois rattachée à la dépense : champs de la liste + de l'édition. */
export type ExpenseTx = Pick<
  Transaction,
  'id' | 'date' | 'amount' | 'expense_id' | 'category' | 'description'
>

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/*
 * Valeur initiale du champ Montant, telle que l'utilisateur l'aurait tapée :
 * arrondie à 2 décimales (indispensable pour les parts au prorata, qui tombent
 * sur 7 décimales) et écrite avec la virgule FR.
 */
function toAmountInput(n: number): string {
  return String(round2(n)).replace('.', ',')
}

/* Petit champ étiqueté (aligné sur TransactionForm / ExpenseForm). */
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

export function ExpenseQuickEntrySheet({
  open,
  onClose,
  expense,
  month,
  planned,
  transactions,
  expenseOptions,
  readOnly = false,
}: {
  open: boolean
  onClose: () => void
  expense: QuickEntryExpense
  /** Mois affiché par l'écran appelant (défaut de date, cf. defaultDateForMonth). */
  month: string
  /** Montant prévu DÉJÀ résolu par l'appelant (part nette pour un prorata). */
  planned: number
  /** Transactions du mois rattachées à cette dépense, triées date décroissante. */
  transactions: ExpenseTx[]
  /** Dépenses du mois — uniquement pour la vue édition (`TransactionForm`). */
  expenseOptions: ExpenseOption[]
  readOnly?: boolean
}) {
  const router = useRouter()
  // Vue courante. `Modal` démonte ses enfants à la fermeture (les champs de
  // saisie se réinitialisent seuls) ; ce state-ci vit au-dessus, on le remet
  // donc à zéro explicitement à la fermeture.
  const [editing, setEditing] = useState<ExpenseTx | null>(null)

  function handleClose() {
    setEditing(null)
    onClose()
  }

  /* Toute mutation réussie ferme la sheet et rafraîchit l'écran : les agrégats
   * du Dashboard (carte héro, jauges, ligne) sont recalculés côté serveur. */
  function closeAndRefresh() {
    handleClose()
    router.refresh()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={editing ? 'Modifier la transaction' : expense.label}
    >
      {editing ? (
        <TransactionForm
          key={editing.id}
          initial={editing}
          expenseOptions={expenseOptions}
          onDone={closeAndRefresh}
          onDeleted={closeAndRefresh}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <QuickEntryBody
          expense={expense}
          month={month}
          planned={planned}
          transactions={transactions}
          readOnly={readOnly}
          onSaved={closeAndRefresh}
          onEdit={setEditing}
        />
      )}
    </Modal>
  )
}

/* Vue « saisie » : en-tête méta, formulaire réduit, puis liste du mois. */
function QuickEntryBody({
  expense,
  month,
  planned,
  transactions,
  readOnly,
  onSaved,
  onEdit,
}: {
  expense: QuickEntryExpense
  month: string
  planned: number
  transactions: ExpenseTx[]
  readOnly: boolean
  onSaved: () => void
  onEdit: (tx: ExpenseTx) => void
}) {
  const spent = transactions.reduce((sum, t) => sum + t.amount, 0)
  const remaining = round2(planned - spent)
  // Restant en rouge exactement quand la ligne du Dashboard qui ouvre la sheet
  // est en dépassement : même seuil, donc jamais l'une sans l'autre.
  const overspent = isOverspent(spent, planned)
  // Rien à proposer si la dépense n'a pas de prévu ou est déjà entièrement
  // couverte : champ vide, CTA éteint tant qu'aucun montant n'est saisi.
  const hasRemaining = planned > 0 && remaining > 0

  const [amount, setAmount] = useState(hasRemaining ? toAmountInput(remaining) : '')
  const [date, setDate] = useState(() => defaultDateForMonth(month))
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const amountRef = useRef<HTMLInputElement>(null)

  // Focus + sélection à l'ouverture : une frappe écrase le restant pré-rempli.
  // rAF plutôt qu'`autoFocus` : la sheet vient d'être montée, iOS n'honore le
  // focus programmatique que sur un élément déjà peint.
  useEffect(() => {
    if (readOnly) return
    const frame = requestAnimationFrame(() => {
      amountRef.current?.focus()
      amountRef.current?.select()
    })
    return () => cancelAnimationFrame(frame)
  }, [readOnly])

  const typed = parseAmount(amount)
  const canSubmit = typed > 0

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!canSubmit) {
      setError('Le montant doit être supérieur à 0.')
      return
    }

    startTransition(async () => {
      // `month` (depuis la date) et `category` (depuis la dépense) sont figés
      // côté serveur : la catégorie transmise n'est qu'une valeur de cohérence.
      const result = await createTransaction({
        date,
        amount: typed,
        expense_id: expense.id,
        category: expense.category,
        description: note.trim() || null,
      })
      if (result.error) {
        setError("Échec de l'enregistrement. Réessaie.")
        return
      }
      onSaved()
    })
  }

  return (
    // Hauteur bornée + défilement interne : sur un petit écran (ou clavier
    // ouvert), méta + formulaire + liste dépassent la zone visible, et la modale
    // verrouille le scroll du body — sans ça, l'en-tête sortirait de l'écran.
    <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto overscroll-contain">
      {/* Méta : pastille de la dépense + prévu / dépensé / restant. */}
      <div className="flex items-start gap-2.5">
        <span
          className="mt-[5px] h-2.5 w-2.5 shrink-0 rounded-card"
          style={{ backgroundColor: expense.color }}
          aria-hidden="true"
        />
        <p className="tabular min-w-0 flex-1 text-sm text-ink-2">
          Prévu {planned > 0 ? formatEuros(planned) : '—'} · Dépensé{' '}
          {formatEuros(spent)} · Restant{' '}
          {planned > 0 ? (
            <span className={cn(overspent && 'font-medium text-down')}>
              {formatEuros(remaining)}
            </span>
          ) : (
            '—'
          )}
        </p>
      </div>

      {readOnly ? (
        <ClosedMonthBanner />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Montant (€)" htmlFor="quick-amount">
            <Input
              id="quick-amount"
              ref={amountRef}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              placeholder="ex : 42,50"
              className="tabular"
              required
            />
          </Field>

          <Field label="Date" htmlFor="quick-date">
            <Input
              id="quick-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>

          <Field label="Note (optionnel)" htmlFor="quick-note">
            <Input
              id="quick-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ex : Intermarché courses"
            />
          </Field>

          {error && (
            <p className="text-sm text-down" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={!canSubmit || pending}
            className="w-full"
          >
            {pending
              ? 'Enregistrement…'
              : canSubmit
                ? `Valider ${formatEurosCents(typed)}`
                : 'Valider'}
          </Button>
        </form>
      )}

      {/* Transactions du mois sur cette dépense — tap : édition / suppression. */}
      <div className="border-t border-border pt-4">
        <p className="px-1 text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
          Transactions du mois
        </p>
        {transactions.length === 0 ? (
          <p className="mt-2 px-1 text-sm text-ink-3">
            Aucune transaction sur cette dépense ce mois-ci.
          </p>
        ) : (
          <div className="mt-1">
            {transactions.map((tx, index) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isFirst={index === 0}
                onEdit={readOnly ? undefined : () => onEdit(tx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* Une transaction de la sous-liste : libellé + jour, montant à droite. */
function TransactionRow({
  tx,
  isFirst,
  onEdit,
}: {
  tx: ExpenseTx
  isFirst: boolean
  /** undefined = lecture seule : la ligne devient inerte (cf. TransactionList). */
  onEdit?: () => void
}) {
  const primary = tx.description?.trim() || 'Sans description'

  const inner = (
    <>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-ink">{primary}</span>
        <span className="text-xs text-ink-3">{formatDayLabel(tx.date)}</span>
      </span>
      <span className="tabular shrink-0 text-sm font-medium text-ink">
        {formatEuros(tx.amount)}
      </span>
    </>
  )

  const rowClass = cn(
    'flex min-h-11 w-full items-center gap-3 px-1 py-2 text-left',
    !isFirst && 'border-t border-border',
  )

  if (!onEdit) return <div className={rowClass}>{inner}</div>

  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Modifier ${primary}`}
      className={cn(rowClass, 'hover:bg-surface-2')}
    >
      {inner}
    </button>
  )
}
