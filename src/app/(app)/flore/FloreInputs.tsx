'use client'

import { useState, useTransition } from 'react'
import { upsertFloreInputs } from '@/lib/actions/monthlySettings'

/*
 * Section 1 de l'onglet Flore (SPECS §7.6 / brief Phase 10a) : deux champs du
 * mois — APL brute (`apl`) et revenus de Flore (`revenue_flore`). Sauvegarde au
 * blur, les deux valeurs envoyées ensemble (même pattern que RevenusPanel).
 *
 * Les sections de calcul (ratio, détail, « Flore me doit ») sont rendues côté
 * serveur depuis les valeurs sauvegardées : la revalidation déclenchée par
 * l'action les rafraîchit après chaque blur. L'APL se répercute aussi dans
 * Historique > Revenus (même colonne). Aucune valeur dérivée n'est stockée.
 */

/* Parse une saisie FR (virgule décimale tolérée) ; 0 si vide / invalide. */
function parseAmount(value: string): number {
  if (!value.trim()) return 0
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function FloreInputs({
  month,
  apl,
  revenueFlore,
}: {
  month: string
  apl: number | null
  revenueFlore: number
}) {
  const [aplValue, setAplValue] = useState(apl && apl > 0 ? String(apl) : '')
  const [floreValue, setFloreValue] = useState(
    revenueFlore > 0 ? String(revenueFlore) : '',
  )
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Sauvegarde au blur : APL et revenus de Flore envoyés ensemble. APL nulle si
  // le champ est vide (préserve le « — » de la part APL dans Historique).
  function save() {
    setError(null)
    const aplParsed = parseAmount(aplValue)
    startTransition(async () => {
      const result = await upsertFloreInputs({
        month,
        apl: aplParsed > 0 ? aplParsed : null,
        revenue_flore: parseAmount(floreValue),
      })
      if (result.error) setError("Échec de l'enregistrement. Réessaie.")
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <FloreRow label="APL brute" htmlFor="flore-apl">
          <AmountInput
            id="flore-apl"
            value={aplValue}
            onChange={setAplValue}
            onBlur={save}
          />
        </FloreRow>
        <FloreRow label="Revenus de Flore" htmlFor="flore-revenue" border>
          <AmountInput
            id="flore-revenue"
            value={floreValue}
            onChange={setFloreValue}
            onBlur={save}
          />
        </FloreRow>
      </div>

      {error && (
        <p className="text-sm text-down" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/* Ligne de saisie : libellé à gauche, champ à droite (cible ≥ 44px). */
function FloreRow({
  label,
  htmlFor,
  border,
  children,
}: {
  label: string
  htmlFor?: string
  border?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={`flex min-h-11 items-center justify-between gap-3 px-[18px] py-2.5 ${
        border ? 'border-t border-border' : ''
      }`}
    >
      <label htmlFor={htmlFor} className="text-sm text-ink">
        {label}
      </label>
      {children}
    </div>
  )
}

/* Champ montant aligné à droite, clavier décimal. */
function AmountInput({
  id,
  value,
  onChange,
  onBlur,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  onBlur: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="0"
        className="tabular h-11 w-28 rounded-card border border-border bg-surface px-2 text-right text-base text-ink outline-none transition-colors focus:border-ink"
      />
      <span className="w-3 text-sm text-ink-3" aria-hidden="true">
        €
      </span>
    </div>
  )
}
