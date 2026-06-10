'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
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

  return (
    <>
      {/* Header fixe */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-30 h-14 border-b border-border bg-surface',
        )}
      >
        <div className="mx-auto flex h-full max-w-md items-center justify-between px-[18px]">
          <span className="text-lg font-bold tracking-tight text-ink">
            Velta
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            className="flex h-11 w-11 items-center justify-center text-ink"
          >
            <Menu size={24} aria-hidden="true" />
          </button>
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
          'fixed inset-y-0 right-0 z-50 flex w-[72%] max-w-[280px] flex-col bg-surface',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full',
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
