import Link from 'next/link'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Card } from '@/components/ui'
import { cn } from '@/lib/cn'
import { createClient } from '@/lib/supabase/server'
import { currentMonthStart, formatMonthLabel } from '@/lib/month'
import { realTotalsByParent, revenusReelsMelvin } from '@/lib/calculs'
import {
  CATEGORY_PARENT,
  CATEGORY_TYPE_LABELS,
  PARENT_LABELS,
  PARENT_ORDER,
} from '@/lib/categoryMeta'
import type {
  CategoryType,
  MonthlySettings,
  ParentType,
} from '@/types/database'
import { MonthNote } from './MonthNote'

/*
 * Dashboard du mois (SPECS §6, §7.1, §9). Server Component : charge les réglages
 * du mois, toutes ses transactions et toutes ses lignes de budget (jointes à la
 * dépense). Tous les agrégats (reste à dépenser, ratios, réel par dépense) sont
 * calculés à la volée — aucune valeur dérivée n'est stockée (SPECS §9.1). Le mois
 * est fixé au mois en cours (sélecteur de mois reporté en Phase 9).
 *
 * `revenue_melvin_réel` n'est jamais recalculé inline : toujours via
 * `revenusReelsMelvin` (src/lib/calculs.ts).
 */

/* Transaction allégée pour les agrégats du Dashboard. */
type TxRow = {
  amount: number
  expense_id: string | null
  category: CategoryType
}

/* Ligne de budget jointe à sa dépense (libellé / couleur / catégorie). */
type BudgetRow = {
  planned_amount: number
  expense_id: string
  expenses: { label: string; color: string; category: CategoryType } | null
}

function formatEuros(n: number): string {
  return `${n.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} €`
}

export default async function DashboardPage() {
  const month = currentMonthStart()
  const supabase = await createClient()

  const [settingsRes, txRes, budgetsRes] = await Promise.all([
    supabase.from('monthly_settings').select('*').eq('month', month).maybeSingle(),
    supabase
      .from('transactions')
      .select('amount, expense_id, category')
      .eq('month', month),
    supabase
      .from('monthly_budgets')
      .select('planned_amount, expense_id, expenses(label, color, category)')
      .eq('month', month),
  ])

  const settings = settingsRes.data as MonthlySettings | null
  const transactions = (txRes.data as TxRow[] | null) ?? []
  const budgets = (budgetsRes.data as BudgetRow[] | null) ?? []

  // Revenu réel de Melvin (jamais stocké) — base de la carte héro et des jauges.
  const revenusReels = revenusReelsMelvin({
    apl: settings?.apl ?? null,
    revenue_salaire: settings?.revenue_salaire ?? 0,
    revenue_autres: settings?.revenue_autres ?? 0,
    revenue_flore: settings?.revenue_flore ?? 0,
  })

  const targets: Record<ParentType, number> = {
    besoin: settings?.target_needs_pct ?? 50,
    envie: settings?.target_wants_pct ?? 30,
    epargne: settings?.target_savings_pct ?? 20,
  }

  // --- Carte héro : reste à dépenser réel + reste après charges fixes prévues.
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0)
  const resteReel = revenusReels - totalSpent

  // Dépenses ayant déjà au moins une transaction ce mois-ci.
  const coveredExpenseIds = new Set(
    transactions.filter((t) => t.expense_id).map((t) => t.expense_id),
  )
  // Charges fixes prévues NON encore couvertes par une transaction (SPECS §9.5).
  const fixedNotCovered = budgets
    .filter(
      (b) =>
        b.expenses?.category === 'besoins_fixes' &&
        !coveredExpenseIds.has(b.expense_id),
    )
    .reduce((sum, b) => sum + b.planned_amount, 0)
  const resteApresFixes = resteReel - fixedNotCovered

  // --- Jauges : réel par type (base = revenu réel).
  const realByParent = realTotalsByParent(transactions)

  // --- Bloc dépenses : réel par dépense (Σ transactions reliées).
  const realByExpense = new Map<string, number>()
  for (const t of transactions) {
    if (!t.expense_id) continue
    realByExpense.set(
      t.expense_id,
      (realByExpense.get(t.expense_id) ?? 0) + t.amount,
    )
  }

  // --- Bloc imprévues : transactions sans dépense, regroupées par catégorie.
  const unplannedByCategory = new Map<CategoryType, number>()
  for (const t of transactions) {
    if (t.expense_id) continue
    unplannedByCategory.set(
      t.category,
      (unplannedByCategory.get(t.category) ?? 0) + t.amount,
    )
  }
  const unplannedTotal = [...unplannedByCategory.values()].reduce(
    (sum, v) => sum + v,
    0,
  )

  const hasRevenue = revenusReels > 0

  return (
    <>
      <ScreenHeader title={formatMonthLabel(month)} />

      <div className="flex flex-col gap-6">
        {/* Carte héro — fond --ink (SPECS §7.1 / design system). */}
        <div className="rounded-card bg-card-ink p-[18px] shadow-hero">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-white/45 uppercase">
            Reste à dépenser
          </p>
          {hasRevenue ? (
            <>
              <p className="tabular mt-2 text-[40px] leading-[44px] font-bold tracking-[-0.035em] text-white">
                {formatEuros(resteReel)}
              </p>
              <p className="mt-1.5 text-sm text-white/55">
                Après charges fixes : {formatEuros(resteApresFixes)}
              </p>
            </>
          ) : (
            <>
              <p className="tabular mt-2 text-[40px] leading-[44px] font-bold text-white">
                —
              </p>
              <Link
                href="/historique"
                className="mt-1.5 inline-block text-sm text-white/55 underline-offset-2 hover:underline"
              >
                Renseigne tes revenus dans Historique
              </Link>
            </>
          )}
        </div>

        {/* Jauges besoins / envies / épargne (base = revenu réel). */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold tracking-tight text-ink">
            Répartition
          </h2>
          {hasRevenue ? (
            <Card className="flex flex-col gap-4">
              {PARENT_ORDER.map((parent) => (
                <RatioGauge
                  key={parent}
                  label={PARENT_LABELS[parent]}
                  real={realByParent[parent]}
                  base={revenusReels}
                  targetPct={targets[parent]}
                />
              ))}
            </Card>
          ) : (
            <Card className="py-4">
              <p className="text-sm text-ink-3">Revenus non renseignés.</p>
            </Card>
          )}
        </section>

        {/* Dépenses du mois, groupées par type. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold tracking-tight text-ink">
            Dépenses du mois
          </h2>
          {budgets.length === 0 ? (
            <Card className="py-4">
              <p className="text-sm text-ink-3">
                Aucune dépense prévue ce mois-ci.
              </p>
            </Card>
          ) : (
            PARENT_ORDER.map((parent) => {
              const lines = budgets.filter(
                (b) =>
                  b.expenses && CATEGORY_PARENT[b.expenses.category] === parent,
              )
              if (lines.length === 0) return null
              return (
                <div key={parent} className="flex flex-col gap-1.5">
                  <p className="px-1 text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
                    {PARENT_LABELS[parent]}
                  </p>
                  <div className="flex flex-col gap-2">
                    {lines.map((line) => (
                      <ExpenseLine
                        key={line.expense_id}
                        label={line.expenses!.label}
                        color={line.expenses!.color}
                        planned={line.planned_amount}
                        real={realByExpense.get(line.expense_id) ?? 0}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          )}

          {/* Dépenses imprévues — transactions sans dépense prévue. */}
          {unplannedByCategory.size > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
                  Dépenses imprévues
                </p>
                <span className="tabular text-sm font-medium text-ink-2">
                  {formatEuros(unplannedTotal)}
                </span>
              </div>
              <Card className="flex flex-col gap-2.5">
                {[...unplannedByCategory.entries()].map(([category, amount]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-ink">
                      {CATEGORY_TYPE_LABELS[category]}
                    </span>
                    <span className="tabular text-sm font-medium text-ink">
                      {formatEuros(amount)}
                    </span>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </section>

        {/* Note du mois (sauvegarde auto débouncée). */}
        <MonthNote month={month} initialNote={settings?.note ?? ''} />
      </div>
    </>
  )
}

/* Jauge horizontale d'un type : piste --surface-2, remplissage lime. Le % est
 * coloré selon l'écart à l'objectif (vert ±5 %, ambre 5-15 %, rouge >15 %). */
function RatioGauge({
  label,
  real,
  base,
  targetPct,
}: {
  label: string
  real: number
  base: number
  targetPct: number
}) {
  const pct = base > 0 ? (real / base) * 100 : 0
  const diff = Math.abs(pct - targetPct)
  const pctClass = diff <= 5 ? 'text-up' : diff <= 15 ? 'text-warn' : 'text-down'
  const width = Math.max(0, Math.min(100, pct))

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink">{label}</span>
        <span className="flex items-baseline gap-2">
          <span className="text-xs text-ink-3">Objectif {targetPct} %</span>
          <span className={cn('tabular text-sm font-medium', pctClass)}>
            {Math.round(pct)} %
          </span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

/* Ligne d'une dépense prévue : pastille couleur, libellé + prévu, réel,
 * mini-jauge --ink (proportion réel/prévu). Bordure --down + message si
 * dépassement ; jauge --warn dès 80 % du prévu (SPECS §7.1). */
function ExpenseLine({
  label,
  color,
  planned,
  real,
}: {
  label: string
  color: string
  planned: number
  real: number
}) {
  const ratio = planned > 0 ? real / planned : real > 0 ? 1 : 0
  const width = Math.max(0, Math.min(100, ratio * 100))
  const over = real > planned && planned > 0
  const warn = ratio >= 0.8
  const barTone = warn ? 'bg-warn' : 'bg-ink'

  return (
    <div
      className={cn(
        'rounded-card border bg-surface p-[14px] shadow-card',
        over ? 'border-down' : 'border-border',
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-card"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-sm text-ink">{label}</span>
        <span className="tabular shrink-0 text-sm text-ink">
          <span className="font-medium">{formatEuros(real)}</span>
          <span className="text-ink-3"> / {formatEuros(planned)}</span>
        </span>
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
    </div>
  )
}
