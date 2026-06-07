import { TabBar } from '@/components/layout/TabBar'

/*
 * Layout des écrans applicatifs (sous tab bar). Le groupe (app) isole ces
 * routes de l'écran de login (groupe (auth)) qui n'a pas de tab bar.
 * Marge d'écran 18px (cf. design system) ; padding bas pour ne pas passer
 * sous la tab bar fixe.
 */
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto w-full max-w-md flex-1 px-[18px] pt-[18px] pb-28">
      {children}
      <TabBar />
    </div>
  )
}
