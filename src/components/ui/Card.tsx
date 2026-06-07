import { cn } from '@/lib/cn'

type CardProps = React.HTMLAttributes<HTMLDivElement>

/*
 * Surface blanche, rayon 10px, bordure fine, ombre légère
 * (cf. VELTA_DESIGN_SYSTEM.md — composants dashboard / ombres).
 */
export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface p-[18px] shadow-card',
        className,
      )}
      {...props}
    />
  )
}
