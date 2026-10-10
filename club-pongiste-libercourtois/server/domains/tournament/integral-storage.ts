import type { IntegralState, IntegralMatch } from './integral'

function destination(
  state: IntegralState,
  match: IntegralMatch,
  outcome: 'winner' | 'loser'
) {
  return state.nodes.find(function (node) {
    return node.sources.some(function (source) {
      return source.match === match.id && source.outcome === outcome
    })
  })
}

/** Build relational rows from the same state used for atomic correction replay. */
export function integralRows(seriesId: number, state: IntegralState | null) {
  return {
    pools: (state?.pools ?? []).map(function (pool) {
      return { seriesId, id: pool.id }
    }),
    members: (state?.pools ?? []).flatMap(function (pool) {
      return pool.players.map(function (registrationId, index) {
        const rank = state!.poolOrders[String(pool.id)]?.indexOf(registrationId)
        return {
          seriesId,
          poolId: pool.id,
          registrationId,
          position: index + 1,
          rank: rank === undefined || rank < 0 ? null : rank + 1
        }
      })
    }),
    phases: state
      ? ['ready', 'pools', 'playoffs', 'placement', 'finished'].map(
          function (name) {
            return { seriesId, name, current: name === state.phase }
          }
        )
      : [],
    ranges: (state?.nodes ?? []).map(function (node) {
      return { seriesId, ...node }
    }),
    matches: (state?.matches ?? []).map(function (match) {
      const winner = destination(state!, match, 'winner'),
        loser = destination(state!, match, 'loser')
      return {
        seriesId,
        id: match.id,
        key: match.key,
        phase: match.phase,
        poolId: match.poolId,
        rangeStart: match.rangeStart,
        rangeEnd: match.rangeEnd,
        player1: match.player1,
        player2: match.player2,
        winner: match.winner,
        loser: match.loser,
        winnerRangeStart: winner?.start ?? null,
        winnerRangeEnd: winner?.end ?? null,
        loserRangeStart: loser?.start ?? null,
        loserRangeEnd: loser?.end ?? null,
        status: match.status,
        rules: match.rules,
        sources: match.sources,
        forfeitPlayers: match.forfeitPlayers ?? [],
        table: match.table,
        scheduledAt: match.scheduledAt ? new Date(match.scheduledAt) : null,
        startedAt: match.startedAt ? new Date(match.startedAt) : null,
        finishedAt: match.finishedAt ? new Date(match.finishedAt) : null
      }
    }),
    sets: (state?.matches ?? []).flatMap(function (match) {
      return match.sets.map(function (set, index) {
        return { seriesId, matchId: match.id, number: index + 1, ...set }
      })
    }),
    placements: Object.entries(state?.placements ?? {}).map(function ([
      id,
      place
    ]) {
      return { seriesId, registrationId: Number(id), place }
    })
  }
}
