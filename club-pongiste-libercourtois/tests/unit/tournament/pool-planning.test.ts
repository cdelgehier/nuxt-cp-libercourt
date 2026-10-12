import { expect, it, vi } from 'vitest'
import {
  advancePhase,
  createIntegral,
  planSchedule,
  recordResult
} from '../../../server/domains/tournament/integral'
import { reservePoolTables } from '../../../server/domains/tournament/pool-tables'
import { startPool } from '../../../server/domains/tournament/pool-start'

function series(count = 3, prefix = 'pool') {
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
    { pointsPerSet: 11, setsToWin: 1, handicap: false }
  )
}

it('plans a whole pool at the series start without individual table assignments', function () {
  const state = series()
  planSchedule([{ state, earliest: '2026-10-14T10:00:00Z' }], 2)
  expect(
    state.matches.map(function (match) {
      return [match.table, match.scheduledAt]
    })
  ).toEqual(Array(3).fill([null, '2026-10-14T10:00:00.000Z']))
  expect(state.phase).toBe('ready')
})

it('uses table capacity for successive pools and player rest across series', function () {
  const state = series(6)
  const final = series(2, 'final')
  advancePhase(final)
  planSchedule(
    [
      { state, earliest: '2026-10-14T07:00:00Z' },
      { state: final, earliest: '2026-10-14T07:00:00Z' }
    ],
    1
  )
  expect(
    state.matches
      .filter(function (match) {
        return match.poolId === 1
      })
      .map(function (match) {
        return match.scheduledAt
      })
  ).toEqual(Array(3).fill('2026-10-14T07:00:00.000Z'))
  expect(
    state.matches
      .filter(function (match) {
        return match.poolId === 2
      })
      .map(function (match) {
        return match.scheduledAt
      })
  ).toEqual(Array(3).fill('2026-10-14T08:30:00.000Z'))
  expect(final.matches[0]!.scheduledAt).toBe('2026-10-14T10:00:00.000Z')
})

it('plans a four-player pool on two reserved tables and keeps rest for a shared player', function () {
  const state = series(4)
  const final = series(2)
  advancePhase(final)
  reservePoolTables(state, 1, [1, 2], 3, [state, final])
  planSchedule(
    [
      { state, earliest: '2026-10-14T07:00:00Z' },
      { state: final, earliest: '2026-10-14T07:00:00Z' }
    ],
    3
  )
  expect(state.matches[0]!.scheduledAt).toBe('2026-10-14T07:00:00.000Z')
  expect(final.matches[0]!.table).toBe(3)
  expect(final.matches[0]!.scheduledAt).toBe('2026-10-14T08:40:00.000Z')
})

it('does not assume two simultaneous matches are possible in a three-player pool', function () {
  const state = series()
  const final = series(2)
  advancePhase(final)
  reservePoolTables(state, 1, [1, 2], 3, [state, final])
  planSchedule(
    [
      { state, earliest: '2026-10-14T07:00:00Z' },
      { state: final, earliest: '2026-10-14T07:00:00Z' }
    ],
    3
  )
  expect(final.matches[0]!.scheduledAt).toBe('2026-10-14T08:40:00.000Z')
})

it('preserves the forecast when launching a pool and keeps launched and finished sheets on replan', function () {
  const state = series()
  const start = '2026-10-14T07:00:00Z'
  planSchedule([{ state, earliest: start }], 1)
  startPool(state, 1, [state], {}, '2026-10-14T07:05:00Z')
  expect(state.matches[0]!.scheduledAt).toBe('2026-10-14T07:00:00.000Z')
  const before = structuredClone(state.matches)
  planSchedule([{ state, earliest: '2026-10-14T09:00:00Z' }], 1)
  expect(state.matches).toEqual(before)
})

it('respects chronological series order and leaves pools unplanned while every table is occupied', function () {
  const late = series(3, 'late')
  const early = series(3, 'early')
  planSchedule(
    [
      { state: late, earliest: '2026-10-14T08:00:00Z' },
      { state: early, earliest: '2026-10-14T07:00:00Z' }
    ],
    1
  )
  expect(early.matches[0]!.scheduledAt).toBe('2026-10-14T07:00:00.000Z')
  expect(late.matches[0]!.scheduledAt).toBe('2026-10-14T08:30:00.000Z')
  reservePoolTables(early, 1, [1], 1, [early, late])
  startPool(early, 1, [early], {}, '2026-10-14T07:00:00Z')
  const before = structuredClone(early.matches)
  planSchedule(
    [
      { state: late, earliest: '2026-10-14T08:00:00Z' },
      { state: early, earliest: '2026-10-14T07:00:00Z' }
    ],
    1
  )
  expect(
    late.matches.every(function (match) {
      return match.scheduledAt === null
    })
  ).toBe(true)
  expect(early.matches).toEqual(before)
})

it('releases a completed pool table while preserving player rest across series', function () {
  const state = series()
  const shared = series(2)
  const independent = series(2, 'other')
  advancePhase(shared)
  advancePhase(independent)
  reservePoolTables(state, 1, [1], 2, [state])
  startPool(state, 1, [state], {}, '2026-10-14T07:00:00Z')
  vi.useFakeTimers()
  try {
    vi.setSystemTime(new Date('2026-10-14T08:30:00Z'))
    for (const match of state.matches)
      recordResult(state, match.id, [{ score1: 11, score2: 0 }])
    const before = structuredClone(state.matches)
    planSchedule(
      [
        { state, earliest: '2026-10-14T07:00:00Z' },
        { state: shared, earliest: '2026-10-14T08:30:00Z' },
        { state: independent, earliest: '2026-10-14T08:30:00Z' }
      ],
      2
    )
    expect(shared.matches[0]!.scheduledAt).toBe('2026-10-14T08:40:00.000Z')
    expect(independent.matches[0]!.scheduledAt).toBe('2026-10-14T08:30:00.000Z')
    expect(state.matches).toEqual(before)
  } finally {
    vi.useRealTimers()
  }
})
