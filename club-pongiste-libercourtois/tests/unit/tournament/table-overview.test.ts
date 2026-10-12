import { expect, it } from 'vitest'
import { tableOverview } from '../../../app/utils/tournament-tables'
import type {
  ScheduledMatch,
  ScheduledPool
} from '../../../app/utils/tournament-schedule'

function match(overrides: Partial<ScheduledMatch> = {}): ScheduledMatch {
  const table = overrides.table === undefined ? 1 : overrides.table
  return {
    seriesId: 1,
    seriesName: 'Simple',
    id: 1,
    phase: 'placement',
    poolId: null,
    rangeStart: 1,
    rangeEnd: 4,
    player1Name: 'Emma',
    player2Name: 'Lucas',
    player1Club: 'Libercourt',
    player2Club: 'Lys',
    table: 1,
    tables: table === null ? [] : [table],
    scheduledAt: '2026-10-10T12:00:00Z',
    startedAt: null,
    status: 'pending',
    durationMinutes: 30,
    winnerSide: null,
    score: '',
    ...overrides
  }
}
function pool(overrides: Partial<ScheduledPool> = {}): ScheduledPool {
  return {
    seriesId: 2,
    seriesName: 'Speedy',
    poolId: 1,
    tables: [1, 2],
    status: 'reserved',
    completed: 0,
    total: 3,
    playerNames: ['Léa', 'Marc', 'Paul'],
    ...overrides
  }
}

it('shows every configured table as free when the tournament has no reservations', function () {
  expect(
    tableOverview([], [], 3).map(function (table) {
      return [table.number, table.status]
    })
  ).toEqual([
    [1, 'free'],
    [2, 'free'],
    [3, 'free']
  ])
})
it.each(['finished', 'forfeit'] as const)(
  'releases a table after a match is %s',
  function (status) {
    const tables = tableOverview([match({ status })], [], 1)
    expect(tables[0]).toMatchObject({ status: 'free', matches: [], next: null })
  }
)
it('keeps a launched match occupied regardless of its old scheduled time or estimated duration', function () {
  const tables = tableOverview(
    [
      match({
        status: 'in_progress',
        startedAt: '2026-10-10T12:05:00Z',
        durationMinutes: 1
      })
    ],
    [],
    1
  )
  expect(tables[0]).toMatchObject({ status: 'playing', conflict: false })
  expect(tables[0]!.matches[0]!.id).toBe(1)
})
it('shows the earliest planned match on a free table without marking a future reservation as playing', function () {
  const matches = [
    match({ id: 2, scheduledAt: '2026-10-10T13:00:00Z' }),
    match(),
    match({ id: 3, scheduledAt: null })
  ]
  const before = structuredClone(matches)
  expect(tableOverview(matches, [], 1)[0]).toMatchObject({
    status: 'free',
    next: { id: 1 }
  })
  expect(matches).toEqual(before)
})
it('shows both tables of a prepared pool as reserved, and leaves other tables free', function () {
  const tables = tableOverview([], [pool()], 3)
  expect(
    tables.map(function (table) {
      return table.status
    })
  ).toEqual(['reserved', 'reserved', 'free'])
  expect(tables[0]!.pools[0]!.playerNames).toEqual(['Léa', 'Marc', 'Paul'])
})
it('keeps all tables of an open pool occupied until its last result is saved', function () {
  const tables = tableOverview(
    [],
    [pool({ status: 'in_progress', completed: 2 })],
    3
  )
  expect(
    tables.map(function (table) {
      return table.status
    })
  ).toEqual(['playing', 'playing', 'free'])
  expect(tables[0]!.pools[0]).toMatchObject({ completed: 2, total: 3 })
})
it('reports occupancy conflicts between series even when their match ids are the same', function () {
  const tables = tableOverview(
    [
      match({ status: 'in_progress' }),
      match({ status: 'in_progress', seriesId: 2 })
    ],
    [],
    2
  )
  expect(tables[0]).toMatchObject({ status: 'playing', conflict: true })
  expect(tables[0]!.matches).toHaveLength(2)
})
it('counts an explicitly assigned pool sheet and its pool reservation as a single table owner', function () {
  const tables = tableOverview(
    [match({ phase: 'pools', poolId: 1, seriesId: 2, status: 'in_progress' })],
    [pool({ status: 'in_progress' })],
    2
  )
  expect(tables[0]).toMatchObject({
    status: 'playing',
    conflict: false,
    matches: []
  })
})
it('does not invent a table for open pool sheets or unassigned pools', function () {
  const tables = tableOverview(
    [match({ phase: 'pools', poolId: 1, table: null, status: 'in_progress' })],
    [pool({ tables: [], status: 'in_progress' })],
    1
  )
  expect(tables[0]).toMatchObject({ status: 'free', pools: [], matches: [] })
})
