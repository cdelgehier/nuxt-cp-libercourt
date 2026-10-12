import { advancePhase, recordResult, startMatch } from './integral'
import type { FrozenRules, IntegralMatch, IntegralState } from './integral'

/** Build a complete score, including the frozen advance in every set. */
function demoSets(
  rules: FrozenRules,
  matchId: number,
  winnerSide: 1 | 2
): IntegralMatch['sets'] {
  const sets: IntegralMatch['sets'] = []
  const losingSets = matchId % rules.setsToWin
  for (let index = 0; index < rules.setsToWin + losingSets; index++) {
    const side = index < losingSets ? (winnerSide === 1 ? 2 : 1) : winnerSide
    const loserStart = rules.startScores[side === 1 ? 1 : 0]
    const low =
      loserStart +
      ((matchId + index) % Math.max(1, rules.pointsPerSet - loserStart))
    const high = Math.max(rules.pointsPerSet, low + 2)
    sets.push(
      side === 1 ? { score1: high, score2: low } : { score1: low, score2: high }
    )
  }
  return sets
}

/** Simulations use the sporting engine but do not reserve real playing time. */
function finishDemoMatch(
  state: IntegralState,
  id: number,
  tableCount: number
): void {
  const match = state.matches.find(function (entry) {
    return entry.id === id
  })!
  if (match.status === 'pending') {
    const table =
      match.phase === 'pools'
        ? undefined
        : (match.table ?? ((id - 1) % tableCount) + 1)
    if (table !== undefined && table > tableCount)
      throw new Error('Cette table n’existe pas.')
    startMatch(state, id, { table })
  }
  const first = state.entrants.find(function (entry) {
    return entry.id === match.player1
  })!
  const second = state.entrants.find(function (entry) {
    return entry.id === match.player2
  })!
  const winnerSide = first.seed < second.seed ? 1 : 2
  recordResult(state, id, demoSets(match.rules!, id, winnerSide))
}

/** Finish only unfinished matches in one pool or one match, on an atomic copy. */
export function simulateDemoMatches(
  state: IntegralState,
  target: { poolId: number } | { matchId: number },
  tableCount: number
): number {
  const draft = structuredClone(state)
  if ('poolId' in target && !['ready', 'pools'].includes(draft.phase))
    throw new Error('Les poules ont déjà été validées.')
  if (draft.phase === 'ready') advancePhase(draft)
  const matches = draft.matches.filter(function (match) {
    return (
      ('poolId' in target
        ? match.phase === 'pools' && match.poolId === target.poolId
        : match.id === target.matchId) &&
      ['pending', 'in_progress'].includes(match.status) &&
      match.player1 !== null &&
      match.player2 !== null
    )
  })
  if (!matches.length) throw new Error('Aucune rencontre à simuler.')
  for (const match of matches) finishDemoMatch(draft, match.id, tableCount)
  Object.assign(state, draft)
  return matches.length
}
