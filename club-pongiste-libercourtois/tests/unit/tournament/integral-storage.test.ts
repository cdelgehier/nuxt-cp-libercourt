import { describe, expect, it } from 'vitest'
import {
  createIntegral,
  advancePhase,
  startMatch,
  recordResult
} from '../../../server/domains/tournament/integral'
import { integralRows } from '../../../server/domains/tournament/integral-storage'

describe('relational integral storage', function () {
  it('stores pools, members, frozen scores and both placement destinations', function () {
    const state = createIntegral(
      Array.from({ length: 3 }, function (_, index) {
        return {
          id: index + 1,
          ranking: 2000 - index * 100,
          club: null,
          identities: [String(index)],
          seed: 0,
          withdrawn: false
        }
      }),
      { pointsPerSet: 11, setsToWin: 1, handicap: false }
    )
    advancePhase(state)
    for (const match of [...state.matches]) {
      startMatch(state, match.id, { table: 1 })
      recordResult(state, match.id, [{ score1: 11, score2: 0 }])
    }
    advancePhase(state)
    const playoff = state.matches.find(function (match) {
      return match.phase === 'playoffs'
    })!
    startMatch(state, playoff.id, { table: 1 })
    recordResult(state, playoff.id, [{ score1: 11, score2: 0 }])
    advancePhase(state)
    const final = state.matches.find(function (match) {
      return match.phase === 'placement'
    })!
    startMatch(state, final.id, { table: 2 })
    recordResult(state, final.id, [{ score1: 11, score2: 0 }])
    const rows = integralRows(42, state)
    expect(rows.pools).toEqual([{ seriesId: 42, id: 1 }])
    expect(rows.members).toHaveLength(3)
    expect(
      rows.matches.find(function (match) {
        return match.id === final.id
      })
    ).toMatchObject({
      seriesId: 42,
      winnerRangeStart: 1,
      winnerRangeEnd: 1,
      loserRangeStart: 2,
      loserRangeEnd: 2,
      rules: { pointsPerSet: 11, setsToWin: 1, startScores: [0, 0] }
    })
    expect(rows.sets).toHaveLength(5)
    expect(
      rows.placements
        .map(function (entry) {
          return entry.place
        })
        .sort()
    ).toEqual([1, 2, 3])
    expect(
      rows.phases.find(function (phase) {
        return phase.name === 'finished'
      })?.current
    ).toBe(true)
  })

  it('clears sporting rows when generation is cancelled', function () {
    expect(
      Object.values(integralRows(42, null)).every(function (rows) {
        return rows.length === 0
      })
    ).toBe(true)
  })
})
