'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
  History,
  Users,
  Settings,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'

/*
 * Header fixe + drawer de navigation (cf. SPECS §4 + VELTA_DESIGN_SYSTEM.md).
 * Remplace l'ancienne tab bar basse. Le drawer glisse depuis la droite ;
 * l'overlay et le panneau restent montés pour permettre la transition.
 * Icônes lucide-react uniquement.
 */
type NavItem = { href: string; label: string; icon: LucideIcon }

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/budget', label: 'Budget', icon: Wallet },
  { href: '/historique', label: 'Historique', icon: History },
  { href: '/flore', label: 'Flore', icon: Users },
  { href: '/reglages', label: 'Réglages', icon: Settings },
]

function DrawerLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  onNavigate: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        // Cible tactile ≥ 44px, padding 16px
        'relative flex min-h-11 items-center gap-3 p-4',
        active ? 'bg-surface-2 text-ink' : 'text-ink-2',
      )}
    >
      {/* Barre lime à gauche de l'onglet actif (4px) */}
      {active && (
        <span
          className="absolute inset-y-0 left-0 w-1 bg-accent"
          aria-hidden="true"
        />
      )}
      <Icon
        size={20}
        aria-hidden="true"
        className={active ? 'text-ink' : 'text-ink-3'}
      />
      <span className="text-sm font-medium tracking-tight">{item.label}</span>
    </Link>
  )
}

export function AppHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Miroir de `open` lisible dans les handlers de geste (attachés une seule fois).
  const openRef = useRef(open)
  useEffect(() => {
    openRef.current = open
  }, [open])

  // Empêche le scroll de l'arrière-plan tant que le drawer est ouvert + Échap.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  /*
   * Geste de swipe horizontal pour ouvrir / fermer le drawer (SPECS — navigation
   * mobile). Listeners posés sur `window` une seule fois : AppHeader est monté
   * par le layout (app) sur tous les écrans, donc le geste marche partout, et il
   * pilote exactement le même état `open` (pas de second système).
   *
   * Détection au touchend (pas de preventDefault, listeners passifs) → n'interfère
   * ni avec le scroll vertical ni avec le swipe-retour natif d'iOS. Pour l'ouverture
   * on ignore les gestes partant des 20 premiers px (zone du retour iOS).
   */
  useEffect(() => {
    const EDGE = 20 // marge gauche réservée au swipe-retour iOS (ouverture)
    const DIST = 60 // déplacement horizontal minimal (px)
    const VELOCITY = 0.5 // ou vitesse suffisante (px/ms)
    let startX = 0
    let startY = 0
    let startT = 0
    let tracking = false

    function onStart(e: TouchEvent) {
      if (e.touches.length !== 1) {
        tracking = false
        return
      }
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
      startT = e.timeStamp
      tracking = true
    }

    function onEnd(e: TouchEvent) {
      if (!tracking) return
      tracking = false
      const t = e.changedTouches[0]
      if (!t) return
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      const dt = e.timeStamp - startT || 1
      // Geste vertical dominant → c'est un scroll, on ignore.
      if (Math.abs(dx) <= Math.abs(dy)) return
      const fast = Math.abs(dx) / dt >= VELOCITY
      if (Math.abs(dx) < DIST && !fast) return

      if (dx > 0 && !openRef.current) {
        if (startX < EDGE) return // ne pas marcher sur le swipe-retour iOS
        setOpen(true)
      } else if (dx < 0 && openRef.current) {
        setOpen(false)
      }
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [])

  return (
    <>
      {/* Header fixe */}
      <header
        className={cn(
          // pt safe-area : le fond du header s'étend sous l'encoche iOS (statut
          // black-translucent), la barre interne (h-14) reste sous l'encoche.
          'fixed inset-x-0 top-0 z-30 border-b border-border bg-surface pt-[env(safe-area-inset-top)]',
        )}
      >
        <div className="relative mx-auto flex h-14 max-w-md items-center px-[18px]">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            className="flex h-11 w-11 items-center justify-center text-ink"
          >
            <Menu size={24} aria-hidden="true" />
          </button>
          {/* « Velta » centré dans la largeur totale du header */}
          <span className="pointer-events-none absolute inset-x-0 text-center text-lg font-bold tracking-tight text-ink">
            Velta
          </span>
        </div>
      </header>

      {/* Overlay sombre */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-50 bg-ink/40 transition-opacity duration-300 ease-in-out',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Drawer — glisse depuis la droite */}
      <nav
        aria-label="Navigation principale"
        aria-hidden={!open}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[72%] max-w-[280px] flex-col bg-surface',
          // Safe areas : contenu du drawer sous l'encoche et au-dessus du home indicator.
          'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-[18px]">
          <span className="text-lg font-bold tracking-tight text-ink">
            Velta
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
            className="flex h-11 w-11 items-center justify-center text-ink"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col py-2">
          {navItems.map((item) => (
            <DrawerLink
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </div>
      </nav>
    </>
  )
}
