'use client'

import { useState, useTransition } from 'react'
import { upsertRevenusReels } from '@/lib/actions/monthlySettings'
import { formatEurosCents, parseAmount } from '@/lib/format'

/*
 * Sous-onglet « Revenus » de l'écran Historique (SPECS §7.5). Trois lignes :
 *   - Salaire  → éditable, `revenue_salaire`
 *   - APL (ma part) → lecture seule, calculée à la volée depuis l'APL brute et
 *     le ratio de revenus (saisie dans l'onglet Flore)
 *   - Autres   → éditable, `revenue_autres`
 *
 * Aucune valeur dérivée n'est stockée (SPECS §9.1) : la part d'APL et le total
 * réel sont recalculés ici, jamais persistés. Sauvegarde au blur ; salaire et
 * autres sont toujours envoyés ensemble.
 */

/*
 * Part d'APL revenant à Melvin (SPECS §7.5 / brief Phase 8a) :
 *   apl × (salaire + autres) / (salaire + autres + revenue_flore)
 * Renvoie null (→ « — ») si l'APL est nulle/absente ou si Flore n'a pas de revenu.
 */
function aplPart(
  apl: number | null,
  salaire: number,
  autres: number,
  revenueFlore: number,
): number | null {
  if (!apl || apl <= 0 || revenueFlore <= 0) return null
  const base = salaire + autres
  return (apl * base) / (base + revenueFlore)
}

export function RevenusPanel({
  month,
  revenueSalaire,
  revenueAutres,
  apl,
  revenueFlore,
  readOnly = false,
}: {
  month: string
  revenueSalaire: number
  revenueAutres: number
  apl: number | null
  revenueFlore: number
  readOnly?: boolean
}) {
  const [salaire, setSalaire] = useState(
    revenueSalaire > 0 ? String(revenueSalaire) : '',
  )
  const [autres, setAutres] = useState(
    revenueAutres > 0 ? String(revenueAutres) : '',
  )
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Sauvegarde au blur : on envoie toujours salaire ET autres ensemble.
  function save() {
    setError(null)
    startTransition(async () => {
      const result = await upsertRevenusReels({
        month,
        revenue_salaire: parseAmount(salaire),
        revenue_autres: parseAmount(autres),
      })
      if (result.error) setError("Échec de l'enregistrement. Réessaie.")
    })
  }

  const part = aplPart(apl, parseAmount(salaire), parseAmount(autres), revenueFlore)
  const total = parseAmount(salaire) + parseAmount(autres) + (part ?? 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        {/* Salaire — éditable */}
        <RevenuRow label="Salaire" htmlFor="rev-salaire">
          <AmountInput
            id="rev-salaire"
            value={salaire}
            onChange={setSalaire}
            onBlur={save}
            disabled={readOnly}
          />
        </RevenuRow>

        {/* APL (ma part) — lecture seule, calculée */}
        <RevenuRow label="APL (ma part)" border>
          <div className="flex flex-col items-end">
            <span className="tabular text-base text-ink">
              {part !== null ? formatEurosCents(part) : '—'}
            </span>
            <span className="text-[11px] text-ink-3">
              Calculé depuis l&apos;onglet Flore
            </span>
          </div>
        </RevenuRow>

        {/* Autres — éditable */}
        <RevenuRow label="Autres" htmlFor="rev-autres" border>
          <AmountInput
            id="rev-autres"
            value={autres}
            onChange={setAutres}
            onBlur={save}
            disabled={readOnly}
          />
        </RevenuRow>
      </div>

      {error && (
        <p className="text-sm text-down" role="alert">
          {error}
        </p>
      )}

      {/* Total réel mis en avant */}
      <div className="flex items-center justify-between rounded-card border border-border bg-surface-2 px-[18px] py-3">
        <span className="text-sm font-medium text-ink">Total réel</span>
        <span className="tabular text-lg font-bold text-ink">
          {formatEurosCents(total)}
        </span>
      </div>
    </div>
  )
}

/* Ligne du tableau Revenus : libellé à gauche, valeur / champ à droite. */
function RevenuRow({
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

/* Champ montant aligné à droite, clavier décimal (cible ≥ 44px). */
function AmountInput({
  id,
  value,
  onChange,
  onBlur,
  disabled = false,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder="0"
        className="tabular h-11 w-28 rounded-card border border-border bg-surface px-2 text-right text-base text-ink outline-none transition-colors focus:border-ink disabled:bg-surface-2 disabled:text-ink-3"
      />
      <span className="w-3 text-sm text-ink-3" aria-hidden="true">
        €
      </span>
    </div>
  )
}
