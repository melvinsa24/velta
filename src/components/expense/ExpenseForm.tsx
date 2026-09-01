'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import { ColorPicker } from './ColorPicker'
import {
  CATEGORY_COLORS,
  CATEGORY_PARENT,
  CATEGORY_TYPE_OPTIONS,
  SHARE_MODE_OPTIONS,
} from '@/lib/categoryMeta'
import { parseAmount } from '@/lib/format'
import {
  archiveExpense,
  createExpense,
  updateExpense,
  type ExpenseFormInput,
} from '@/lib/actions/expenses'
import { upsertBudget } from '@/app/(app)/budget/actions'
import type {
  CategoryType,
  Expense,
  ParentType,
  ShareMode,
} from '@/types/database'

/* Petit champ étiqueté, aligné sur le pattern du formulaire de login. */
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

/*
 * Formulaire de création / édition d'une DÉPENSE (SPECS §7.3). Champs : libellé,
 * catégorie (5 valeurs fixes), couleur, mode de partage, flag crédit, et montant
 * prévisionnel du mois en cours. Si « à crédit » est coché, 3 champs apparaissent.
 *
 * `parentType` pré-filtre les catégories proposées (ex : depuis la section
 * « Besoins » de l'écran Budget, seules les catégories Besoins sont offertes).
 *
 * Au submit :
 *   - création → `expenses` + ligne `monthly_budgets` du mois courant ;
 *   - édition  → met à jour `expenses` et le montant prévisionnel du mois courant.
 *
 * En édition, si `onArchived` est fourni, un bouton « Supprimer » (avec
 * confirmation inline) archive la dépense (SPECS §9.7 : suppression = archivage).
 */
export function ExpenseForm({
  initial,
  parentType,
  month,
  initialAmount,
  onDone,
  onArchived,
}: {
  initial: Expense | null
  parentType?: ParentType
  month: string
  initialAmount?: number
  onDone: () => void
  onArchived?: () => void
}) {
  // Catégories proposées : filtrées sur le parent_type si fourni.
  const categoryOptions = parentType
    ? CATEGORY_TYPE_OPTIONS.filter(
        (o) => CATEGORY_PARENT[o.value] === parentType,
      )
    : CATEGORY_TYPE_OPTIONS

  // Le mode prorata est désormais géré depuis l'onglet Flore (brief 10c) : on le
  // retire de la modale classique. On le garde uniquement si la dépense éditée
  // est déjà en prorata (donnée legacy) pour ne pas casser son édition.
  const shareModeOptions = SHARE_MODE_OPTIONS.filter(
    (o) =>
      o.value !== 'split_prorata' || initial?.share_mode === 'split_prorata',
  )

  const [label, setLabel] = useState(initial?.label ?? '')
  const [category, setCategory] = useState<CategoryType>(
    initial?.category ?? categoryOptions[0]?.value ?? 'besoins_fixes',
  )
  const [color, setColor] = useState(initial?.color ?? CATEGORY_COLORS[0])
  const [shareMode, setShareMode] = useState<ShareMode>(
    initial?.share_mode ?? 'perso_100',
  )
  const [isCredit, setIsCredit] = useState(initial?.is_credit ?? false)
  const [months, setMonths] = useState(
    initial?.credit_remaining_months?.toString() ?? '',
  )
  const [endDate, setEndDate] = useState(initial?.credit_end_date ?? '')
  const [totalRemaining, setTotalRemaining] = useState(
    initial?.credit_total_remaining?.toString() ?? '',
  )
  const [amount, setAmount] = useState(initialAmount?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  // Confirmation de suppression (archivage) en deux temps, sans modale empilée.
  const [confirmingArchive, setConfirmingArchive] = useState(false)
  const [archivePending, startArchive] = useTransition()

  function handleArchive() {
    if (!initial || !onArchived) return
    setError(null)
    startArchive(async () => {
      const result = await archiveExpense(initial.id)
      if (result.error) {
        setError('Échec de la suppression. Réessaie.')
        return
      }
      onArchived()
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!label.trim()) {
      setError('Le libellé est obligatoire.')
      return
    }

    const input: ExpenseFormInput = {
      label,
      description: null,
      category,
      color,
      share_mode: shareMode,
      // Géré via l'onglet Flore ; conservé tel quel pour une dépense prorata legacy.
      prorata_total_amount: initial?.prorata_total_amount ?? null,
      is_credit: isCredit,
      credit_remaining_months: months ? parseInt(months, 10) : null,
      credit_end_date: endDate || null,
      credit_total_remaining: totalRemaining
        ? Number(totalRemaining.replace(',', '.'))
        : null,
    }

    const planned = parseAmount(amount)

    startTransition(async () => {
      if (initial) {
        const result = await updateExpense(initial.id, input)
        if (result.error) {
          setError("Échec de l'enregistrement. Réessaie.")
          return
        }
        // Le montant prévisionnel s'applique au mois courant uniquement.
        await upsertBudget(month, initial.id, planned)
      } else {
        const result = await createExpense(input, month, planned)
        if (result.error) {
          setError("Échec de l'enregistrement. Réessaie.")
          return
        }
      }
      onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Libellé" htmlFor="exp-label">
        <Input
          id="exp-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="ex : Loyer, Courses, PEA"
          required
        />
      </Field>

      <Field label="Catégorie" htmlFor="exp-category">
        <Select
          id="exp-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryType)}
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Couleur">
        <ColorPicker value={color} onChange={setColor} />
      </Field>

      <Field label="Mode de partage" htmlFor="exp-share">
        <Select
          id="exp-share"
          value={shareMode}
          onChange={(e) => setShareMode(e.target.value as ShareMode)}
        >
          {shareModeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>

      {/* Flag crédit */}
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={isCredit}
          onChange={(e) => setIsCredit(e.target.checked)}
          className="h-5 w-5 rounded accent-ink"
        />
        <span className="text-sm text-ink">Dépense à crédit</span>
      </label>

      {/* Champs crédit conditionnels */}
      {isCredit && (
        <div className="flex flex-col gap-4 rounded-card border border-border bg-surface-2 p-4">
          <Field label="Mensualités restantes" htmlFor="exp-months">
            <Input
              id="exp-months"
              inputMode="numeric"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              placeholder="ex : 18"
            />
          </Field>
          <Field label="Date de fin" htmlFor="exp-end">
            <Input
              id="exp-end"
              type="date"
              value={endDate ?? ''}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>
          <Field label="Capital restant dû (€)" htmlFor="exp-total">
            <Input
              id="exp-total"
              inputMode="decimal"
              value={totalRemaining}
              onChange={(e) => setTotalRemaining(e.target.value)}
              placeholder="ex : 4200"
              className="tabular"
            />
          </Field>
        </div>
      )}

      <Field label="Montant prévisionnel du mois (€)" htmlFor="exp-amount">
        <Input
          id="exp-amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="ex : 850"
          className="tabular"
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
          {pending
            ? 'Enregistrement…'
            : initial
              ? 'Enregistrer'
              : 'Créer la dépense'}
        </Button>
      </div>

      {/* Suppression (= archivage) — uniquement en édition. */}
      {initial && onArchived && (
        <div className="mt-1 border-t border-border pt-4">
          {confirmingArchive ? (
            <div className="flex flex-col gap-3 rounded-card border border-down/30 bg-down/5 p-3">
              <p className="text-sm text-ink-2">
                Supprimer «&nbsp;
                <span className="font-medium text-ink">{initial.label}</span>
                &nbsp;» ? Elle disparaît des mois suivants ; les transactions
                passées la conservent.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmingArchive(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleArchive}
                  disabled={archivePending}
                  className="flex-1 bg-down text-white hover:shadow-card-hover active:bg-down"
                >
                  {archivePending ? 'Suppression…' : 'Supprimer'}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingArchive(true)}
              className="flex min-h-11 w-full items-center justify-center gap-2 text-sm text-ink-2 transition-colors hover:text-down"
            >
              <Trash2 size={16} aria-hidden="true" />
              Supprimer cette dépense
            </button>
          )}
        </div>
      )}
    </form>
  )
}
