'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CopyPlus, Trash2 } from 'lucide-react'
import { Button, Card, Modal } from '@/components/ui'
import { cn } from '@/lib/cn'
import { PARENT_ORDER, PARENT_LABELS } from '@/lib/categoryMeta'
import { CategoryForm } from '@/components/category/CategoryForm'
import {
  createBudgetLine,
  updateBudgetLine,
  deleteBudgetLine,
  copyPreviousMonth,
  type BudgetLine,
} from './actions'
import type { Category, CategoryType, ParentType } from '@/types/database'

type Targets = { needs: number; wants: number; savings: number }

type Props = {
  month: string
  categories: Category[]
  /** Dépenses nommées du mois (une ligne = une dépense rattachée à une catégorie). */
  lines: BudgetLine[]
  revenue: number
  targets: Targets
  canCopyPrevious: boolean
}

/* Ligne éditable côté client : label et montant en chaîne pour piloter les inputs. */
type EditableLine = {
  id: string
  categoryId: string
  label: string
  amount: string
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

function toEditable(line: BudgetLine): EditableLine {
  return {
    id: line.id,
    categoryId: line.category_id,
    label: line.label ?? '',
    amount: (line.planned_amount ?? 0).toString(),
  }
}

export function BudgetEditor({
  month,
  categories,
  lines: initialLines,
  revenue,
  targets,
  canCopyPrevious,
}: Props) {
  const router = useRouter()

  const [lines, setLines] = useState<EditableLine[]>(() =>
    initialLines.map(toEditable),
  )

  const [modal, setModal] = useState<{ open: boolean; type: CategoryType }>({
    open: false,
    type: 'besoins_fixes',
  })
  const [copying, startCopy] = useTransition()

  // Timers de debounce, clés par `${lineId}:label` / `${lineId}:amount`
  // (champs indépendants → un timer chacun pour ne pas s'annuler mutuellement).
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  function schedule(key: string, fn: () => void) {
    clearTimeout(timers.current[key])
    timers.current[key] = setTimeout(fn, 500)
  }

  function handleLabelChange(id: string, value: string) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, label: value } : l)),
    )
    schedule(`${id}:label`, () => {
      void updateBudgetLine(id, { label: value.trim() })
    })
  }

  function handleLabelBlur(id: string, value: string) {
    clearTimeout(timers.current[`${id}:label`])
    void updateBudgetLine(id, { label: value.trim() })
  }

  function handleAmountChange(id: string, value: string) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, amount: value } : l)),
    )
    schedule(`${id}:amount`, () => {
      void updateBudgetLine(id, { planned_amount: parseAmount(value) })
    })
  }

  function handleAmountBlur(id: string, value: string) {
    clearTimeout(timers.current[`${id}:amount`])
    void updateBudgetLine(id, { planned_amount: parseAmount(value) })
  }

  async function handleAdd(categoryId: string) {
    const res = await createBudgetLine(month, categoryId)
    if (res.error || !res.line) return
    setLines((prev) => [...prev, toEditable(res.line!)])
  }

  function handleDelete(id: string) {
    clearTimeout(timers.current[`${id}:label`])
    clearTimeout(timers.current[`${id}:amount`])
    setLines((prev) => prev.filter((l) => l.id !== id)) // optimiste
    void deleteBudgetLine(id)
  }

  function openAddCategory(parent: ParentType) {
    setModal({ open: true, type: DEFAULT_TYPE[parent] })
  }

  function handleCopy() {
    startCopy(async () => {
      const res = await copyPreviousMonth(month)
      if (res.error) return
      setLines(res.lines.map(toEditable))
    })
  }

  // Index { category_id -> Category } pour retrouver le parent_type d'une ligne.
  const catById = new Map(categories.map((c) => [c.id, c]))

  const linesOf = (categoryId: string) =>
    lines.filter((l) => l.categoryId === categoryId)

  const parentTotal = (parent: ParentType) =>
    lines.reduce((sum, l) => {
      const cat = catById.get(l.categoryId)
      return cat?.parent_type === parent ? sum + parseAmount(l.amount) : sum
    }, 0)

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
          {copying ? 'Reprise…' : 'Reprendre les dépenses du mois précédent'}
        </Button>
      )}

      {PARENT_ORDER.map((parent) => {
        const cats = categories.filter((c) => c.parent_type === parent)
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
              {cats.length === 0 && (
                <Card className="py-3">
                  <p className="text-sm text-ink-3">
                    Aucune catégorie dans cette section.
                  </p>
                </Card>
              )}

              {cats.map((category) => {
                const items = linesOf(category.id)
                return (
                  <Card key={category.id} className="p-0">
                    {/* En-tête de catégorie */}
                    <div className="flex items-center gap-3 px-[18px] py-2.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-card"
                        style={{ backgroundColor: category.color }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight text-ink">
                        {category.name}
                      </span>
                    </div>

                    {/* Dépenses nommées de la catégorie */}
                    {items.map((line) => (
                      <div
                        key={line.id}
                        className="flex items-center gap-2 border-t border-border px-[18px] py-2"
                      >
                        <input
                          value={line.label}
                          placeholder="Nom de la dépense"
                          onChange={(e) =>
                            handleLabelChange(line.id, e.target.value)
                          }
                          onBlur={(e) => handleLabelBlur(line.id, e.target.value)}
                          aria-label="Nom de la dépense"
                          className={cn(
                            'h-11 min-w-0 flex-1 rounded-card border border-transparent bg-transparent',
                            'px-2 text-sm text-ink outline-none placeholder:text-ink-3',
                            'transition-colors focus:border-border-2 focus:bg-surface-2',
                          )}
                        />
                        <input
                          inputMode="decimal"
                          value={line.amount}
                          onChange={(e) =>
                            handleAmountChange(line.id, e.target.value)
                          }
                          onBlur={(e) =>
                            handleAmountBlur(line.id, e.target.value)
                          }
                          aria-label={`Montant prévu ${line.label || 'dépense'}`}
                          className={cn(
                            'tabular h-11 w-20 rounded-card border border-border bg-surface',
                            'px-2 text-right text-base text-ink outline-none',
                            'transition-colors focus:border-ink',
                          )}
                        />
                        <span
                          className="w-3 text-sm text-ink-3"
                          aria-hidden="true"
                        >
                          €
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(line.id)}
                          aria-label={`Supprimer ${line.label || 'cette dépense'}`}
                          className="grid h-11 w-8 shrink-0 place-items-center text-ink-3 transition-colors hover:text-down"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    ))}

                    {/* Ajout d'une dépense nommée à cette catégorie */}
                    <button
                      type="button"
                      onClick={() => handleAdd(category.id)}
                      className={cn(
                        'flex min-h-11 w-full items-center gap-2 px-[18px] py-2.5 text-sm text-ink-2',
                        'border-t border-border hover:bg-surface-2',
                      )}
                    >
                      <Plus size={16} aria-hidden="true" />
                      Ajouter une dépense
                    </button>
                  </Card>
                )
              })}

              {/* Création d'une nouvelle catégorie (à la volée) */}
              <button
                type="button"
                onClick={() => openAddCategory(parent)}
                className={cn(
                  'flex min-h-11 w-full items-center justify-center gap-2 rounded-card',
                  'border border-dashed border-border-2 py-2.5 text-sm text-ink-2',
                  'hover:bg-surface-2',
                )}
              >
                <Plus size={16} aria-hidden="true" />
                Nouvelle catégorie
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
