import { cn } from '@/lib/cn'

// ComponentPropsWithRef (et non InputHTMLAttributes) : en React 19 `ref` est une
// prop ordinaire des composants fonction, transmise par le spread ci-dessous.
// Nécessaire pour que l'appelant puisse focus/select le champ (cf. ExpenseQuickEntrySheet).
type InputProps = React.ComponentPropsWithRef<'input'>

/*
 * Champ texte : surface blanche, rayon 10px, bordure --border.
 * Focus → bordure --ink (cf. VELTA_DESIGN_SYSTEM.md). Cible tactile ≥ 44px.
 * font-size 16px (text-base) pour éviter le zoom auto iOS au focus.
 */
export function Input({ className, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'min-h-11 w-full rounded-card border border-border bg-surface px-3 text-base text-ink',
        'placeholder:text-ink-3 outline-none transition-colors',
        'focus:border-ink disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
