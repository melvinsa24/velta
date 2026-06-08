/*
 * Helpers de mois. Format ISO partout en interne ('YYYY-MM-01'), affichage
 * français uniquement à la présentation (cf. SPECS §11).
 */

const MONTHS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

/** Premier jour du mois en cours, au format ISO 'YYYY-MM-01' (date locale). */
export function currentMonthStart(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

/** 'YYYY-MM-01' → 'Juin 2026' (affichage français). */
export function formatMonthLabel(monthIso: string): string {
  const [year, month] = monthIso.split('-').map(Number)
  return `${MONTHS_FR[month - 1]} ${year}`
}

/** Premier jour du mois précédent, au format ISO 'YYYY-MM-01'. */
export function previousMonthStart(monthIso: string): string {
  const [year, month] = monthIso.split('-').map(Number)
  // month - 1 = index 0-based ; -1 de plus = mois précédent (Date gère le passage d'année).
  const d = new Date(year, month - 2, 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}
