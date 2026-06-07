/**
 * Concatène des classes conditionnellement (ignore false / null / undefined).
 * Volontairement minimal : pas de dépendance externe pour la v1.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
