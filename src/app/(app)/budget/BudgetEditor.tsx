'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CopyPlus } from 'lucide-react'
import { Button, Card, Modal } from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  CATEGORIES_BY_PARENT,
  CATEGORY_PARENT,
  CATEGORY_TYPE_LABELS,
  PARENT_LABELS,
  PARENT_ORDER,
} from '@/lib/categoryMeta'
import { ExpenseForm } from '@/components/expense/ExpenseForm'
import { copyPreviousMonth, upsertBudget, type BudgetLine } from './actions'
import type { Expense, ParentType } from '@/types/database'

type Targets = { needs: number; wants: number; savings: number }

type Props = {
  month: string
  /** Dépenses non archivées (entités durables : libellé, catégorie, couleur…). */
  expenses: Expense[]
  /** Montants prévisionnels du mois courant (une ligne par dépense budgétée). */
  budgets: Pick<BudgetLine, 'expense_id' | 'planned_amount'>[]
  revenue: number
  targets: Targets
  /** Le mois N-1 a-t-il des montants à reprendre ? */
  prevHasData: boolean
}

/* Cible d'objectif % par parent_type. */
const TARGET_KEY: Record<ParentType, keyof Targets> = {
  besoin: 'needs',
  envie: 'wants',
  epargne: 'savings',
}

/* Parse une saisie FR (virgule décimale tolérée) ; 0 si vide / invalide. */
function parseAmount(value: string): number {
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function formatEuros(n: number): string {
  return `${n.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} €`
}

/* Construit la table { expense_id -> montant (string) } depuis les lignes du mois. */
function buildAmounts(
  budgets: Pick<BudgetLine, 'expense_id' | 'planned_amount'>[],
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const b of budgets) map[b.expense_id] = String(b.planned_amount)
  return map
}

/* État de la modale dépense : création (pré-filtrée sur un type) ou édition. */
type ModalState =
  | { mode: 'add'; parent: ParentType }
  | { mode: 'edit'; expense: Expense }
  | null

export function BudgetEditor({
  month,
  expenses,
  budgets,
  revenue,
  targets,
  prevHasData,
}: Props) {
  const router = useRouter()

  // Montant saisi par dépense (chaîne, pour piloter les inputs).
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    buildAmounts(budgets),
  )
  // Dépenses ayant déjà une ligne monthly_budgets ce mois-ci (pour le gating
  // « Reprendre N-1 » : on ne propose la reprise que s'il reste des montants vides).
  const [rowed, setRowed] = useState<Set<string>>(
    () => new Set(budgets.map((b) => b.expense_id)),
  )
  const [modal, setModal] = useState<ModalState>(null)
  const [copying, startCopy] = useTransition()

  // Resynchronise l'état local quand le serveur renvoie de nouvelles données
  // (après création / édition / archivage d'une dépense → router.refresh) :
  // pattern officiel d'ajustement d'état pendant le rendu (cf. React docs « you
  // might not need an effect »). La saisie inline du montant ne déclenche pas de
  // refresh → pas d'écrasement d'une saisie en cours.
  const budgetSig = budgets
    .map((b) => `${b.expense_id}:${b.planned_amount}`)
    .sort()
    .join('|')
  const [prevSig, setPrevSig] = useState(budgetSig)
  if (budgetSig !== prevSig) {
    setPrevSig(budgetSig)
    setAmounts(buildAmounts(budgets))
    setRowed(new Set(budgets.map((b) => b.expense_id)))
  }

  // Timers de debounce, un par dépense (saisie inline du montant).
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  function flushAmount(expenseId: string, value: string) {
    clearTimeout(timers.current[expenseId])
    void upsertBudget(month, expenseId, parseAmount(value))
  }

  function handleAmountChange(expenseId: string, value: string) {
    setAmounts((prev) => ({ ...prev, [expenseId]: value }))
    setRowed((prev) => new Set(prev).add(expenseId)) // l'upsert crée la ligne
    clearTimeout(timers.current[expenseId])
    timers.current[expenseId] = setTimeout(
      () => flushAmount(expenseId, value),
      500,
    )
  }

  function handleCopy() {
    startCopy(async () => {
      const res = await copyPreviousMonth(month)
      if (res.error) return
      setAmounts((prev) => {
        const next = { ...prev }
        for (const line of res.lines) next[line.expense_id] = String(line.planned_amount)
        return next
      })
      setRowed(new Set(res.lines.map((l) => l.expense_id)))
    })
  }

  function closeAndRefresh() {
    setModal(null)
    router.refresh()
  }

  const amountOf = (expenseId: string) => amounts[expenseId] ?? ''

  const parentTotal = (parent: ParentType) =>
    expenses.reduce(
      (sum, e) =>
        CATEGORY_PARENT[e.category] === parent
          ? sum + parseAmount(amountOf(e.id))
          : sum,
      0,
    )

  const totals = {
    besoin: parentTotal('besoin'),
    envie: parentTotal('envie'),
    epargne: parentTotal('epargne'),
  }
  const grandTotal = totals.besoin + totals.envie + totals.epargne

  // Reprise proposée si N-1 a des données ET au moins une dépense n'a pas encore
  // de montant ce mois-ci.
  const canCopyPrevious =
    prevHasData && expenses.some((e) => !rowed.has(e.id))

  return (
    <div className="flex flex-col gap-8">
      {canCopyPrevious && (
        <Button
          variant="secondary"
          onClick={handleCopy}
          disabled={copying}
          className="w-full"
        >
          <CopyPlus size={18} aria-hidden="true" />
          {copying ? 'Reprise…' : 'Reprendre les montants du mois précédent'}
        </Button>
      )}

      {PARENT_ORDER.map((parent) => {
        const cats = CATEGORIES_BY_PARENT[parent]
        const showSub = cats.length > 1 // pas de sous-titre pour l'Épargne
        const parentExpenses = expenses.filter(
          (e) => CATEGORY_PARENT[e.category] === parent,
        )

        return (
          <section key={parent}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-3 uppercase">
                {PARENT_LABELS[parent]}
              </p>
              <span className="tabular text-sm font-medium text-ink-2">
                {formatEuros(totals[parent])}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {parentExpenses.length === 0 && (
                <Card className="py-3">
                  <p className="text-sm text-ink-3">
                    Aucune dépense pour l&apos;instant.
                  </p>
                </Card>
              )}

              {cats.map((cat) => {
                const items = expenses.filter((e) => e.category === cat)
                if (items.length === 0) return null
                return (
                  <div key={cat} className="flex flex-col gap-1.5">
                    {showSub && (
                      <p className="px-1 text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
                        {CATEGORY_TYPE_LABELS[cat]}
                      </p>
                    )}
                    <Card className="p-0">
                      {items.map((expense, index) => (
                        <ExpenseRow
                          key={expense.id}
                          expense={expense}
                          amount={amountOf(expense.id)}
                          isFirst={index === 0}
                          onEdit={() => setModal({ mode: 'edit', expense })}
                          onAmountChange={(v) =>
                            handleAmountChange(expense.id, v)
                          }
                          onAmountBlur={(v) => flushAmount(expense.id, v)}
                        />
                      ))}
                    </Card>
                  </div>
                )
              })}

              <button
                type="button"
                onClick={() => setModal({ mode: 'add', parent })}
                className={cn(
                  'flex min-h-11 w-full items-center justify-center gap-2 rounded-card',
                  'border border-dashed border-border-2 py-2.5 text-sm text-ink-2',
                  'hover:bg-surface-2',
                )}
              >
                <Plus size={16} aria-hidden="true" />
                Ajouter une dépense
              </button>
            </div>
          </section>
        )
      })}

      {/* Récap */}
      <section>
        <h2 className="mb-3 text-base font-bold tracking-tight text-ink">
          Récap
        </h2>
        <Card className="flex flex-col gap-3">
          {PARENT_ORDER.map((parent) => (
            <RecapRow
              key={parent}
              label={PARENT_LABELS[parent]}
              total={totals[parent]}
              revenue={revenue}
              targetPct={targets[TARGET_KEY[parent]]}
            />
          ))}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-medium text-ink">Total prévu</span>
            <span className="tabular text-base font-bold text-ink">
              {formatEuros(grandTotal)}
            </span>
          </div>

          {revenue === 0 && (
            <p className="text-xs text-ink-3">
              Renseigne ton revenu du mois pour afficher les pourcentages.
            </p>
          )}
        </Card>
      </section>

      {/* Modale dépense : création (pré-filtrée) ou édition. */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Modifier la dépense' : 'Nouvelle dépense'}
      >
        {modal?.mode === 'add' && (
          <ExpenseForm
            key={`add-${modal.parent}`}
            initial={null}
            parentType={modal.parent}
            month={month}
            onDone={closeAndRefresh}
          />
        )}
        {modal?.mode === 'edit' && (
          <ExpenseForm
            key={`edit-${modal.expense.id}`}
            initial={modal.expense}
            month={month}
            initialAmount={parseAmount(amountOf(modal.expense.id))}
            onDone={closeAndRefresh}
            onArchived={closeAndRefresh}
          />
        )}
      </Modal>
    </div>
  )
}

/* Une dépense dans le budget : pastille couleur + libellé (tap → édition) +
 * montant prévu éditable inline. */
function ExpenseRow({
  expense,
  amount,
  isFirst,
  onEdit,
  onAmountChange,
  onAmountBlur,
}: {
  expense: Expense
  amount: string
  isFirst: boolean
  onEdit: () => void
  onAmountChange: (value: string) => void
  onAmountBlur: (value: string) => void
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-[18px] py-2',
        !isFirst && 'border-t border-border',
      )}
    >
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Modifier ${expense.label}`}
        className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-card px-1 text-left hover:bg-surface-2"
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-card"
          style={{ backgroundColor: expense.color }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-sm text-ink">
          {expense.label}
        </span>
      </button>
      <input
        inputMode="decimal"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        onBlur={(e) => onAmountBlur(e.target.value)}
        placeholder="0"
        aria-label={`Montant prévu ${expense.label}`}
        className={cn(
          'tabular h-11 w-24 rounded-card border border-border bg-surface',
          'px-2 text-right text-base text-ink outline-none',
          'transition-colors focus:border-ink',
        )}
      />
      <span className="w-3 text-sm text-ink-3" aria-hidden="true">
        €
      </span>
    </div>
  )
}

function RecapRow({
  label,
  total,
  revenue,
  targetPct,
}: {
  label: string
  total: number
  revenue: number
  targetPct: number
}) {
  const pct = revenue > 0 ? (total / revenue) * 100 : null

  // Écart à l'objectif : ±5% → vert, ±5-15% → ambre (vigilance), >15% → rouge.
  let pctClass = 'text-ink-3'
  if (pct !== null) {
    const diff = Math.abs(pct - targetPct)
    pctClass = diff <= 5 ? 'text-up' : diff <= 15 ? 'text-warn' : 'text-down'
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-ink">{label}</p>
        <p className="text-xs text-ink-3">Objectif {targetPct} %</p>
      </div>
      <div className="text-right">
        <p className="tabular text-sm font-medium text-ink">
          {formatEuros(total)}
        </p>
        <p className={cn('tabular text-xs font-medium', pctClass)}>
          {pct !== null ? `${Math.round(pct)} %` : '—'}
        </p>
      </div>
    </div>
  )
}
