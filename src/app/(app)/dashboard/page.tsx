import Link from 'next/link'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { ClosedMonthBanner } from '@/components/layout/ClosedMonthBanner'
import { Card } from '@/components/ui'
import { cn } from '@/lib/cn'
import { createClient } from '@/lib/supabase/server'
import { formatMonthLabel } from '@/lib/month'
import { getMonthContext } from '@/lib/data/activeMonth'
import { getCreditsInProgress, type CreditRow } from '@/lib/data/credits'
import { getUnplannedDetail } from '@/lib/data/unplanned'
import { getMonthExpenseOptions } from '@/lib/data/expenseOptions'
import { realTotalsByParent, revenusReelsMelvin } from '@/lib/calculs'
import { MonthRolloverBanner } from './MonthRolloverBanner'
import { UnplannedSection } from './UnplannedSection'
import {
  CATEGORY_PARENT,
  PARENT_LABELS,
  PARENT_ORDER,
} from '@/lib/categoryMeta'
import type {
  CategoryType,
  MonthlySettings,
  ParentType,
} from '@/types/database'
import { MonthNote } from './MonthNote'
import { ExpenseLineCard } from './ExpenseLineCard'
import type { ExpenseTx } from '@/components/expense/ExpenseQuickEntrySheet'

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

/* Transaction allégée pour les agrégats du Dashboard. Les colonnes id / date /
 * description ne servent pas aux agrégats mais alimentent la liste de la saisie
 * rapide (ExpenseQuickEntrySheet) : même requête, 3 colonnes de plus. */
type TxRow = ExpenseTx

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
  // Mois actif (plus grand mois in_progress, sinon calendaire) : l'app continue
  // d'afficher ce mois tant qu'on n'a pas basculé, même si le calendrier a changé.
  const { activeMonth: month, activeStatus, isBehind, nextMonth } =
    await getMonthContext()
  const supabase = await createClient()
  // Mois actif clôturé → lecture seule (seul champ éditable du dashboard : la note).
  const readOnly = activeStatus === 'closed'

  const [settingsRes, txRes, budgetsRes, credits, unplanned, expenseOptions] =
    await Promise.all([
      supabase
        .from('monthly_settings')
        .select('*')
        .eq('month', month)
        .maybeSingle(),
      // Tri identique à l'Historique : la saisie rapide affiche les transactions
      // d'une dépense de la plus récente à la plus ancienne.
      supabase
        .from('transactions')
        .select('id, date, amount, expense_id, category, description')
        .eq('month', month)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      // !inner + filtre archived=false : exclut les lignes dont la dépense est
      // archivée (SPECS §7.3/§9.7) ; sans !inner, PostgREST garderait la ligne
      // avec expenses=null au lieu de l'exclure.
      supabase
        .from('monthly_budgets')
        .select('planned_amount, expense_id, expenses!inner(label, color, category)')
        .eq('month', month)
        .eq('expenses.archived', false),
      // Crédits en cours (is_credit + non archivés), mensualité = montant du mois actif.
      getCreditsInProgress(month),
      // Dépenses imprévues détaillées (filtre strict expense_id IS NULL côté requête).
      getUnplannedDetail(month),
      // Dépenses du mois : uniquement pour la vue édition de la saisie rapide
      // (le FAB reçoit les siennes du layout, qu'on ne peut pas relayer ici).
      getMonthExpenseOptions(month),
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

  // --- Bloc dépenses : réel par dépense (Σ transactions reliées) + le détail
  // de ces transactions, passé à la saisie rapide de chaque ligne.
  const realByExpense = new Map<string, number>()
  const txByExpense = new Map<string, TxRow[]>()
  for (const t of transactions) {
    if (!t.expense_id) continue
    realByExpense.set(
      t.expense_id,
      (realByExpense.get(t.expense_id) ?? 0) + t.amount,
    )
    const list = txByExpense.get(t.expense_id)
    if (list) list.push(t)
    else txByExpense.set(t.expense_id, [t])
  }

  // Bloc « Dépenses imprévues » : détail fourni par getUnplannedDetail (filtre
  // strict expense_id IS NULL côté requête) → rendu par <UnplannedSection>.

  const hasRevenue = revenusReels > 0

  return (
    <>
      <ScreenHeader title={formatMonthLabel(month)} />

      <div className="flex flex-col gap-6">
        {readOnly && <ClosedMonthBanner />}

        {/* Bannière de bascule : le mois actif est en retard sur le calendrier. */}
        {isBehind && (
          <MonthRolloverBanner
            activeMonth={month}
            activeLabel={formatMonthLabel(month)}
            nextLabel={formatMonthLabel(nextMonth)}
          />
        )}

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
                      <ExpenseLineCard
                        key={line.expense_id}
                        expense={{
                          id: line.expense_id,
                          label: line.expenses!.label,
                          color: line.expenses!.color,
                          category: line.expenses!.category,
                        }}
                        // Pour une dépense au prorata, `planned_amount` porte
                        // déjà la part nette (snapshot écrit depuis Flore).
                        planned={line.planned_amount}
                        real={realByExpense.get(line.expense_id) ?? 0}
                        month={month}
                        transactions={txByExpense.get(line.expense_id) ?? []}
                        expenseOptions={expenseOptions}
                        readOnly={readOnly}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          )}

          {/* Dépenses imprévues — détail au tap (transactions sans dépense prévue). */}
          <UnplannedSection categories={unplanned} />
        </section>

        {/* Crédits en cours (SPECS §7.1). */}
        {credits.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold tracking-tight text-ink">
              Crédits en cours
            </h2>
            <Card className="flex flex-col gap-3">
              {credits.map((credit) => (
                <CreditLine key={credit.id} credit={credit} />
              ))}
            </Card>
          </section>
        )}

        {/* Note du mois (sauvegarde auto débouncée). */}
        <MonthNote
          month={month}
          initialNote={settings?.note ?? ''}
          readOnly={readOnly}
        />
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

/* Ligne d'un crédit en cours : pastille couleur, libellé + reste (mois / capital),
 * mensualité du mois actif à droite. Capital / mois affichent « — » si non saisis. */
function CreditLine({ credit }: { credit: CreditRow }) {
  const { label, color, monthly, remainingMonths, totalRemaining } = credit
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-card"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">{label}</p>
        <p className="tabular text-xs text-ink-3">
          {remainingMonths ?? '—'} mois restants · capital{' '}
          {totalRemaining != null ? formatEuros(totalRemaining) : '—'}
        </p>
      </div>
      <span className="tabular shrink-0 text-sm font-medium text-ink">
        {formatEuros(monthly)}
        <span className="text-ink-3">/mois</span>
      </span>
    </div>
  )
}
