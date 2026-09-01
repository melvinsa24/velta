'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatEuros } from '@/lib/format'
import {
  ExpenseQuickEntrySheet,
  type ExpenseTx,
  type QuickEntryExpense,
} from '@/components/expense/ExpenseQuickEntrySheet'
import type { ExpenseOption } from '@/components/transaction/TransactionForm'

/*
 * Ligne d'une dépense prévue du Dashboard : pastille couleur, libellé + prévu,
 * réel, mini-jauge --ink (proportion réel/prévu). Bordure --down + message si
 * dépassement ; jauge --warn dès 80 % du prévu (SPECS §7.1).
 *
 * La ligne est tappable et ouvre la saisie rapide (`ExpenseQuickEntrySheet`) —
 * raccourci qui s'ajoute au FAB, lequel reste inchangé. Elle reste tappable sur
 * un mois clôturé : la sheet s'ouvre alors en consultation.
 */
export function ExpenseLineCard({
  expense,
  planned,
  real,
  month,
  transactions,
  expenseOptions,
  readOnly = false,
}: {
  expense: QuickEntryExpense
  /** Montant prévu du mois (part nette déjà figée pour une dépense au prorata). */
  planned: number
  /** Σ des transactions rattachées ce mois-ci. */
  real: number
  month: string
  transactions: ExpenseTx[]
  expenseOptions: ExpenseOption[]
  readOnly?: boolean
}) {
  const [open, setOpen] = useState(false)

  const ratio = planned > 0 ? real / planned : real > 0 ? 1 : 0
  const width = Math.max(0, Math.min(100, ratio * 100))
  const over = real > planned && planned > 0
  const warn = ratio >= 0.8
  const barTone = warn ? 'bg-warn' : 'bg-ink'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={
          readOnly
            ? `Détail ${expense.label}`
            : `Saisir une dépense — ${expense.label}`
        }
        className={cn(
          'w-full rounded-card border bg-surface p-[14px] text-left shadow-card',
          'transition-colors hover:bg-surface-2',
          over ? 'border-down' : 'border-border',
        )}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-card"
            style={{ backgroundColor: expense.color }}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate text-sm text-ink">
            {expense.label}
          </span>
          <span className="tabular shrink-0 text-sm text-ink">
            <span className="font-medium">{formatEuros(real)}</span>
            <span className="text-ink-3"> / {formatEuros(planned)}</span>
          </span>
          <ChevronRight size={16} className="shrink-0 text-ink-3" aria-hidden="true" />
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className={cn('h-full rounded-full', barTone)}
            style={{ width: `${width}%` }}
          />
        </div>
        {over && (
          <p className="tabular mt-1.5 text-xs font-medium text-down">
            ⚠ Dépassé de {formatEuros(real - planned)}
          </p>
        )}
      </button>

      <ExpenseQuickEntrySheet
        open={open}
        onClose={() => setOpen(false)}
        expense={expense}
        month={month}
        planned={planned}
        transactions={transactions}
        expenseOptions={expenseOptions}
        readOnly={readOnly}
      />
    </>
  )
}
