'use client'

import { useState, useTransition } from 'react'
import { Button, Input, Select } from '@/components/ui'
import { ColorPicker } from './ColorPicker'
import {
  CATEGORY_COLORS,
  CATEGORY_TYPE_OPTIONS,
  SHARE_MODE_OPTIONS,
} from '@/lib/categoryMeta'
import {
  createCategory,
  updateCategory,
  type CategoryFormInput,
} from '@/lib/actions/categories'
import type { Category, CategoryType, ShareMode } from '@/types/database'

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
 * Formulaire de création / édition d'une catégorie. Nom, type (le parent_type
 * se déduit automatiquement en base), couleur, mode de partage, flag crédit.
 * Si « à crédit » est coché, 3 champs supplémentaires apparaissent.
 *
 * `defaultType` permet de pré-sélectionner le type à la création (ex : depuis
 * une section de l'écran Budget, on ouvre la modale déjà calée sur le bon
 * parent_type).
 */
export function CategoryForm({
  initial,
  defaultType,
  onDone,
}: {
  initial: Category | null
  defaultType?: CategoryType
  onDone: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<CategoryType>(
    initial?.type ?? defaultType ?? 'besoins_fixes',
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
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Le nom est obligatoire.')
      return
    }

    const input: CategoryFormInput = {
      name,
      type,
      color,
      share_mode: shareMode,
      is_credit: isCredit,
      credit_remaining_months: months ? parseInt(months, 10) : null,
      credit_end_date: endDate || null,
      credit_total_remaining: totalRemaining
        ? Number(totalRemaining.replace(',', '.'))
        : null,
    }

    startTransition(async () => {
      const result = initial
        ? await updateCategory(initial.id, input)
        : await createCategory(input)
      if (result.error) {
        setError("Échec de l'enregistrement. Réessaie.")
        return
      }
      onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Nom" htmlFor="cat-name">
        <Input
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex : Courses, Loyer, PEA"
          required
        />
      </Field>

      <Field label="Type" htmlFor="cat-type">
        <Select
          id="cat-type"
          value={type}
          onChange={(e) => setType(e.target.value as CategoryType)}
        >
          {CATEGORY_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Couleur">
        <ColorPicker value={color} onChange={setColor} />
      </Field>

      <Field label="Mode de partage" htmlFor="cat-share">
        <Select
          id="cat-share"
          value={shareMode}
          onChange={(e) => setShareMode(e.target.value as ShareMode)}
        >
          {SHARE_MODE_OPTIONS.map((opt) => (
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
        <span className="text-sm text-ink">Catégorie à crédit</span>
      </label>

      {/* Champs crédit conditionnels */}
      {isCredit && (
        <div className="flex flex-col gap-4 rounded-card border border-border bg-surface-2 p-4">
          <Field label="Mensualités restantes" htmlFor="cat-months">
            <Input
              id="cat-months"
              inputMode="numeric"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              placeholder="ex : 18"
            />
          </Field>
          <Field label="Date de fin" htmlFor="cat-end">
            <Input
              id="cat-end"
              type="date"
              value={endDate ?? ''}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>
          <Field label="Capital restant dû (€)" htmlFor="cat-total">
            <Input
              id="cat-total"
              inputMode="decimal"
              value={totalRemaining}
              onChange={(e) => setTotalRemaining(e.target.value)}
              placeholder="ex : 4200"
              className="tabular"
            />
          </Field>
        </div>
      )}

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
              : 'Créer la catégorie'}
        </Button>
      </div>
    </form>
  )
}
