import { expect, it } from 'vitest'
import {
  advancePhase,
  createIntegral,
  planSchedule,
  recordResult,
  startMatch
} from '../../../server/domains/tournament/integral'
import {
  poolTableReservations,
  matchTableNumbers,
  reservePoolTables
} from '../../../server/domains/tournament/pool-tables'
import {
  matchStartBlock,
  startPool
} from '../../../server/domains/tournament/pool-start'

function series(count = 3, prefix = 'player') {
  return createIntegral(
    Array.from({ length: count }, function (_, index) {
      return {
        id: index + 1,
        ranking: 1500 - index * 100,
        club: null,
        identities: [`${prefix}:${index + 1}`],
        withdrawn: false,
        seed: index + 1
      }
    }),
    { setsToWin: 1, pointsPerSet: 11, handicap: false }
  )
}

it('shows both pool tables on its sheets before launch, during play and after completion without individual assignments', function () {
  const state = series()
  reservePoolTables(state, 1, [2, 3], 5, [state])
  const before = structuredClone(state)
  expect(matchTableNumbers(state, state.matches[0]!)).toEqual([2, 3])
  expect(state).toEqual(before)
  startPool(state, 1, [state])
  expect(matchTableNumbers(state, state.matches[0]!)).toEqual([2, 3])
  for (const match of state.matches)
    recordResult(state, match.id, [{ score1: 11, score2: 0 }])
  expect(poolTableReservations(state)).toEqual([])
  expect(matchTableNumbers(state, state.matches[0]!)).toEqual([2, 3])
  expect(state.matches[0]!.table).toBeNull()
})

it('keeps a pool without reservations unassigned', function () {
  const state = series()
  expect(matchTableNumbers(state, state.matches[0]!)).toEqual([])
})

it('keeps an explicitly assigned match table ahead of its pool table labels', function () {
  const state = series()
  reservePoolTables(state, 1, [2, 3], 5, [state])
  advancePhase(state)
  startMatch(state, 1, { table: 2 })
  expect(matchTableNumbers(state, state.matches[0]!)).toEqual([2])
  const final = series(2)
  advancePhase(final)
  startMatch(final, 1, { table: 4 })
  expect(matchTableNumbers(final, final.matches[0]!)).toEqual([4])
})

it('does not inherit the table reservation of another pool', function () {
  const state = series(6)
  reservePoolTables(state, 1, [2, 3], 5, [state])
  const other = state.matches.find(function (match) {
    return match.poolId === 2
  })!
  expect(matchTableNumbers(state, other)).toEqual([])
})

it('reserves one or two tables for a prepared pool and keeps them across snapshot serialization and launch', function () {
  const state = series()
  reservePoolTables(state, 1, [2, 1], 4, [state])
  const saved = JSON.parse(JSON.stringify(state))
  expect(poolTableReservations(saved)).toEqual([
    { poolId: 1, tables: [1, 2], status: 'reserved', completed: 0, total: 3 }
  ])
  startPool(saved, 1, [saved])
  expect(poolTableReservations(saved)[0]).toMatchObject({
    tables: [1, 2],
    status: 'in_progress'
  })
  expect(
    saved.matches.every(function (match) {
      return match.table === null
    })
  ).toBe(true)
})

it.each([[0], [-1], [1.5], [5], [1, 1], [1, 2, 3]])(
  'rejects invalid table numbers %j without changing the existing reservation',
  function (...tables) {
    const state = series()
    reservePoolTables(state, 1, [2], 4, [state])
    const before = structuredClone(state)
    expect(function () {
      reservePoolTables(state, 1, tables, 4, [state])
    }).toThrow()
    expect(state).toEqual(before)
  }
)

it('rejects a missing pool and a completed pool', function () {
  const state = series()
  expect(function () {
    reservePoolTables(state, 99, [1], 4, [state])
  }).toThrow('Poule indisponible')
  startPool(state, 1, [state])
  for (const match of state.matches)
    recordResult(state, match.id, [{ score1: 11, score2: 0 }])
  expect(function () {
    reservePoolTables(state, 1, [1], 4, [state])
  }).toThrow('Poule indisponible')
})

it('prevents two pools from different series with the same pool number reserving one table', function () {
  const first = series(),
    second = series(3, 'other')
  reservePoolTables(first, 1, [1], 4, [first, second])
  const before = structuredClone(second)
  expect(function () {
    reservePoolTables(second, 1, [1, 2], 4, [first, second])
  }).toThrow('réservée')
  expect(second).toEqual(before)
})

it('prevents reserving the table of an already launched match', function () {
  const state = series(),
    final = series(2, 'other')
  advancePhase(final)
  final.matches[0]!.status = 'in_progress'
  final.matches[0]!.table = 2
  expect(function () {
    reservePoolTables(state, 1, [2], 4, [state, final])
  }).toThrow('occupée')
  expect(poolTableReservations(state)).toEqual([])
})

it('blocks a match on a table reserved for another pool even with JA confirmations', function () {
  const state = series(),
    final = series(2, 'other')
  reservePoolTables(state, 1, [1], 4, [state, final])
  advancePhase(final)
  expect(
    matchStartBlock(
      final,
      final.matches[0]!,
      1,
      [state, final],
      Date.now(),
      true,
      true
    )?.message
  ).toContain('réservée')
  expect(
    matchStartBlock(state, state.matches[0]!, 1, [state, final])
  ).toBeNull()
})

it('can change or cancel a reservation before pool launch', function () {
  const state = series()
  reservePoolTables(state, 1, [1, 2], 4, [state])
  const matches = structuredClone(state.matches)
  reservePoolTables(state, 1, [3], 4, [state])
  expect(poolTableReservations(state)[0]!.tables).toEqual([3])
  reservePoolTables(state, 1, [], 4, [state])
  expect(poolTableReservations(state)).toEqual([])
  expect(state.matches).toEqual(matches)
})

it('keeps every table reserved until all pool results are entered', function () {
  const state = series()
  reservePoolTables(state, 1, [1, 2], 4, [state])
  startPool(state, 1, [state])
  recordResult(state, 1, [{ score1: 11, score2: 0 }])
  const before = structuredClone(state)
  expect(function () {
    reservePoolTables(state, 1, [], 4, [state])
  }).toThrow('fin de toutes')
  expect(function () {
    reservePoolTables(state, 1, [1], 4, [state])
  }).toThrow('fin de toutes')
  expect(state).toEqual(before)
})

it('keeps a partially played older pool occupied between individual launches', function () {
  const state = series()
  reservePoolTables(state, 1, [1, 2], 4, [state])
  advancePhase(state)
  startMatch(state, 1, { table: 1 })
  recordResult(state, 1, [{ score1: 11, score2: 0 }])
  expect(poolTableReservations(state)[0]).toMatchObject({
    status: 'in_progress',
    completed: 1,
    total: 3
  })
  const before = structuredClone(state)
  expect(function () {
    reservePoolTables(state, 1, [1], 4, [state])
  }).toThrow('fin de toutes')
  expect(function () {
    reservePoolTables(state, 1, [], 4, [state])
  }).toThrow('fin de toutes')
  expect(state).toEqual(before)
})

it('releases a pool automatically when all its matches are resolved, including forfeits', function () {
  const state = series()
  reservePoolTables(state, 1, [1, 2], 4, [state])
  startPool(state, 1, [state])
  recordResult(state, 1, [], state.matches[0]!.player1!)
  expect(poolTableReservations(state)[0]!.completed).toBe(2)
  const remaining = state.matches.find(function (match) {
    return match.status === 'in_progress'
  })!
  recordResult(state, remaining.id, [{ score1: 11, score2: 0 }])
  expect(poolTableReservations(state)).toEqual([])
  const final = series(2, 'other')
  advancePhase(final)
  expect(
    matchStartBlock(final, final.matches[0]!, 1, [state, final])
  ).toBeNull()
})

it('plans other series only on tables outside manual pool reservations', function () {
  const state = series(),
    final = series(2, 'other')
  reservePoolTables(state, 1, [1, 2], 3, [state, final])
  advancePhase(final)
  planSchedule(
    [
      { state, earliest: '2026-10-12T08:00:00Z' },
      { state: final, earliest: '2026-10-12T08:00:00Z' }
    ],
    3
  )
  expect(final.matches[0]!.table).toBe(3)
  expect(final.matches[0]!.scheduledAt).toBe('2026-10-12T08:00:00.000Z')
})

it('keeps pending matches unplanned when all tables are reserved and preserves launched matches', function () {
  const state = series(),
    final = series(2, 'other')
  reservePoolTables(state, 1, [1], 1, [state, final])
  startPool(state, 1, [state])
  advancePhase(final)
  final.matches[0]!.table = 1
  final.matches[0]!.scheduledAt = '2026-10-12T08:00:00Z'
  const opened = structuredClone(state.matches)
  planSchedule(
    [
      { state, earliest: '2026-10-12T08:00:00Z' },
      { state: final, earliest: '2026-10-12T08:00:00Z' }
    ],
    1
  )
  expect(final.matches[0]!.table).toBeNull()
  expect(final.matches[0]!.scheduledAt).toBeNull()
  expect(state.matches).toEqual(opened)
  for (const match of state.matches)
    recordResult(state, match.id, [{ score1: 11, score2: 0 }])
  planSchedule(
    [
      { state, earliest: '2026-10-12T08:00:00Z' },
      { state: final, earliest: '2026-10-12T08:00:00Z' }
    ],
    1
  )
  expect(final.matches[0]!.table).toBe(1)
})

it('reads older snapshots without any pool table reservation', function () {
  expect(poolTableReservations(series())).toEqual([])
})
