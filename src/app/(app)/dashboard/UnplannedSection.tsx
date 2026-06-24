'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Card, Modal } from '@/components/ui'
import { CATEGORY_TYPE_LABELS } from '@/lib/categoryMeta'
import { formatDayLabel } from '@/lib/month'
import type { UnplannedCategory } from '@/lib/data/unplanned'

/*
 * Bloc « Dépenses imprévues » du Dashboard (SPECS §7.1). Liste les transactions
 * sans dépense prévue, regroupées par catégorie avec total. Le tap sur une
 * catégorie ouvre une modale détaillant ses transactions (date, description,
 * montant). Données fournies par getUnplannedDetail (filtre strict expense_id null).
 */
function formatEuros(n: number): string {
  return `${n.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} €`
}

export function UnplannedSection({
  categories,
}: {
  categories: UnplannedCategory[]
}) {
  const [selected, setSelected] = useState<UnplannedCategory | null>(null)

  if (categories.length === 0) return null

  const total = categories.reduce((sum, c) => sum + c.total, 0)

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
          Dépenses imprévues
        </p>
        <span className="tabular text-sm font-medium text-ink-2">
          {formatEuros(total)}
        </span>
      </div>

      <Card className="flex flex-col p-0">
        {categories.map((entry, index) => (
          <button
            key={entry.category}
            type="button"
            onClick={() => setSelected(entry)}
            aria-label={`Détail ${CATEGORY_TYPE_LABELS[entry.category]}`}
            className={cnRow(index === 0)}
          >
            <span className="text-sm text-ink">
              {CATEGORY_TYPE_LABELS[entry.category]}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="tabular text-sm font-medium text-ink">
                {formatEuros(entry.total)}
              </span>
              <ChevronRight size={16} className="text-ink-3" aria-hidden="true" />
            </span>
          </button>
        ))}
      </Card>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? CATEGORY_TYPE_LABELS[selected.category] : undefined}
      >
        <div className="flex flex-col gap-2.5">
          {selected?.items.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between gap-3 border-b border-border pb-2.5 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">
                  {tx.description ?? 'Sans description'}
                </p>
                <p className="text-xs text-ink-3">{formatDayLabel(tx.date)}</p>
              </div>
              <span className="tabular shrink-0 text-sm font-medium text-ink">
                {formatEuros(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

/* Ligne tappable : cible tactile ≥ 44px, séparateur sauf la première. */
function cnRow(isFirst: boolean): string {
  return [
    'flex min-h-11 items-center justify-between gap-3 px-[14px] py-2.5 text-left',
    'hover:bg-surface-2',
    isFirst ? '' : 'border-t border-border',
  ].join(' ')
}
