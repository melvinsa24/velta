import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Button, Card } from '@/components/ui'
import { LogoutButton } from '@/app/logout-button'
import { createClient } from '@/lib/supabase/server'
import { formatMonthLabel } from '@/lib/month'
import { getMonthContext } from '@/lib/data/activeMonth'
import { TargetsSection } from './TargetsSection'
import { MonthManagementSection } from './MonthManagementSection'
import type { MonthlySettings } from '@/types/database'

/*
 * Écran Réglages. Server Component : charge les réglages du mois en cours.
 * 3 sections en scroll vertical : Objectifs % · Export CSV (placeholder) · Compte.
 *
 * La gestion des dépenses se fait depuis l'écran Budget (SPECS §7.8) : la
 * section « Catégories » a été retirée au pivot modèle Dépenses (Phase 5bis).
 */
export default async function ReglagesPage() {
  const supabase = await createClient()
  const { activeMonth, activeStatus, isBehind, nextMonth, prevMonth, prevStatus } =
    await getMonthContext()
  const month = activeMonth

  const settingsRes = await supabase
    .from('monthly_settings')
    .select('*')
    .eq('month', month)
    .maybeSingle()

  const settings = (settingsRes.data as MonthlySettings | null) ?? null

  return (
    <>
      <ScreenHeader title="Réglages" subtitle="Objectif, export, compte" />

      <div className="flex flex-col gap-8">
        <TargetsSection
          monthIso={month}
          monthLabel={formatMonthLabel(month)}
          settings={settings}
        />

        <MonthManagementSection
          activeMonth={month}
          activeLabel={formatMonthLabel(month)}
          activeStatus={activeStatus}
          nextLabel={formatMonthLabel(nextMonth)}
          canNewMonth={isBehind}
          prevMonth={prevMonth}
          prevLabel={formatMonthLabel(prevMonth)}
          prevClosed={prevStatus === 'closed'}
        />

        {/* Export CSV — placeholder (arrive en Phase 13) */}
        <section>
          <h2 className="mb-3 text-base font-bold tracking-tight text-ink">
            Export CSV
          </h2>
          <Card className="flex flex-col items-start gap-3">
            <p className="text-sm text-ink-2">
              Télécharge toutes tes transactions et budgets. Bientôt disponible.
            </p>
            <Button variant="secondary" disabled>
              Exporter en CSV
            </Button>
          </Card>
        </section>

        {/* Compte */}
        <section>
          <h2 className="mb-3 text-base font-bold tracking-tight text-ink">
            Compte
          </h2>
          <Card className="flex flex-col items-start gap-3">
            <p className="text-sm text-ink-2">
              Le changement de mot de passe arrivera plus tard.
            </p>
            <LogoutButton />
          </Card>
        </section>
      </div>
    </>
  )
}
