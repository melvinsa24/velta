import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { MonthSelector } from '@/components/layout/MonthSelector'
import { ClosedMonthBanner } from '@/components/layout/ClosedMonthBanner'
import { Card } from '@/components/ui'
import { createClient } from '@/lib/supabase/server'
import { getMonthContext } from '@/lib/data/activeMonth'
import { floreRatio, floreShare } from '@/lib/calculs'
import { FloreInputs } from './FloreInputs'
import { FloreProrataExpenses } from './FloreProrataExpenses'
import { FlorePayments } from './FlorePayments'
import type { FlorePayment, MonthlySettings, ShareMode } from '@/types/database'

/*
 * Module Flore — saisie et calculs (SPECS §7.6, brief Phase 10a). Server
 * Component : charge les réglages du mois et les dépenses partagées
 * (`share_mode` ∈ {split_50_50, split_prorata}), puis calcule à la volée le
 * ratio de répartition et chaque part — aucune valeur dérivée n'est stockée
 * (SPECS §9.1).
 *
 * Mois affiché : `?month=YYYY-MM-01` s'il est fourni, sinon le mois actif (même
 * référence que le Dashboard). Si Flore n'a aucun revenu, tout bascule en 100 %
 * perso (SPECS §9.3) : seules la saisie et la bannière s'affichent.
 */

/* Ligne de budget partagée, jointe à sa dépense. */
type SharedBudgetRow = {
  planned_amount: number
  expense_id: string
  expenses: { label: string; color: string; share_mode: ShareMode } | null
}

const SHARE_BADGE: Record<Extract<ShareMode, 'split_50_50' | 'split_prorata'>, string> = {
  split_50_50: '50/50',
  split_prorata: 'prorata',
}

function formatEuros(n: number): string {
  return `${n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`
}

function formatPct(ratio: number): string {
  return `${(ratio * 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} %`
}

export default async function FlorePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: monthParam } = await searchParams
  const { activeMonth, calendarMonth } = await getMonthContext()
  // Mois actif par défaut ; l'URL fait foi dès qu'un mois est choisi.
  const month =
    monthParam && /^\d{4}-\d{2}-01$/.test(monthParam) ? monthParam : activeMonth

  const supabase = await createClient()

  const [settingsRes, budgetsRes, prorataRes, paymentsRes] = await Promise.all([
    supabase.from('monthly_settings').select('*').eq('month', month).maybeSingle(),
    // Charges 50/50 non archivées du mois. !inner + filtres sur la jointure :
    // PostgREST exclut bien les lignes hors critères (sinon expenses=null gardé).
    // Les prorata sont désormais gérées dans leur propre section (brief 10c).
    supabase
      .from('monthly_budgets')
      .select('planned_amount, expense_id, expenses!inner(label, color, share_mode)')
      .eq('month', month)
      .eq('expenses.archived', false)
      .eq('expenses.share_mode', 'split_50_50'),
    // Dépenses au prorata (entités durables) : le total est porté par la dépense.
    supabase
      .from('expenses')
      .select('id, label, prorata_total_amount')
      .eq('share_mode', 'split_prorata')
      .eq('archived', false)
      .order('created_at'),
    // Remboursements du mois (module isolé, SPECS §9.2), triés du plus récent.
    supabase
      .from('flore_payments')
      .select('*')
      .eq('month', month)
      .order('date', { ascending: false }),
  ])

  const settings = settingsRes.data as MonthlySettings | null
  const budgets = (budgetsRes.data as SharedBudgetRow[] | null) ?? []
  const prorataExpenses =
    (prorataRes.data as {
      id: string
      label: string
      prorata_total_amount: number | null
    }[] | null) ?? []
  const payments = (paymentsRes.data as FlorePayment[] | null) ?? []

  const revenueFlore = settings?.revenue_flore ?? 0
  const apl = settings?.apl ?? null
  const hasFlore = revenueFlore > 0
  // Mois clôturé → lecture seule (statut du mois AFFICHÉ, pas du mois actif).
  const readOnly = settings?.status === 'closed'

  const ratio = floreRatio({
    apl,
    revenue_salaire: settings?.revenue_salaire ?? 0,
    revenue_autres: settings?.revenue_autres ?? 0,
    revenue_flore: revenueFlore,
  })

  // Charges 50/50 : part de Flore = moitié du montant prévu.
  const lines = budgets
    .filter((b) => b.expenses)
    .map((b) => {
      const part = floreShare(b.planned_amount, b.expenses!.share_mode, ratio.ratioFlore)
      return {
        expenseId: b.expense_id,
        label: b.expenses!.label,
        color: b.expenses!.color,
        shareMode: b.expenses!.share_mode as 'split_50_50' | 'split_prorata',
        planned: b.planned_amount,
        floreShare: part,
        melvinShare: b.planned_amount - part,
      }
    })

  // Charges au prorata : base = total porté par la dépense (et non planned_amount,
  // qui ne stocke que la part nette). Part de Flore = total × ratioFlore.
  const prorataLines = prorataExpenses.map((e) => {
    const total = e.prorata_total_amount ?? 0
    const flore = total * ratio.ratioFlore
    return {
      id: e.id,
      label: e.label,
      total: e.prorata_total_amount, // null = total non renseigné (legacy)
      floreShare: flore,
      melvinShare: total - flore,
    }
  })

  const totalCharges =
    lines.reduce((sum, l) => sum + l.floreShare, 0) +
    prorataLines.reduce((sum, l) => sum + l.floreShare, 0)
  const aplFlore = (apl ?? 0) * ratio.ratioFlore
  const totalDue = totalCharges - aplFlore

  // Solde restant réel = dette théorique − remboursements du mois (10b-fix).
  // `totalDue` reste la référence des charges ; seul l'affichage héro change.
  const totalRembourse = payments.reduce((sum, p) => sum + p.amount, 0)
  const soldeRestant = Math.max(0, totalDue - totalRembourse)
  const apure = soldeRestant === 0

  return (
    <>
      <ScreenHeader title="Flore" subtitle="Répartition des charges" />

      <div className="flex flex-col gap-6">
        <MonthSelector month={month} basePath="/flore" maxMonth={calendarMonth} />

        {readOnly && <ClosedMonthBanner />}

        {/* Section 1 — Inputs du mois (sauvegarde au blur). La key force le
            remontage à chaque changement de mois : sans elle, l'état local des
            champs (valeurs saisies) survivrait à la navigation et un blur
            enregistrerait les valeurs du mois précédent sur le nouveau mois.
            Préfixe `inputs-` : les 3 sections keyées sont des frères directs, un
            simple `key={month}` collisionnerait entre elles (React dupliquerait
            les enfants au fil des navigations). */}
        <FloreInputs
          key={`inputs-${month}`}
          month={month}
          apl={apl}
          revenueFlore={revenueFlore}
          readOnly={readOnly}
        />

        {!hasFlore ? (
          <Card className="py-4">
            <p className="text-sm text-ink-2">
              Les revenus de Flore ne sont pas renseignés. Toutes les charges
              partagées sont comptées à 100 % pour toi.
            </p>
          </Card>
        ) : (
          <>
            {/* Section 2 — Ratio de répartition. */}
            <section className="flex flex-col gap-3">
              <h2 className="text-base font-bold tracking-tight text-ink">
                Ratio de répartition
              </h2>
              <div className="flex gap-3">
                <RatioColumn label="Melvin" pct={formatPct(ratio.ratioMelvin)} />
                <RatioColumn label="Flore" pct={formatPct(ratio.ratioFlore)} />
              </div>
            </section>

            {/* Section 3 — Détail des charges partagées. */}
            <section className="flex flex-col gap-3">
              <h2 className="text-base font-bold tracking-tight text-ink">
                Charges partagées
              </h2>
              {lines.length === 0 ? (
                <Card className="py-4">
                  <p className="text-sm text-ink-3">
                    Aucune charge partagée ce mois-ci.
                  </p>
                </Card>
              ) : (
                <Card className="flex flex-col gap-0 p-0">
                  {lines.map((line, i) => (
                    <SharedLine key={line.expenseId} line={line} border={i > 0} />
                  ))}
                  {/* Ligne APL : déduction (part Flore en négatif). */}
                  <AplLine amount={aplFlore} />
                </Card>
              )}
            </section>

            {/* Section 4 — Carte héro : solde restant réel (dette − remboursements). */}
            <div className="rounded-card bg-card-ink p-[18px] shadow-hero">
              <p
                className={`text-[11px] font-semibold tracking-[0.14em] uppercase ${
                  apure ? 'text-up' : 'text-white/45'
                }`}
              >
                {apure ? 'Solde apuré' : 'Flore me doit'}
              </p>
              <p className="tabular mt-2 text-[40px] leading-[44px] font-bold tracking-[-0.035em] text-white">
                {formatEuros(soldeRestant)}
              </p>
              <p className="tabular mt-1.5 text-sm text-white/55">
                Charges {formatEuros(totalCharges)} − APL {formatEuros(aplFlore)}
              </p>
              {totalRembourse > 0 && (
                <p className="tabular mt-0.5 text-sm text-white/55">
                  Dont {formatEuros(totalRembourse)} déjà remboursé
                </p>
              )}
            </div>
          </>
        )}

        {/* Section 5 — Remboursements (toujours visible, module isolé). La key
            (préfixée `payments-`, cf. Section 1) force le reset du formulaire/état
            au changement de mois. */}
        <FlorePayments
          key={`payments-${month}`}
          payments={payments}
          totalDue={totalDue}
          readOnly={readOnly}
        />

        {/* Dépenses au prorata (toujours visible : créées / gérées ici, brief 10c).
            La part nette est recalculée à la volée depuis le total. La key
            (préfixée `prorata-`, cf. Section 1) assure un remontage propre au
            changement de mois. */}
        <FloreProrataExpenses
          key={`prorata-${month}`}
          lines={prorataLines}
          hasFlore={hasFlore}
          readOnly={readOnly}
        />
      </div>
    </>
  )
}

/* Colonne du ratio : libellé + pourcentage. Design sobre (pas de carte héro). */
function RatioColumn({ label, pct }: { label: string; pct: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1 rounded-card border border-border bg-surface px-[18px] py-3">
      <span className="text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
        {label}
      </span>
      <span className="tabular text-xl font-bold text-ink">{pct}</span>
    </div>
  )
}

/* Ligne d'une charge partagée : pastille couleur, libellé + badge mode, total,
 * parts Melvin | Flore. */
function SharedLine({
  line,
  border,
}: {
  line: {
    label: string
    color: string
    shareMode: 'split_50_50' | 'split_prorata'
    planned: number
    floreShare: number
    melvinShare: number
  }
  border: boolean
}) {
  return (
    <div className={`px-[18px] py-3 ${border ? 'border-t border-border' : ''}`}>
      <div className="flex items-center gap-2.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-card"
          style={{ backgroundColor: line.color }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-sm text-ink">
          {line.label}
        </span>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-2">
          {SHARE_BADGE[line.shareMode]}
        </span>
        <span className="tabular shrink-0 text-sm font-medium text-ink">
          {formatEuros(line.planned)}
        </span>
      </div>
      <div className="tabular mt-1.5 flex justify-end gap-4 text-xs text-ink-3">
        <span>Moi {formatEuros(line.melvinShare)}</span>
        <span>Flore {formatEuros(line.floreShare)}</span>
      </div>
    </div>
  )
}

/* Ligne APL en bas de liste : déduction, part Flore affichée en négatif. */
function AplLine({ amount }: { amount: number }) {
  return (
    <div className="flex items-center justify-between border-t border-border px-[18px] py-3">
      <span className="text-sm text-ink-2">APL (déduite)</span>
      <span className="tabular text-sm font-medium text-ink-2">
        −{formatEuros(amount)}
      </span>
    </div>
  )
}
