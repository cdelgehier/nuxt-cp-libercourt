import type { IntegralMatch, IntegralState } from './integral'
import { poolTableReservations } from './pool-tables'

interface ScheduleSeries {
  state: IntegralState
  earliest: string
}
interface Reservation {
  tables: number[]
  start: number
  end: number
  identities: string[]
}
interface Task {
  matches: IntegralMatch[]
  isPool: boolean
  earliest: number
  durationMs: number
  identities: string[]
  tableOptions: number[][]
}

/** Recognize the same player in singles and as either partner in doubles. */
function identities(state: IntegralState, matches: IntegralMatch[]): string[] {
  const players = new Set(
    matches.flatMap(function (match) {
      return [match.player1, match.player2]
    })
  )
  return [
    ...new Set(
      state.entrants
        .filter(function (entrant) {
          return players.has(entrant.id)
        })
        .flatMap(function (entrant) {
          return entrant.identities
        })
    )
  ]
}

/** Estimate the whole pool, including players who cannot play twice at once. */
function poolDuration(
  state: IntegralState,
  matches: IntegralMatch[],
  tableCount: number,
  duration: number
): number {
  const players = new Set(
    matches.flatMap(function (match) {
      return [match.player1, match.player2].filter(function (id) {
        return id !== null
      })
    })
  )
  const simultaneous = Math.max(
    1,
    Math.min(tableCount, Math.floor(players.size / 2))
  )
  const counts = new Map<string, number>()
  for (const match of matches)
    for (const player of identities(state, [match]))
      counts.set(player, (counts.get(player) ?? 0) + 1)
  const rounds = Math.max(
    Math.ceil(matches.length / simultaneous),
    ...counts.values()
  )
  return rounds * duration * 60000
}

/** Move a forecast after all overlapping tables or player rest periods. */
function nextStart(
  task: Task,
  tables: number[],
  reservations: Reservation[],
  rest: number
): number {
  let start = task.earliest
  let changed = true
  while (changed) {
    changed = false
    for (const reservation of reservations) {
      const sharedPlayer = task.identities.some(function (player) {
        return reservation.identities.includes(player)
      })
      const sharedTable = tables.some(function (table) {
        return reservation.tables.includes(table)
      })
      const gap = sharedPlayer ? rest * 60000 : 0
      if (
        (sharedPlayer || sharedTable) &&
        start < reservation.end + gap &&
        start + task.durationMs > reservation.start - gap
      ) {
        start = reservation.end + gap
        changed = true
      }
    }
  }
  return start
}

/** Plan pool launches as a group and individual matches after the pool phase. */
export function planSchedule(
  series: ScheduleSeries[],
  tables: number,
  duration = 30,
  rest = 10,
  now = Date.now()
): void {
  if (
    !Number.isInteger(tables) ||
    tables < 1 ||
    !Number.isInteger(duration) ||
    duration < 1 ||
    !Number.isInteger(rest) ||
    rest < 0
  )
    throw new Error('Paramètres du planning invalides.')
  const heldTables = new Set<number>()
  for (const item of series)
    for (const pool of poolTableReservations(item.state))
      for (const table of pool.tables) heldTables.add(table)
  const freeTables = Array.from({ length: tables }, function (_, index) {
    return index + 1
  }).filter(function (table) {
    return !heldTables.has(table)
  })
  const reservations: Reservation[] = []
  const tasks: Task[] = []
  for (const item of series) {
    const earliest = Date.parse(item.earliest)
    if (!Number.isFinite(earliest))
      throw new Error('Date de planning invalide.')
    item.state.planning = { duration, rest }
    for (const pool of item.state.pools) {
      const matches = item.state.matches.filter(function (match) {
        return match.poolId === pool.id && match.phase === 'pools'
      })
      // Completed sheets still set the last finish time for each player.
      for (const match of matches) {
        if (match.status !== 'finished' || !match.finishedAt) continue
        reservations.push({
          tables: [],
          start: Date.parse(match.startedAt ?? match.finishedAt),
          end: Date.parse(match.finishedAt),
          identities: identities(item.state, [match])
        })
      }
      const remaining = matches.filter(function (match) {
        return match.status === 'pending' || match.status === 'in_progress'
      })
      if (!remaining.length) continue
      const launched = matches.filter(function (match) {
        return match.status === 'in_progress' || match.status === 'finished'
      })
      const poolTables = pool.tables ?? []
      const length = poolDuration(
        item.state,
        remaining,
        poolTables.length || 1,
        duration
      )
      if (launched.length) {
        const start = Math.min(
          ...launched.map(function (match) {
            return Date.parse(
              match.startedAt ??
                match.scheduledAt ??
                new Date(now).toISOString()
            )
          })
        )
        reservations.push({
          tables: poolTables,
          start,
          end: Math.max(start, now) + length,
          identities: identities(item.state, remaining)
        })
        continue
      }
      for (const match of remaining) {
        match.table = null
        match.scheduledAt = null
      }
      tasks.push({
        matches: remaining,
        isPool: true,
        earliest,
        durationMs: length,
        identities: identities(item.state, remaining),
        tableOptions: poolTables.length
          ? [poolTables]
          : freeTables.map(function (table) {
              return [table]
            })
      })
    }
    for (const match of item.state.matches) {
      if (match.phase === 'pools' || match.status === 'forfeit') continue
      if (match.status !== 'pending') {
        const start = Date.parse(
          match.startedAt ?? match.scheduledAt ?? new Date(now).toISOString()
        )
        const end =
          match.status === 'finished'
            ? Date.parse(
                match.finishedAt ??
                  new Date(start + duration * 60000).toISOString()
              )
            : Math.max(start, now) + duration * 60000
        reservations.push({
          tables: match.table === null ? [] : [match.table],
          start,
          end,
          identities: identities(item.state, [match])
        })
      } else if (match.player1 !== null && match.player2 !== null) {
        match.table = null
        match.scheduledAt = null
        tasks.push({
          matches: [match],
          isPool: false,
          earliest,
          durationMs: duration * 60000,
          identities: identities(item.state, [match]),
          tableOptions: freeTables.map(function (table) {
            return [table]
          })
        })
      }
    }
  }
  tasks.sort(function (first, second) {
    return first.earliest - second.earliest
  })
  for (const task of tasks) {
    let bestStart = Infinity
    let bestTables: number[] = []
    for (const candidate of task.tableOptions) {
      const start = nextStart(task, candidate, reservations, rest)
      if (start < bestStart) {
        bestStart = start
        bestTables = candidate
      }
    }
    if (!Number.isFinite(bestStart)) continue
    for (const match of task.matches) {
      match.table = task.isPool ? null : bestTables[0]!
      match.scheduledAt = new Date(bestStart).toISOString()
    }
    reservations.push({
      tables: bestTables,
      start: bestStart,
      end: bestStart + task.durationMs,
      identities: task.identities
    })
  }
}
