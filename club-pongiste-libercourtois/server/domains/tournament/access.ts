/** Enforce nested tournament ownership before any endpoint reads or writes. */
export function checkTournamentScope(
  tournamentId: number,
  seriesTournamentId: number | null,
  jaTournamentId: number | null,
  isAdmin: boolean,
  published: boolean,
  publicRead: boolean
): void {
  if (publicRead && !published) throw new Error('Tournoi introuvable')
  if (seriesTournamentId !== null && seriesTournamentId !== tournamentId)
    throw new Error('Série introuvable')
  if (!publicRead && !isAdmin && jaTournamentId !== tournamentId)
    throw new Error('Accès interdit à ce tournoi')
}
