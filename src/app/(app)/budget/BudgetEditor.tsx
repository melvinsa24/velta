'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CopyPlus } from 'lucide-react'
import { Button, Card, Modal } from '@/components/ui'
import { cn } from '@/lib/cn'
import { PARENT_ORDER, PARENT_LABELS } from '@/lib/categoryMeta'
import { CategoryForm } from '@/components/category/CategoryForm'
import { upsertBudget, copyPreviousMonth } from './actions'
import type { Category, CategoryType, ParentType } from '@/types/database'

type Targets = { needs: number; wants: number; savings: number }

type Props = {
  month: string
  categories: Category[]
  /** Map { category_id: planned_amount } du mois courant. */
  budgets: Record<string, number>
  revenue: number
  targets: Targets
  canCopyPrevious: boolean
}

/* Type pré-sélectionné à la création d'une catégorie depuis chaque section. */
const DEFAULT_TYPE: Record<ParentType, CategoryType> = {
  besoin: 'besoins_fixes',
  envie: 'envies_autres',
  epargne: 'epargne',
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

export function BudgetEditor({
  month,
  categories,
  budgets,
  revenue,
  targets,
  canCopyPrevious,
}: Props) {
  const router = useRouter()

  // Montants éditables (chaîne pour piloter l'input). Initialisés depuis la base.
  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const c of categories) init[c.id] = (budgets[c.id] ?? 0).toString()
    return init
  })

  const [modal, setModal] = useState<{ open: boolean; type: CategoryType }>({
    open: false,
    type: 'besoins_fixes',
  })
  const [copying, startCopy] = useTransition()

  // Un timer de debounce par catégorie (sauvegarde au repos de la frappe).
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  function save(categoryId: string, value: string) {
    void upsertBudget(month, categoryId, parseAmount(value))
  }

  function handleChange(categoryId: string, raw: string) {
    setAmounts((prev) => ({ ...prev, [categoryId]: raw }))
    clearTimeout(timers.current[categoryId])
    timers.current[categoryId] = setTimeout(() => save(categoryId, raw), 500)
  }

  function handleBlur(categoryId: string, value: string) {
    clearTimeout(timers.current[categoryId])
    save(categoryId, value)
  }

  function openAdd(parent: ParentType) {
    setModal({ open: true, type: DEFAULT_TYPE[parent] })
  }

  function handleCopy() {
    startCopy(async () => {
      const res = await copyPreviousMonth(month)
      if (res.error) return
      setAmounts((prev) => {
        const next = { ...prev }
        for (const [id, amount] of Object.entries(res.amounts)) {
          next[id] = amount.toString()
        }
        return next
      })
    })
  }

  const parentTotal = (parent: ParentType) =>
    categories
      .filter((c) => c.parent_type === parent)
      .reduce((sum, c) => sum + parseAmount(amounts[c.id] ?? '0'), 0)

  const totals = {
    besoin: parentTotal('besoin'),
    envie: parentTotal('envie'),
    epargne: parentTotal('epargne'),
  }
  const grandTotal = totals.besoin + totals.envie + totals.epargne

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
        const items = categories.filter((c) => c.parent_type === parent)
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

            <Card className="p-0">
              {items.length === 0 && (
                <p className="px-[18px] py-3 text-sm text-ink-3">
                  Aucune catégorie dans cette section.
                </p>
              )}

              {items.map((category, index) => (
                <div
                  key={category.id}
                  className={cn(
                    'flex items-center gap-3 px-[18px] py-2.5',
                    index < items.length - 1 && 'border-b border-border',
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-card"
                    style={{ backgroundColor: category.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {category.name}
                  </span>
                  <input
                    inputMode="decimal"
                    value={amounts[category.id] ?? '0'}
                    onChange={(e) => handleChange(category.id, e.target.value)}
                    onBlur={(e) => handleBlur(category.id, e.target.value)}
                    aria-label={`Montant prévu ${category.name}`}
                    className={cn(
                      'tabular h-11 w-24 rounded-card border border-border bg-surface',
                      'px-3 text-right text-base text-ink outline-none',
                      'transition-colors focus:border-ink',
                    )}
                  />
                  <span className="w-3 text-sm text-ink-3" aria-hidden="true">
                    €
                  </span>
                </div>
              ))}

              {/* Création de catégorie à la volée */}
              <button
                type="button"
                onClick={() => openAdd(parent)}
                className={cn(
                  'flex min-h-11 w-full items-center gap-2 px-[18px] py-3 text-sm text-ink-2',
                  'border-t border-border hover:bg-surface-2',
                )}
              >
                <Plus size={18} aria-hidden="true" />
                Ajouter une catégorie
              </button>
            </Card>
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

      {/* Modale de création de catégorie (même formulaire que Réglages) */}
      <Modal
        open={modal.open}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        title="Nouvelle catégorie"
      >
        <CategoryForm
          key={modal.type}
          initial={null}
          defaultType={modal.type}
          onDone={() => {
            setModal((m) => ({ ...m, open: false }))
            router.refresh()
          }}
        />
      </Modal>
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
          {`${total.toLocaleString('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })} €`}
        </p>
        <p className={cn('tabular text-xs font-medium', pctClass)}>
          {pct !== null ? `${Math.round(pct)} %` : '—'}
        </p>
      </div>
    </div>
  )
}
