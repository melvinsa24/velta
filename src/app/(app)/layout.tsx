import { AppHeader } from '@/components/layout/AppHeader'
import { Fab } from '@/components/layout/Fab'
import { getMonthContext } from '@/lib/data/activeMonth'
import { getMonthExpenseOptions } from '@/lib/data/expenseOptions'

/*
 * Layout des écrans applicatifs. Le groupe (app) isole ces routes de l'écran
 * de login (groupe (auth)) qui n'a ni header ni FAB. Marge d'écran 18px
 * (cf. design system) ; padding haut pour le header fixe (56px) et padding
 * bas pour ne pas passer sous le FAB flottant.
 *
 * Charge les dépenses prévues du mois courant pour alimenter le rattachement
 * de la saisie rapide (FAB). Ce fetch est refait à chaque navigation : dette
 * technique acceptée (mono-utilisateur, free tier), à optimiser en Phase 14 si
 * les transitions iPhone deviennent lentes.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { activeMonth, activeStatus } = await getMonthContext()
  const expenseOptions = await getMonthExpenseOptions(activeMonth)

  return (
    <>
      <AppHeader />
      {/* Padding haut = header (56px) + 18px + encoche iOS ; bas = FAB + home
          indicator iOS (safe areas, PWA standalone). */}
      <div className="mx-auto w-full max-w-md flex-1 px-[18px] pt-[calc(3.5rem+18px+env(safe-area-inset-top))] pb-[calc(100px+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <Fab expenseOptions={expenseOptions} monthClosed={activeStatus === 'closed'} />
    </>
  )
}
