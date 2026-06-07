import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

/*
 * Variantes (cf. VELTA_DESIGN_SYSTEM.md) :
 * - primary  : CTA accent lime, texte sombre, ombre lime au hover.
 * - secondary: surface blanche bordée, texte --ink.
 * - ghost    : transparent, texte --ink-2 (actions discrètes).
 * Cible tactile ≥ 44px (mobile-first).
 */
const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-ink hover:shadow-accent active:bg-accent-press',
  secondary:
    'bg-surface text-ink border border-border-2 hover:shadow-card-hover',
  ghost: 'bg-transparent text-ink-2 hover:bg-surface-2',
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-card px-4 text-sm font-medium',
        'transition-all duration-150 hover:-translate-y-0.5',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
