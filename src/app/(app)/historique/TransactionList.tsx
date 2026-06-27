'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { Card, Modal, Select } from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  CATEGORY_PARENT,
  CATEGORY_TYPE_LABELS,
  CATEGORIES_BY_PARENT,
  PARENT_LABELS,
  PARENT_ORDER,
} from '@/lib/categoryMeta'
import { formatDayLabel } from '@/lib/month'
import {
  TransactionForm,
  type ExpenseOption,
} from '@/components/transaction/TransactionForm'
import type {
  CategoryType,
  ParentType,
  ShareMode,
  Transaction,
} from '@/types/database'

/* Transaction enrichie de la dépense liée (jointure) pour l'affichage. */
export type TransactionRow = Transaction & {
  expenses: {
    label: string
    color: string
    prorata_total_amount: number | null
    share_mode: ShareMode
  } | null
}

/* Couleur neutre des transactions imprévues (sans dépense) — token --ink-3. */
const NEUTRAL_COLOR = 'var(--ink-3)'

function formatEuros(n: number): string {
  return `${n.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} €`
}

/*
 * Valeur du filtre catégorie. On préfixe pour lever l'ambiguïté entre un Type
 * et une Catégorie (la valeur 'epargne' existe dans les deux énumérations) :
 *   ''            → toutes
 *   'p:<parent>'  → filtre sur le Type (Besoins / Envies / Épargne)
 *   'c:<cat>'     → filtre sur une des 5 catégories
 */
type CategoryFilter = string

function matchesCategoryFilter(
  filter: CategoryFilter,
  category: CategoryType,
): boolean {
  if (!filter) return true
  if (filter.startsWith('p:')) {
    return CATEGORY_PARENT[category] === (filter.slice(2) as ParentType)
  }
  if (filter.startsWith('c:')) return category === filter.slice(2)
  return true
}

/* Groupe de transactions d'un même jour (déjà trié en amont, ordre conservé). */
type DayGroup = { dateIso: string; items: TransactionRow[] }

function groupByDay(rows: TransactionRow[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const row of rows) {
    const last = groups[groups.length - 1]
    if (last && last.dateIso === row.date) last.items.push(row)
    else groups.push({ dateIso: row.date, items: [row] })
  }
  return groups
}

export function TransactionList({
  transactions,
  expenseOptions,
}: {
  transactions: TransactionRow[]
  expenseOptions: ExpenseOption[]
}) {
  const router = useRouter()
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('')
  const [unplannedOnly, setUnplannedOnly] = useState(false)
  const [editing, setEditing] = useState<TransactionRow | null>(null)

  const filtered = useMemo(
    () =>
      transactions.filter(
        (t) =>
          matchesCategoryFilter(categoryFilter, t.category) &&
          (!unplannedOnly || t.expense_id === null),
      ),
    [transactions, categoryFilter, unplannedOnly],
  )

  const groups = useMemo(() => groupByDay(filtered), [filtered])

  function closeAndRefresh() {
    setEditing(null)
    router.refresh()
  }

  const hasAny = transactions.length > 0

  return (
    <div className="flex flex-col gap-5">
      {/* Filtres */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SlidersHorizontal
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3"
          />
          <Select
            aria-label="Filtrer par catégorie"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-9"
          >
            <option value="">Toutes les catégories</option>
            <optgroup label="Type">
              {PARENT_ORDER.map((p) => (
                <option key={p} value={`p:${p}`}>
                  {PARENT_LABELS[p]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Catégorie">
              {PARENT_ORDER.flatMap((p) => CATEGORIES_BY_PARENT[p]).map(
                (cat) => (
                  <option key={cat} value={`c:${cat}`}>
                    {CATEGORY_TYPE_LABELS[cat]}
                  </option>
                ),
              )}
            </optgroup>
          </Select>
        </div>

        <button
          type="button"
          onClick={() => setUnplannedOnly((v) => !v)}
          aria-pressed={unplannedOnly}
          className={cn(
            'min-h-11 shrink-0 rounded-card border px-3 text-sm font-medium transition-colors',
            unplannedOnly
              ? 'border-ink bg-ink text-surface'
              : 'border-border-2 bg-surface text-ink-2 hover:text-ink',
          )}
        >
          Imprévues
        </button>
      </div>

      {/* Liste groupée par jour */}
      {!hasAny ? (
        <Card className="py-8">
          <p className="text-center text-sm text-ink-3">
            Aucune transaction ce mois-ci. Appuie sur «&nbsp;+&nbsp;» pour en
            saisir une.
          </p>
        </Card>
      ) : groups.length === 0 ? (
        <Card className="py-8">
          <p className="text-center text-sm text-ink-3">
            Aucune transaction pour ce filtre.
          </p>
        </Card>
      ) : (
        groups.map((group) => (
          <section key={group.dateIso}>
            <p className="mb-2 px-1 text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
              {formatDayLabel(group.dateIso)}
            </p>
            <Card className="p-0">
              {group.items.map((tx, index) => (
                <TransactionItem
                  key={tx.id}
                  tx={tx}
                  isFirst={index === 0}
                  onEdit={() => setEditing(tx)}
                />
              ))}
            </Card>
          </section>
        ))
      )}

      {/* Modale d'édition */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Modifier la transaction"
      >
        {editing && (
          <TransactionForm
            key={editing.id}
            initial={editing}
            expenseOptions={expenseOptions}
            onDone={closeAndRefresh}
            onDeleted={closeAndRefresh}
          />
        )}
      </Modal>
    </div>
  )
}

/* Une transaction : pastille couleur, description + catégorie (+ dépense liée),
 * montant à droite. Tap → édition. */
function TransactionItem({
  tx,
  isFirst,
  onEdit,
}: {
  tx: TransactionRow
  isFirst: boolean
  onEdit: () => void
}) {
  const expenseLabel = tx.expenses?.label ?? null
  const color = tx.expenses?.color ?? NEUTRAL_COLOR
  // Libellé principal : description si saisie, sinon nom de la dépense, sinon
  // catégorie — toujours quelque chose de lisible.
  const primary =
    tx.description?.trim() || expenseLabel || CATEGORY_TYPE_LABELS[tx.category]
  // Nom de dépense en sous-label discret seulement s'il n'est pas déjà le titre.
  const showExpenseSub = expenseLabel !== null && tx.description?.trim()
  // Dépense au prorata : on rappelle le total de la charge (le montant saisi est
  // la part nette réellement payée par Melvin, brief 10c).
  const prorataTotal =
    tx.expenses?.share_mode === 'split_prorata'
      ? tx.expenses.prorata_total_amount
      : null

  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Modifier ${primary}`}
      className={cn(
        'flex min-h-11 w-full items-center gap-3 px-[18px] py-2.5 text-left',
        'hover:bg-surface-2',
        !isFirst && 'border-t border-border',
      )}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-card"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-ink">{primary}</span>
        <span className="truncate text-xs text-ink-3">
          {CATEGORY_TYPE_LABELS[tx.category]}
          {showExpenseSub && (
            <>
              {' · '}
              {expenseLabel}
            </>
          )}
          {prorataTotal !== null && (
            <>
              {' · '}
              <span className="tabular">
                Montant total : {formatEuros(prorataTotal)}
              </span>
            </>
          )}
        </span>
      </span>
      <span className="tabular shrink-0 text-sm font-medium text-ink">
        {formatEuros(tx.amount)}
      </span>
    </button>
  )
}
