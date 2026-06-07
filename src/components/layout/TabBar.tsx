'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
  Plus,
  Users,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Modal } from '@/components/ui'

/*
 * Tab bar basse (cf. SPECS §4 + VELTA_DESIGN_SYSTEM.md).
 * 4 onglets + bouton « + » central lime. Verre dépoli, point lime sous
 * l'onglet actif. Icônes exclusivement lucide-react.
 */
type Tab = { href: string; label: string; icon: LucideIcon }

const tabs: Tab[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/budget', label: 'Budget', icon: Wallet },
  { href: '/flore', label: 'Flore', icon: Users },
  { href: '/reglages', label: 'Réglages', icon: Settings },
]

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon
  return (
    <Link
      href={tab.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-11 flex-1 flex-col items-center justify-center gap-1 py-1.5',
        active ? 'text-ink' : 'text-ink-3',
      )}
    >
      <Icon size={22} aria-hidden="true" />
      <span className="text-[11px] font-medium tracking-tight">{tab.label}</span>
      {/* Point lime sous l'onglet actif */}
      <span
        className={cn(
          'h-1 w-1 rounded-full',
          active ? 'bg-accent' : 'bg-transparent',
        )}
        aria-hidden="true"
      />
    </Link>
  )
}

export function TabBar() {
  const pathname = usePathname()
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  // 2 onglets de chaque côté du bouton « + » central.
  const left = tabs.slice(0, 2)
  const right = tabs.slice(2)

  return (
    <>
      <nav
        aria-label="Navigation principale"
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-border',
          // Verre dépoli
          'bg-surface/80 backdrop-blur-lg',
          // Marge de sécurité pour l'encoche / barre home iOS
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <div className="mx-auto flex max-w-md items-center px-2">
          {left.map((tab) => (
            <TabLink
              key={tab.href}
              tab={tab}
              active={pathname.startsWith(tab.href)}
            />
          ))}

          {/* Bouton + central (saisie rapide — modale vide pour l'instant) */}
          <div className="flex flex-1 justify-center">
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              aria-label="Ajouter une transaction"
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                'bg-accent text-accent-ink shadow-accent',
                'transition-transform duration-150 hover:-translate-y-0.5 active:bg-accent-press',
              )}
            >
              <Plus size={24} aria-hidden="true" />
            </button>
          </div>

          {right.map((tab) => (
            <TabLink
              key={tab.href}
              tab={tab}
              active={pathname.startsWith(tab.href)}
            />
          ))}
        </div>
      </nav>

      <Modal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        title="Nouvelle transaction"
      >
        <p className="text-sm text-ink-2">
          La saisie rapide arrivera en Phase 7.
        </p>
      </Modal>
    </>
  )
}
