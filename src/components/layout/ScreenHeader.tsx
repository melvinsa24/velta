/*
 * En-tête d'écran : titre de section (cf. typographie design system —
 * 24/700/-3%). Optionnellement un sous-titre méta.
 */
export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
    </header>
  )
}
