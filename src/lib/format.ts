/*
 * Formatage et parsing des montants — source unique de l'app.
 *
 * Deux rendus coexistent volontairement (cf. VELTA_DESIGN_SYSTEM.md, montants en
 * `tabular-nums`) :
 *   - `formatEuros`      : 0 à 2 décimales. Affichage courant (Dashboard, Budget,
 *     Historique) — un montant rond reste rond, pas de « ,00 » parasite.
 *   - `formatEurosCents` : toujours 2 décimales. Sommes calculées au centime près
 *     (module Flore : parts, remboursements ; CTA de saisie : la somme qu'on
 *     s'apprête à enregistrer).
 *
 * Le parsing tolère la virgule décimale FR : c'est ce que produit le clavier
 * numérique iOS, et ce que l'utilisateur tape naturellement.
 */

/** Parse une saisie FR (virgule décimale tolérée) ; 0 si vide / invalide. */
export function parseAmount(value: string): number {
  if (!value.trim()) return 0
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/** Montant affiché avec 0 à 2 décimales (affichage courant). */
export function formatEuros(n: number): string {
  return `${n.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} €`
}

/** Montant affiché au centime près (module Flore, CTA de saisie). */
export function formatEurosCents(n: number): string {
  return `${n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`
}
