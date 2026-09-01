'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  CATEGORIES_BY_PARENT,
  CATEGORY_TYPE_LABELS,
  CATEGORY_TYPE_OPTIONS,
  PARENT_ORDER,
} from '@/lib/categoryMeta'
import { todayIso } from '@/lib/month'
import { parseAmount } from '@/lib/format'
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type TransactionFormInput,
} from '@/lib/actions/transactions'
import type { CategoryType, Transaction } from '@/types/database'

/**
 * Option du sélecteur « Dépense prévue » : sous-ensemble d'une dépense suffisant
 * pour l'afficher, la grouper par catégorie et figer cette dernière à la saisie.
 * Exporté pour être typé côté Server Components (layout, page transactions).
 */
export type ExpenseOption = {
  id: string
  label: string
  category: CategoryType
  color: string
}

/* Valeurs minimales d'une transaction à éditer (pré-remplissage du formulaire). */
type TransactionInitial = Pick<
  Transaction,
  'id' | 'date' | 'amount' | 'expense_id' | 'category' | 'description'
>

/* Petit champ étiqueté (aligné sur ExpenseForm / formulaire de login). */
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

type Mode = 'expense' | 'free'

/*
 * Formulaire de saisie / édition d'une TRANSACTION (SPECS §7.4). Partagé entre
 * le FAB (création, depuis n'importe quel écran) et la liste (édition).
 *
 * Rattachement présenté en deux options explicites (toggle segmenté) :
 *   - Option A « Dépense prévue » : sélecteur des dépenses du mois (groupées par
 *     catégorie). La catégorie est déduite de la dépense.
 *   - Option B « Catégorie libre » : pas de rattachement, l'utilisateur choisit
 *     une des 5 catégories.
 *
 * `month` n'est PAS saisi : il est recalculé côté serveur depuis la date.
 * En édition, si `onDeleted` est fourni, un bouton Supprimer (confirmation
 * inline) supprime la transaction. `onCancel` permet à l'appelant de distinguer
 * l'abandon du succès (ex : ExpenseQuickEntrySheet revient à sa vue de saisie
 * au lieu de se fermer) ; sans lui, « Annuler » retombe sur `onDone`.
 */
export function TransactionForm({
  initial,
  expenseOptions,
  onDone,
  onDeleted,
  onCancel,
}: {
  initial?: TransactionInitial | null
  expenseOptions: ExpenseOption[]
  onDone: () => void
  onDeleted?: () => void
  /** Abandon explicite. Défaut : `onDone` (comportement historique). */
  onCancel?: () => void
}) {
  const hasExpenses = expenseOptions.length > 0

  const [date, setDate] = useState(initial?.date ?? todayIso())
  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : '',
  )
  // Mode initial : selon le rattachement existant, sinon « dépense prévue » si
  // au moins une dépense est disponible, sinon « libre ».
  const [mode, setMode] = useState<Mode>(() => {
    if (initial) return initial.expense_id ? 'expense' : 'free'
    return hasExpenses ? 'expense' : 'free'
  })
  const [expenseId, setExpenseId] = useState(
    initial?.expense_id ?? expenseOptions[0]?.id ?? '',
  )
  const [category, setCategory] = useState<CategoryType>(
    initial?.category ?? CATEGORY_TYPE_OPTIONS[0].value,
  )
  const [description, setDescription] = useState(initial?.description ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Suppression en deux temps (confirmation inline, pas de modale empilée).
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deletePending, startDelete] = useTransition()

  // Dépenses groupées par catégorie pour les <optgroup>, dans l'ordre du budget.
  const groupedCategories = PARENT_ORDER.flatMap((p) => CATEGORIES_BY_PARENT[p])

  function handleDelete() {
    if (!initial || !onDeleted) return
    setError(null)
    startDelete(async () => {
      const result = await deleteTransaction(initial.id)
      if (result.error) {
        setError('Échec de la suppression. Réessaie.')
        return
      }
      onDeleted()
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const value = parseAmount(amount)
    if (value <= 0) {
      setError('Le montant doit être supérieur à 0.')
      return
    }
    if (mode === 'expense' && !expenseId) {
      setError('Choisis une dépense à laquelle rattacher cette transaction.')
      return
    }

    // En option A, on transmet la catégorie de la dépense pour cohérence ; le
    // serveur la re-figera de toute façon depuis la dépense (source de vérité).
    const selectedExpense = expenseOptions.find((e) => e.id === expenseId)
    const input: TransactionFormInput = {
      date,
      amount: value,
      expense_id: mode === 'expense' ? expenseId : null,
      category:
        mode === 'expense'
          ? (selectedExpense?.category ?? category)
          : category,
      description: description.trim() || null,
    }

    startTransition(async () => {
      const result = initial
        ? await updateTransaction(initial.id, input)
        : await createTransaction(input)
      if (result.error) {
        setError("Échec de l'enregistrement. Réessaie.")
        return
      }
      onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Date" htmlFor="tx-date">
        <Input
          id="tx-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </Field>

      <Field label="Montant (€)" htmlFor="tx-amount">
        <Input
          id="tx-amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="ex : 42,50"
          className="tabular"
          required
        />
      </Field>

      {/* Rattachement — toggle segmenté entre les deux options. */}
      <Field label="Rattachement">
        <div className="flex gap-1 rounded-card bg-surface-2 p-1">
          <SegmentButton
            active={mode === 'expense'}
            disabled={!hasExpenses}
            onClick={() => setMode('expense')}
          >
            Dépense prévue
          </SegmentButton>
          <SegmentButton
            active={mode === 'free'}
            onClick={() => setMode('free')}
          >
            Catégorie libre
          </SegmentButton>
        </div>
      </Field>

      {mode === 'expense' ? (
        hasExpenses ? (
          <Field label="Dépense prévue" htmlFor="tx-expense">
            <Select
              id="tx-expense"
              value={expenseId}
              onChange={(e) => setExpenseId(e.target.value)}
            >
              {groupedCategories.map((cat) => {
                const items = expenseOptions.filter((o) => o.category === cat)
                if (items.length === 0) return null
                return (
                  <optgroup key={cat} label={CATEGORY_TYPE_LABELS[cat]}>
                    {items.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </Select>
          </Field>
        ) : (
          <p className="text-sm text-ink-3">
            Aucune dépense prévue ce mois-ci. Utilise une catégorie libre.
          </p>
        )
      ) : (
        <Field label="Catégorie" htmlFor="tx-category">
          <Select
            id="tx-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryType)}
          >
            {CATEGORY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Description (optionnel)" htmlFor="tx-description">
        <Input
          id="tx-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="ex : Intermarché courses, Coiffeur"
        />
      </Field>

      {error && (
        <p className="text-sm text-down" role="alert">
          {error}
        </p>
      )}

      <div className="mt-1 flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel ?? onDone}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>

      {/* Suppression — uniquement en édition. */}
      {initial && onDeleted && (
        <div className="mt-1 border-t border-border pt-4">
          {confirmingDelete ? (
            <div className="flex flex-col gap-3 rounded-card border border-down/30 bg-down/5 p-3">
              <p className="text-sm text-ink-2">
                Supprimer définitivement cette transaction ?
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={deletePending}
                  className="flex-1 bg-down text-white hover:shadow-card-hover active:bg-down"
                >
                  {deletePending ? 'Suppression…' : 'Supprimer'}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="flex min-h-11 w-full items-center justify-center gap-2 text-sm text-ink-2 transition-colors hover:text-down"
            >
              <Trash2 size={16} aria-hidden="true" />
              Supprimer cette transaction
            </button>
          )}
        </div>
      )}
    </form>
  )
}

/* Bouton d'un toggle segmenté : actif = surface --ink, inactif = texte discret. */
function SegmentButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'min-h-11 flex-1 rounded-card px-3 text-sm font-medium transition-colors',
        active ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink',
        disabled && 'opacity-40',
      )}
    >
      {children}
    </button>
  )
}
