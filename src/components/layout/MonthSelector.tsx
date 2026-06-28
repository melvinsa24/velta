'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  formatMonthLabel,
  nextMonthStart,
  previousMonthStart,
} from '@/lib/month'

/*
 * Sélecteur de mois : flèches précédent / suivant + libellé « Juin 2026 ».
 * Navigation via le paramètre d'URL `?month=YYYY-MM-01` (état porté par l'URL,
 * partageable et compatible Server Components). `basePath` = route hôte.
 *
 * `maxMonth` (optionnel) : mois plafond ('YYYY-MM-01'). La flèche « suivant » est
 * désactivée dès que le mois affiché l'atteint → on ne navigue jamais vers un mois
 * futur. Comparaison lexicographique (le format ISO le permet).
 */
export function MonthSelector({
  month,
  basePath,
  maxMonth,
}: {
  month: string
  basePath: string
  maxMonth?: string
}) {
  const prev = previousMonthStart(month)
  const next = nextMonthStart(month)
  const nextDisabled = maxMonth != null && month >= maxMonth

  return (
    <div className="flex items-center justify-between">
      <Link
        href={`${basePath}?month=${prev}`}
        aria-label="Mois précédent"
        className="flex h-11 w-11 items-center justify-center rounded-card text-ink-2 hover:bg-surface-2"
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </Link>

      <span className="text-base font-bold tracking-tight text-ink">
        {formatMonthLabel(month)}
      </span>

      {nextDisabled ? (
        <span
          aria-label="Mois suivant"
          aria-disabled="true"
          className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-card text-ink-3 opacity-40"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </span>
      ) : (
        <Link
          href={`${basePath}?month=${next}`}
          aria-label="Mois suivant"
          className="flex h-11 w-11 items-center justify-center rounded-card text-ink-2 hover:bg-surface-2"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
