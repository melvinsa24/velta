'use client'

import { useState } from 'react'
import { MonthSelector } from '@/components/layout/MonthSelector'
import { cn } from '@/lib/cn'
import { TransactionList, type TransactionRow } from './TransactionList'
import { RevenusPanel } from './RevenusPanel'
import type { ExpenseOption } from '@/components/transaction/TransactionForm'

/*
 * Écran Historique (SPECS §7.5) : sélecteur de mois (URL) + deux sous-onglets
 * sobres (Dépenses / Revenus, soulignement sur l'actif, sans fond coloré).
 * Le sous-onglet actif est un simple état local (pas porté par l'URL).
 */
type Tab = 'depenses' | 'revenus'

export function HistoriqueScreen({
  month,
  transactions,
  expenseOptions,
  revenus,
}: {
  month: string
  transactions: TransactionRow[]
  expenseOptions: ExpenseOption[]
  revenus: {
    revenue_salaire: number
    revenue_autres: number
    apl: number | null
    revenue_flore: number
  }
}) {
  const [tab, setTab] = useState<Tab>('depenses')

  return (
    <div className="flex flex-col gap-5">
      <MonthSelector month={month} basePath="/historique" />

      {/* Sous-onglets sobres */}
      <div className="flex gap-6 border-b border-border" role="tablist">
        <SubTab
          active={tab === 'depenses'}
          onClick={() => setTab('depenses')}
        >
          Dépenses
        </SubTab>
        <SubTab active={tab === 'revenus'} onClick={() => setTab('revenus')}>
          Revenus
        </SubTab>
      </div>

      {tab === 'depenses' ? (
        <TransactionList
          transactions={transactions}
          expenseOptions={expenseOptions}
        />
      ) : (
        <RevenusPanel
          month={month}
          revenueSalaire={revenus.revenue_salaire}
          revenueAutres={revenus.revenue_autres}
          apl={revenus.apl}
          revenueFlore={revenus.revenue_flore}
        />
      )}
    </div>
  )
}

/* Label d'un sous-onglet : soulignement (barre --ink) sur l'actif. */
function SubTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'min-h-11 -mb-px border-b-2 px-1 text-sm font-medium transition-colors',
        active
          ? 'border-ink text-ink'
          : 'border-transparent text-ink-3 hover:text-ink-2',
      )}
    >
      {children}
    </button>
  )
}
