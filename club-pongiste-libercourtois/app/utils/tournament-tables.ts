import type { ScheduledMatch, ScheduledPool } from './tournament-schedule'

export interface TournamentTable {
  number: number
  status: 'free' | 'reserved' | 'playing'
  matches: ScheduledMatch[]
  pools: ScheduledPool[]
  next: ScheduledMatch | null
  conflict: boolean
}

/** Show current physical occupancy across every series, independently of planned times. */
export function tableOverview(
  matches: ScheduledMatch[],
  pools: ScheduledPool[],
  tableCount: number
): TournamentTable[] {
  const numbers = new Set(
    Array.from({ length: tableCount }, function (_, index) {
      return index + 1
    })
  )
  for (const match of matches)
    if (
      match.table !== null &&
      (match.status === 'pending' || match.status === 'in_progress')
    )
      numbers.add(match.table)
  for (const pool of pools) for (const table of pool.tables) numbers.add(table)
  return [...numbers]
    .sort(function (first, second) {
      return first - second
    })
    .map(function (number) {
      const tablePools = pools.filter(function (pool) {
        return pool.tables.includes(number)
      })
      const playing = matches.filter(function (match) {
        return (
          match.table === number &&
          match.status === 'in_progress' &&
          !tablePools.some(function (pool) {
            return (
              match.phase === 'pools' &&
              pool.seriesId === match.seriesId &&
              pool.poolId === match.poolId
            )
          })
        )
      })
      const pending = matches
        .filter(function (match) {
          return match.table === number && match.status === 'pending'
        })
        .sort(comparePlannedMatches)
      return {
        number,
        status:
          playing.length ||
          tablePools.some(function (pool) {
            return pool.status === 'in_progress'
          })
            ? 'playing'
            : tablePools.length
              ? 'reserved'
              : 'free',
        matches: playing,
        pools: tablePools,
        next: pending[0] ?? null,
        conflict: playing.length + tablePools.length > 1
      }
    })
}

/** Sort future assignments without changing the supplied schedule. */
function comparePlannedMatches(
  first: ScheduledMatch,
  second: ScheduledMatch
): number {
  return (
    (first.scheduledAt ?? '9999').localeCompare(second.scheduledAt ?? '9999') ||
    first.seriesId - second.seriesId ||
    first.id - second.id
  )
}
