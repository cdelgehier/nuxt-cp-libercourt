import { expect, it } from 'vitest'
import {
  filterSchedule,
  groupSchedule,
  matchTimeLabel,
  scheduleGrid
} from '../../../app/utils/tournament-schedule'
import type {
  ScheduledMatch,
  ScheduledPool,
  ScheduleFilters
} from '../../../app/utils/tournament-schedule'

it('keeps manual pool reservations visible on tables across series filters', function () {
  const pool: ScheduledPool = {
    seriesId: 2,
    seriesName: 'Speedy',
    poolId: 1,
    tables: [2],
    status: 'in_progress',
    completed: 1,
    total: 3,
    playerNames: ['Léa', 'Marc', 'Paul']
  }
  const grid = scheduleGrid([match()], 2, { seriesId: 1 }, [pool])
  expect(grid.days[0]!.rows[0]!.cells[1]!.pools).toEqual([pool])
})

it('flags a forecast conflict with a reserved pool without double-counting its own sheets', function () {
  const pool: ScheduledPool = {
    seriesId: 1,
    seriesName: 'Simple',
    poolId: 1,
    tables: [1],
    status: 'in_progress',
    completed: 1,
    total: 3,
    playerNames: ['Emma', 'Lucas', 'Léa']
  }
  expect(
    scheduleGrid([match()], 1, {}, [pool]).days[0]!.rows[0]!.cells[0]!.conflict
  ).toBe(true)
  const ownSheets = [
    match({ phase: 'pools', poolId: 1, status: 'in_progress' }),
    match({ id: 2, phase: 'pools', poolId: 1, status: 'in_progress' })
  ]
  const ownCell = scheduleGrid(ownSheets, 1, {}, [pool]).days[0]!.rows[0]!
    .cells[0]!
  expect(ownCell.conflict).toBe(false)
  expect(ownCell.entries).toHaveLength(2)
})

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
    player1Name: 'Emma Delgehier',
    player2Name: 'Lucas Martin / Léa Dupont',
    player1Club: 'Libercourt',
    player2Club: 'Lys-lez-Lannoy',
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

it('labels an unplanned pool with its real launch time in Paris', function () {
  const poolMatch = match({
    phase: 'pools',
    poolId: 1,
    scheduledAt: null,
    startedAt: '2026-10-12T09:45:00Z',
    status: 'in_progress'
  })

  expect(matchTimeLabel(poolMatch)).toBe('Lancé à 11:45')
  expect(matchTimeLabel(poolMatch, true)).toBe('Lancé le 12/10 à 11:45')
  expect(groupSchedule([poolMatch])[0]!.timeLabel).toBe('11:45')
})

it('shows the real launch and original forecast without changing the schedule', function () {
  const plannedMatch = match({
    scheduledAt: '2026-10-12T10:00:00Z',
    startedAt: '2026-10-12T10:05:00Z',
    status: 'in_progress'
  })
  const before = structuredClone(plannedMatch)

  expect(matchTimeLabel(plannedMatch)).toBe('Lancé à 12:05 (prévu à 12:00)')
  expect(matchTimeLabel(plannedMatch, true)).toBe(
    'Lancé le 12/10 à 12:05 (prévu à 12:00)'
  )
  expect(groupSchedule([plannedMatch])[0]!.timeLabel).toBe('12:05')
  expect(plannedMatch).toEqual(before)
})

it('labels a pending forecast and keeps the date when launch happens on another day', function () {
  const pending = match({ scheduledAt: '2026-10-14T07:00:00Z' })
  expect(matchTimeLabel(pending)).toBe('Prévu à 09:00')
  const launched = match({
    scheduledAt: '2026-10-14T07:00:00Z',
    startedAt: '2026-10-15T07:00:00Z'
  })
  expect(matchTimeLabel(launched)).toBe(
    'Lancé à 09:00 (prévu le 14/10 à 09:00)'
  )
})

it('leaves matches without a valid planned or launch time without a label', function () {
  expect(matchTimeLabel(match({ scheduledAt: null }))).toBe('')
  expect(matchTimeLabel(match({ scheduledAt: 'invalid' }))).toBe('')
})

it('combines series, time, player or club search and upcoming status filters', function () {
  const matches = [
    match(),
    match({ id: 2, status: 'finished' }),
    match({ id: 3, seriesId: 2 }),
    match({ id: 4, scheduledAt: '2026-10-10T12:40:00Z' }),
    match({ id: 5, status: 'in_progress' }),
    match({ id: 6, status: 'forfeit' })
  ]
  const filtered = filterSchedule(matches, {
    seriesId: 1,
    time: '2026-10-10T12:00:00.000Z',
    search: 'lea dupont',
    upcoming: true
  })
  expect(
    filtered.map(function (entry) {
      return entry.id
    })
  ).toEqual([1, 5])
  expect(filterSchedule(matches, { search: 'lys-lez-lannoy' })).toHaveLength(6)
})

it('groups actual start times across series, uses Paris time and keeps unplanned matches last', function () {
  const matches = [
    match({ id: 3, scheduledAt: null }),
    match({ seriesId: 2, scheduledAt: '2026-10-10T12:40:00Z' }),
    match({ table: 2 }),
    match({ seriesId: 3, scheduledAt: '2026-10-10T14:00:00+02:00' }),
    match({ id: 4, scheduledAt: null, startedAt: '2026-10-10T13:00:00Z' })
  ]
  const before = structuredClone(matches)
  const groups = groupSchedule(matches)
  expect(
    groups.map(function (entry) {
      return entry.timeLabel
    })
  ).toEqual(['14:00', '14:40', '15:00', 'Sans horaire'])
  expect(
    groups[0]!.matches.map(function (entry) {
      return entry.seriesId
    })
  ).toEqual([3, 1])
  expect(groups[0]!.dateLabel).toContain('10 octobre 2026')
  expect(matches).toEqual(before)
})

it('keeps matches without a table in a separate grid column and lists configured empty tables', function () {
  const grid = scheduleGrid(
    [match(), match({ id: 2, table: null, phase: 'pools', poolId: 1 })],
    3
  )
  expect(grid.tables).toEqual([1, 2, 3, null])
  const cells = grid.days[0]!.rows[0]!.cells
  expect(
    cells.map(function (entry) {
      return entry.entries.length
    })
  ).toEqual([1, 0, 0, 1])
  expect(cells[3]!.conflict).toBe(false)
})

it('shows a reservation across every occupied half-hour and excludes its exact end', function () {
  const grid = scheduleGrid(
    [match({ scheduledAt: '2026-10-10T12:10:00Z', durationMinutes: 80 })],
    2
  )
  const rows = grid.days[0]!.rows
  expect(
    rows.map(function (row) {
      return row.timeLabel
    })
  ).toEqual(['14:00', '14:30', '15:00'])
  expect(
    rows.map(function (row) {
      return row.cells[0]!.entries[0]!.continuation
    })
  ).toEqual([false, true, true])
})

it('flags real table overlaps across series without flagging consecutive matches or unassigned pools', function () {
  const grid = scheduleGrid(
    [
      match(),
      match({ seriesId: 2, scheduledAt: '2026-10-10T12:20:00Z' }),
      match({ seriesId: 3, table: 2 }),
      match({ seriesId: 4, table: 2, scheduledAt: '2026-10-10T12:30:00Z' }),
      match({ id: 2, table: null }),
      match({ id: 3, table: null })
    ],
    2
  )
  expect(
    grid.days[0]!.rows[0]!.cells.map(function (cell) {
      return cell.conflict
    })
  ).toEqual([true, false, false])
  expect(grid.days[0]!.rows[1]!.cells[0]!.conflict).toBe(false)
})

it('preserves free half-hours between reservations', function () {
  const grid = scheduleGrid(
    [match(), match({ id: 2, scheduledAt: '2026-10-10T13:30:00Z' })],
    1
  )
  expect(
    grid.days[0]!.rows.map(function (row) {
      return row.cells[0]!.entries.length
    })
  ).toEqual([1, 0, 0, 1])
})

it.each<ScheduleFilters>([{ seriesId: 1 }, { search: 'Emma' }])(
  'keeps conflicts with a reservation outside the display filter %j',
  function (filters) {
    const grid = scheduleGrid(
      [
        match(),
        match({
          seriesId: 2,
          player1Name: 'Alice Martin',
          player2Name: 'Bob Dupont',
          scheduledAt: '2026-10-10T12:10:00Z'
        })
      ],
      1,
      filters
    )
    const cell = grid.days[0]!.rows[0]!.cells[0]!

    expect(cell.conflict).toBe(true)
    expect(
      cell.entries.map(function (entry) {
        return entry.match.seriesId
      })
    ).toEqual([1])
    expect(cell.hiddenCount).toBe(1)
  }
)

it('marks another series reservation instead of calling its table free', function () {
  const grid = scheduleGrid([match(), match({ seriesId: 2, table: 2 })], 2, {
    seriesId: 1
  })
  const otherTable = grid.days[0]!.rows[0]!.cells[1]!

  expect(otherTable.entries).toEqual([])
  expect(otherTable.hiddenCount).toBe(1)
  expect(otherTable.conflict).toBe(false)
})

it('does not reserve a table for a forfeited match hidden by the upcoming filter', function () {
  const grid = scheduleGrid(
    [match(), match({ seriesId: 2, status: 'forfeit' })],
    1,
    { upcoming: true }
  )
  const cell = grid.days[0]!.rows[0]!.cells[0]!

  expect(cell.conflict).toBe(false)
  expect(cell.hiddenCount).toBe(0)
  expect(cell.entries).toHaveLength(1)
})

it('keeps the selected series time window and unplanned list after adding occupancy context', function () {
  const selected = match({ id: 3, table: null, scheduledAt: null })
  const grid = scheduleGrid(
    [
      match(),
      selected,
      match({ seriesId: 2, scheduledAt: '2026-10-11T12:00:00Z' }),
      match({ seriesId: 2, id: 3, table: null, scheduledAt: null })
    ],
    2,
    { seriesId: 1 }
  )

  expect(
    grid.days.map(function (day) {
      return day.key
    })
  ).toEqual(['2026-10-10'])
  expect(grid.unplanned).toEqual([selected])
})

it('separates Paris calendar days and carries reservations across midnight', function () {
  const grid = scheduleGrid(
    [match({ scheduledAt: '2026-10-10T21:50:00Z', durationMinutes: 30 })],
    1
  )
  expect(
    grid.days.map(function (day) {
      return day.key
    })
  ).toEqual(['2026-10-10', '2026-10-11'])
  expect(grid.days[0]!.rows[0]!.timeLabel).toBe('23:30')
  expect(grid.days[1]!.rows[0]!.timeLabel).toBe('00:00')
  expect(grid.days[1]!.rows[0]!.cells[0]!.entries[0]!.continuation).toBe(true)
})

it('retains unplanned matches without inventing a time or table', function () {
  const matches = [
    match({ scheduledAt: null, table: null }),
    match({ id: 2, scheduledAt: 'invalid' })
  ]
  expect(groupSchedule(matches)[0]!.key).toBe('unplanned')
  expect(filterSchedule(matches, { time: 'unplanned' })).toHaveLength(2)
  expect(scheduleGrid(matches, 3).days).toEqual([])
  expect(scheduleGrid(matches, 3).unplanned).toEqual(matches)
})
