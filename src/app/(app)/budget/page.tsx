import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Card } from '@/components/ui'
import { currentMonthStart, formatMonthLabel } from '@/lib/month'

/*
 * Écran Budget prévisionnel.
 *
 * ⚠ Phase 5bis — session 1 (backend) : le pivot modèle « Dépenses » a remplacé
 * la table `categories` par `expenses`. L'UID de cet écran (hiérarchie
 * Type > Catégorie > Dépenses, modale « Nouvelle dépense » via ExpenseForm) est
 * refondue en session 2. Placeholder temporaire en attendant.
 *
 * Référence de l'ancienne implémentation : `BudgetEditor.tsx.bak`.
 */
export default async function BudgetPage() {
  const month = currentMonthStart()

  return (
    <>
      <ScreenHeader
        title="Budget"
        subtitle={`Prévisionnel · ${formatMonthLabel(month)}`}
      />
      <Card className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink">Refonte en cours</p>
        <p className="text-sm text-ink-2">
          L&apos;écran Budget est en cours de refonte suite au pivot modèle
          « Dépenses » (Phase 5bis, session 2).
        </p>
      </Card>
    </>
  )
}
