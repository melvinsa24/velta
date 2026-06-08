'use client'

import { useState, useTransition } from 'react'
import { Button, Card, Input } from '@/components/ui'
import { cn } from '@/lib/cn'
import { saveTargets } from './actions'
import type { MonthlySettings } from '@/types/database'

type Field = 'needs' | 'wants' | 'savings'

/* Parse une saisie FR (virgule décimale tolérée). NaN si vide / invalide. */
function parse(value: string): number {
  if (value.trim() === '') return NaN
  return Number(value.replace(',', '.'))
}

/*
 * Section « Objectifs % » : 3 champs besoins / envies / épargne pour le mois en
 * cours, stockés dans monthly_settings. Quand 2 champs sont renseignés, le 3e se
 * complète automatiquement à 100 − somme des deux. La sauvegarde n'est possible
 * que si le total fait exactement 100 %.
 */
export function TargetsSection({
  monthLabel,
  settings,
}: {
  monthIso: string
  monthLabel: string
  settings: MonthlySettings | null
}) {
  const [needs, setNeeds] = useState(
    settings?.target_needs_pct?.toString() ?? '50',
  )
  const [wants, setWants] = useState(
    settings?.target_wants_pct?.toString() ?? '30',
  )
  const [savings, setSavings] = useState(
    settings?.target_savings_pct?.toString() ?? '20',
  )
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const setters: Record<Field, (v: string) => void> = {
    needs: setNeeds,
    wants: setWants,
    savings: setSavings,
  }

  function handleChange(field: Field, raw: string) {
    setSaved(false)
    setError(null)

    const next: Record<Field, string> = { needs, wants, savings, [field]: raw }
    setters[field](raw)

    // Auto-complétion : si exactement un champ est vide et les deux autres sont
    // des nombres valides, on déduit le 3e (100 − somme des deux).
    const fields: Field[] = ['needs', 'wants', 'savings']
    const empty = fields.filter((f) => next[f].trim() === '')
    if (empty.length === 1) {
      const filled = fields.filter((f) => f !== empty[0])
      const sum = filled.reduce((acc, f) => acc + parse(next[f]), 0)
      if (!Number.isNaN(sum)) {
        setters[empty[0]](String(100 - sum))
      }
    }
  }

  const nums = [parse(needs), parse(wants), parse(savings)]
  const allValid = nums.every((n) => !Number.isNaN(n) && n >= 0)
  const total = allValid ? nums.reduce((a, b) => a + b, 0) : NaN
  // Tolérance flottante : on arrondit au centième avant de comparer à 100.
  const isHundred = allValid && Math.round(total * 100) / 100 === 100

  function handleSave() {
    if (!isHundred) return
    startTransition(async () => {
      const result = await saveTargets({
        needs: nums[0],
        wants: nums[1],
        savings: nums[2],
      })
      if (result.error) {
        setError("Échec de l'enregistrement. Réessaie.")
        return
      }
      setSaved(true)
    })
  }

  return (
    <section>
      <h2 className="mb-1 text-base font-bold tracking-tight text-ink">
        Objectifs %
      </h2>
      <p className="mb-3 text-sm text-ink-2">
        Répartition cible pour {monthLabel}. Le total doit faire 100 %.
      </p>

      <Card className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <PctField
            label="Besoins"
            id="target-needs"
            value={needs}
            onChange={(v) => handleChange('needs', v)}
          />
          <PctField
            label="Envies"
            id="target-wants"
            value={wants}
            onChange={(v) => handleChange('wants', v)}
          />
          <PctField
            label="Épargne"
            id="target-savings"
            value={savings}
            onChange={(v) => handleChange('savings', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-2">Total</span>
          <span
            className={cn(
              'tabular text-sm font-medium',
              isHundred ? 'text-up' : 'text-down',
            )}
          >
            {allValid ? `${Math.round(total * 100) / 100} %` : '— %'}
          </span>
        </div>

        {!isHundred && (
          <p className="text-sm text-down" role="alert">
            Le total doit faire exactement 100 %.
          </p>
        )}
        {error && (
          <p className="text-sm text-down" role="alert">
            {error}
          </p>
        )}

        <Button onClick={handleSave} disabled={pending || !isHundred}>
          {pending ? 'Enregistrement…' : saved ? 'Enregistré ✓' : 'Enregistrer'}
        </Button>
      </Card>
    </section>
  )
}

function PctField({
  label,
  id,
  value,
  onChange,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-ink-2">
        {label}
      </label>
      <Input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="tabular text-center"
      />
    </div>
  )
}
