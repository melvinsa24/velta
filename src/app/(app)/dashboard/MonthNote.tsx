'use client'

import { useRef, useState, useTransition } from 'react'
import { upsertNote } from '@/lib/actions/monthlySettings'

/*
 * Note libre du mois (SPECS §7.1). Sauvegarde automatique débouncée à 800 ms via
 * `upsertNote`. Pré-remplie depuis `monthly_settings.note`. Une note vide est
 * persistée comme NULL (pas de chaîne vide en base).
 */
export function MonthNote({
  month,
  initialNote,
}: {
  month: string
  initialNote: string
}) {
  const [note, setNote] = useState(initialNote)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function handleChange(value: string) {
    setNote(value)
    setSaved(false)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const result = await upsertNote({
          month,
          note: value.trim() ? value : null,
        })
        if (!result.error) setSaved(true)
      })
    }, 800)
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="month-note"
          className="text-[11px] font-semibold tracking-[0.14em] text-ink-3 uppercase"
        >
          Note du mois
        </label>
        {isPending ? (
          <span className="text-[11px] text-ink-3">Enregistrement…</span>
        ) : saved ? (
          <span className="text-[11px] text-ink-3">Enregistré</span>
        ) : null}
      </div>
      <textarea
        id="month-note"
        value={note}
        onChange={(e) => handleChange(e.target.value)}
        rows={3}
        placeholder="Un mot sur ce mois (optionnel)…"
        className="w-full resize-none rounded-card border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-ink"
      />
    </section>
  )
}
