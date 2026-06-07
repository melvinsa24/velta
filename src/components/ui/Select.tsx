import { cn } from '@/lib/cn'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

/*
 * Sélecteur natif stylé sur la charte (rayon 10px, bordure --border).
 * Natif = accessible + bon comportement mobile (roue iOS).
 * Le détail du sélecteur cascade catégories viendra en Phase 6/7.
 */
export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'min-h-11 w-full rounded-card border border-border bg-surface px-3 text-base text-ink',
        'outline-none transition-colors focus:border-ink disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
