'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { CATEGORY_COLORS } from '@/lib/categoryMeta'

/*
 * Sélecteur de couleur de catégorie : palette de 12 pastilles prédéfinies
 * (cf. categoryMeta). Pastilles carrées au rayon 10px, cible tactile 44px.
 * La pastille sélectionnée porte un anneau --ink et une coche.
 */
export function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_COLORS.map((color) => {
        const selected = color.toLowerCase() === value.toLowerCase()
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Couleur ${color}`}
            aria-pressed={selected}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-card',
              'transition-transform duration-150 hover:-translate-y-0.5',
              selected && 'ring-2 ring-ink ring-offset-2 ring-offset-surface',
            )}
            style={{ backgroundColor: color }}
          >
            {selected && (
              <Check size={18} className="text-white" aria-hidden="true" />
            )}
          </button>
        )
      })}
    </div>
  )
}
