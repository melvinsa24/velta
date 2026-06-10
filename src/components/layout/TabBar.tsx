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
 * Navigation basse (cf. SPECS §4 + VELTA_DESIGN_SYSTEM.md).
 * Tab bar 4 onglets (icônes seules) + FAB « + » flottant indépendant,
 * en bas à droite, au-dessus de la tab bar. Icônes lucide-react uniquement.
 */
type Tab = { href: string; label: string; icon: LucideIcon }

const tabs: Tab[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/budget', label: 'Budget', icon: Wallet },
  { href: '/flore', label: 'Flore', icon: Users },
  { href: '/reglages', label: 'Réglages', icon: Settings },
]

// Hauteur du contenu de la tab bar (hors safe area). Sert de repère pour
// positionner le FAB juste au-dessus.
const TAB_BAR_HEIGHT = '4rem' // 64px

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon
  return (
    <Link
      href={tab.href}
      aria-label={tab.label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        // Cible tactile ≥ 44px
        'flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1.5 py-2',
        active ? 'text-ink' : 'text-ink-3',
      )}
    >
      <Icon size={28} aria-hidden="true" />
      {/* Point lime centré sous l'icône de l'onglet actif */}
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

  return (
    <>
      {/* Tab bar — 4 onglets icônes seules */}
      <nav
        aria-label="Navigation principale"
        style={{ height: `calc(${TAB_BAR_HEIGHT} + env(safe-area-inset-bottom))` }}
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface',
          // Marge de sécurité pour la barre home iOS
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <div className="mx-auto flex h-16 max-w-md items-center px-2">
          {tabs.map((tab) => (
            <TabLink
              key={tab.href}
              tab={tab}
              active={pathname.startsWith(tab.href)}
            />
          ))}
        </div>
      </nav>

      {/* FAB « + » — flottant, au-dessus de la tab bar (saisie rapide) */}
      <button
        type="button"
        onClick={() => setQuickAddOpen(true)}
        aria-label="Ajouter une transaction"
        style={{
          bottom: `calc(${TAB_BAR_HEIGHT} + env(safe-area-inset-bottom) + 1rem)`,
        }}
        className={cn(
          'fixed right-[18px] z-50 flex h-16 w-16 items-center justify-center rounded-full',
          'bg-accent text-accent-ink shadow-accent',
          'transition-transform duration-150 hover:-translate-y-0.5 active:bg-accent-press',
        )}
      >
        <Plus size={28} aria-hidden="true" />
      </button>

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
