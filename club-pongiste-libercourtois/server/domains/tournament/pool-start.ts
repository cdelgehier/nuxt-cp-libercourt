import { advancePhase, startMatch } from './integral'
import type { IntegralMatch, IntegralState } from './integral'
import { poolTableReservations } from './pool-tables'

/** Player conflicts and short rest need JA confirmation; occupied tables stay blocked. */
export class MatchStartError extends Error {
  readonly code: string

  constructor(message: string, code = 'MATCH_START_BLOCKED') {
    super(message)
    this.code = code
  }
}

function identities(state: IntegralState, match: IntegralMatch): string[] {
  return state.entrants
    .filter(function (entry) {
      return entry.id === match.player1 || entry.id === match.player2
    })
    .flatMap(function (entry) {
      return entry.identities
    })
}

/** Check table availability and warnings outside the same pool. */
export function matchStartBlock(
  state: IntegralState,
  match: IntegralMatch,
  table: number | undefined,
  tournament: IntegralState[],
  now = Date.now(),
  confirmShortRest = false,
  confirmPlayerConflict = false
): MatchStartError | null {
  const players = identities(state, match)
  let restWarning: MatchStartError | null = null
  let playerWarning: MatchStartError | null = null
  for (const other of tournament) {
    if (table !== undefined)
      for (const pool of poolTableReservations(other))
        if (
          pool.tables.includes(table) &&
          !(
            other === state &&
            match.phase === 'pools' &&
            match.poolId === pool.poolId
          )
        )
          return new MatchStartError('La table est réservée à une autre poule.')
    for (const playing of other.matches) {
      if (playing.status !== 'finished' && playing.status !== 'in_progress')
        continue
      if (
        table !== undefined &&
        playing.status === 'in_progress' &&
        playing.table === table
      )
        return new MatchStartError('La table est déjà occupée.')
      const samePool =
        other === state &&
        match.phase === 'pools' &&
        playing.phase === 'pools' &&
        playing.poolId === match.poolId
      if (samePool) continue
      const shared = identities(other, playing).some(function (identity) {
        return players.includes(identity)
      })
      if (!shared) continue
      if (playing.status === 'in_progress') {
        if (!confirmPlayerConflict)
          playerWarning = new MatchStartError(
            'Un joueur est déjà engagé dans une autre série ou poule.',
            'PLAYER_CONFLICT_CONFIRMATION_REQUIRED'
          )
        continue
      }
      const rest = state.planning?.rest ?? 10
      if (
        !confirmShortRest &&
        playing.finishedAt &&
        now < new Date(playing.finishedAt).getTime() + rest * 60000
      )
        restWarning = new MatchStartError(
          `Le temps de repos prévu (${rest} minutes entre les matchs) n’est pas terminé pour au moins un joueur.`,
          'REST_CONFIRMATION_REQUIRED'
        )
    }
  }
  return playerWarning ?? restWarning
}

/** Open all remaining pool sheets atomically, without requiring physical table tracking. */
export function startPool(
  state: IntegralState,
  poolId: number,
  tournament: IntegralState[],
  advances: Record<string, [number, number]> = {},
  now = new Date().toISOString(),
  confirmShortRest = false,
  confirmPlayerConflict = false
): void {
  const draft = structuredClone(state)
  if (draft.phase === 'ready') advancePhase(draft)
  const pending = draft.matches.filter(function (match) {
    return (
      match.phase === 'pools' &&
      match.poolId === poolId &&
      match.status === 'pending'
    )
  })
  if (draft.phase !== 'pools' || !pending.length)
    throw new Error('Poule indisponible.')
  if (
    Object.keys(advances).some(function (id) {
      return !pending.some(function (match) {
        return String(match.id) === id
      })
    })
  )
    throw new Error('Avance fournie pour un match indisponible.')
  const states = tournament.map(function (entry) {
    return entry === state ? draft : entry
  })
  for (const match of pending) {
    const blocked = matchStartBlock(
      draft,
      match,
      undefined,
      states,
      new Date(now).getTime(),
      confirmShortRest,
      confirmPlayerConflict
    )
    if (blocked) throw blocked
    startMatch(
      draft,
      match.id,
      { startScores: advances[String(match.id)] },
      now
    )
  }
  Object.assign(state, draft)
}
