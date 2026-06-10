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

/** Date du jour au format ISO 'YYYY-MM-DD' (date locale). Défaut de saisie. */
export function todayIso(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 'YYYY-MM-DD' → premier jour de son mois 'YYYY-MM-01'. Sert à calculer le
 * `month` d'une transaction côté serveur depuis sa date (SPECS §6, jamais null).
 * Manipulation purement textuelle : pas de fuseau horaire en jeu.
 */
export function monthStartOfDate(dateIso: string): string {
  const [year, month] = dateIso.split('-')
  return `${year}-${month}-01`
}

/** 'YYYY-MM-01' → 'Juin 2026' (affichage français). */
export function formatMonthLabel(monthIso: string): string {
  const [year, month] = monthIso.split('-').map(Number)
  return `${MONTHS_FR[month - 1]} ${year}`
}

/**
 * 'YYYY-MM-DD' → libellé de jour pour le groupement de la liste transactions :
 * « Aujourd'hui », « Hier », ou « 12 juin » (mois en minuscule, sans année).
 * Comparaison sur les chaînes ISO locales (todayIso) : robuste aux fuseaux.
 */
export function formatDayLabel(dateIso: string): string {
  const today = todayIso()
  if (dateIso === today) return "Aujourd'hui"

  // Hier = veille de la date du jour (Date local, gère les bornes de mois/an).
  const [ty, tm, td] = today.split('-').map(Number)
  const yesterday = new Date(ty, tm - 1, td - 1)
  const yIso = `${yesterday.getFullYear()}-${String(
    yesterday.getMonth() + 1,
  ).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
  if (dateIso === yIso) return 'Hier'

  const [, month, day] = dateIso.split('-').map(Number)
  return `${day} ${MONTHS_FR[month - 1].toLowerCase()}`
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

/** Premier jour du mois suivant, au format ISO 'YYYY-MM-01'. */
export function nextMonthStart(monthIso: string): string {
  const [year, month] = monthIso.split('-').map(Number)
  // month = index 0-based du mois suivant (Date gère le passage d'année).
  const d = new Date(year, month, 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

/**
 * Valide / normalise un paramètre de mois ('YYYY-MM-01'). Renvoie le mois en
 * cours si la valeur est absente ou malformée (robustesse du sélecteur de mois).
 */
export function normalizeMonth(value: string | undefined | null): string {
  if (value && /^\d{4}-\d{2}-01$/.test(value)) return value
  return currentMonthStart()
}
