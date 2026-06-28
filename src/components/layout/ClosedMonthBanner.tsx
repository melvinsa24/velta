/*
 * Bandeau discret affiché en haut du contenu d'un écran quand le mois affiché est
 * clôturé (status = 'closed', SPECS §7.2). Consultation uniquement : tous les
 * champs et actions de l'écran sont alors désactivés / masqués. Fond --surface-2,
 * texte --ink-2, sans bordure agressive (cf. design system).
 */
export function ClosedMonthBanner() {
  return (
    <div className="rounded-card bg-surface-2 px-3 py-2.5 text-sm text-ink-2">
      Mois clôturé — consultation uniquement
    </div>
  )
}
