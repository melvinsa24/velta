import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Button, Card } from '@/components/ui'
import { LogoutButton } from '@/app/logout-button'
import { createClient } from '@/lib/supabase/server'
import { currentMonthStart, formatMonthLabel } from '@/lib/month'
import { CategoriesSection } from './CategoriesSection'
import { TargetsSection } from './TargetsSection'
import type { Category, MonthlySettings, Transaction } from '@/types/database'

/*
 * Écran Réglages (Phase 5). Server Component : charge les catégories, le nombre
 * de transactions par catégorie (pour l'avertissement de suppression) et les
 * réglages du mois en cours. 4 sections en scroll vertical :
 * Catégories · Objectifs % · Export CSV (placeholder) · Compte.
 */
export default async function ReglagesPage() {
  const supabase = await createClient()
  const month = currentMonthStart()

  const [categoriesRes, txRes, settingsRes] = await Promise.all([
    supabase.from('categories').select('*').order('created_at'),
    supabase.from('transactions').select('category_id'),
    supabase
      .from('monthly_settings')
      .select('*')
      .eq('month', month)
      .maybeSingle(),
  ])

  const categories = (categoriesRes.data as Category[] | null) ?? []
  const settings = (settingsRes.data as MonthlySettings | null) ?? null

  // Compte des transactions par catégorie.
  const txCounts: Record<string, number> = {}
  const txRows = (txRes.data as Pick<Transaction, 'category_id'>[] | null) ?? []
  for (const row of txRows) {
    txCounts[row.category_id] = (txCounts[row.category_id] ?? 0) + 1
  }

  return (
    <>
      <ScreenHeader title="Réglages" subtitle="Catégories, objectif, compte" />

      <div className="flex flex-col gap-8">
        <CategoriesSection categories={categories} txCounts={txCounts} />

        <TargetsSection
          monthIso={month}
          monthLabel={formatMonthLabel(month)}
          settings={settings}
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
