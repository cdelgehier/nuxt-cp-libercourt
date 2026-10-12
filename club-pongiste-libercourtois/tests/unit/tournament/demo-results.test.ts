import { describe, expect, it } from 'vitest'
import {
  advancePhase,
  createIntegral,
  startMatch,
  recordResult
} from '../../../server/domains/tournament/integral'
import { simulateDemoMatches } from '../../../server/domains/tournament/demo-results'

const entrants = Array.from({ length: 10 }, function (_, index) {
  return {
    id: index + 1,
    ranking: 2000 - index * 150,
    club: null,
    identities: [`demo:${index}`],
    withdrawn: false,
    seed: index + 1
  }
})

describe('demo match results', function () {
  it('starts and finishes a prepared pool without changing the other pools', function () {
    const state = createIntegral(entrants, {
      pointsPerSet: 11,
      setsToWin: 3,
      handicap: false
    })
    const count = simulateDemoMatches(state, { poolId: 1 }, 4)
    expect(count).toBe(3)
    expect(state.phase).toBe('pools')
    expect(
      state.matches
        .filter(function (match) {
          return match.poolId === 1
        })
        .every(function (match) {
          return (
            match.status === 'finished' &&
            match.table === null &&
            match.sets.length >= 3
          )
        })
    ).toBe(true)
    expect(
      state.matches
        .filter(function (match) {
          return match.poolId !== 1
        })
        .every(function (match) {
          return match.status === 'pending'
        })
    ).toBe(true)
  })

  it('keeps recorded scores and frozen handicap rules when completing a partly played pool', function () {
    const state = createIntegral(entrants.slice(0, 3), {
      pointsPerSet: 3,
      setsToWin: 2,
      handicap: true
    })
    advancePhase(state)
    startMatch(state, 1, { startScores: [0, 1] })
    recordResult(state, 1, [
      { score1: 3, score2: 1 },
      { score1: 3, score2: 1 }
    ])
    startMatch(state, 2, { startScores: [0, 2] })
    const previous = structuredClone(state.matches[0])
    expect(simulateDemoMatches(state, { poolId: 1 }, 4)).toBe(2)
    expect(state.matches[0]).toEqual(previous)
    expect(state.matches[1]!.rules!.startScores).toEqual([0, 2])
    expect(
      state.matches.every(function (match) {
        return match.status === 'finished'
      })
    ).toBe(true)
  })

  it.each([
    [11, 3, false],
    [3, 1, false],
    [5, 2, true],
    [2, 1, true]
  ] as const)(
    'produces valid scores and unique places for rules %i/%i/%s',
    function (pointsPerSet, setsToWin, handicap) {
      const state = createIntegral(entrants, {
        pointsPerSet,
        setsToWin,
        handicap
      })
      for (const pool of state.pools)
        simulateDemoMatches(state, { poolId: pool.id }, 4)
      advancePhase(state)
      for (const match of [...state.matches].filter(function (entry) {
        return entry.phase === 'playoffs' && entry.status === 'pending'
      })) {
        simulateDemoMatches(state, { matchId: match.id }, 4)
      }
      advancePhase(state)
      while (state.phase !== 'finished') {
        const match = state.matches.find(function (entry) {
          return entry.phase === 'placement' && entry.status === 'pending'
        })!
        expect(match).toBeDefined()
        simulateDemoMatches(state, { matchId: match.id }, 4)
      }
      expect(
        Object.values(state.placements).sort(function (a, b) {
          return a - b
        })
      ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      expect(
        state.matches
          .filter(function (match) {
            return match.phase !== 'pools'
          })
          .every(function (match) {
            return match.table !== null && match.table >= 1 && match.table <= 4
          })
      ).toBe(true)
    }
  )

  it('rejects finished matches and absent pools without changing the snapshot', function () {
    const state = createIntegral(entrants.slice(0, 3), {
      pointsPerSet: 11,
      setsToWin: 1,
      handicap: false
    })
    simulateDemoMatches(state, { matchId: 1 }, 4)
    const previous = structuredClone(state)
    expect(function () {
      simulateDemoMatches(state, { matchId: 1 }, 4)
    }).toThrow()
    expect(function () {
      simulateDemoMatches(state, { poolId: 99 }, 4)
    }).toThrow()
    expect(state).toEqual(previous)
  })

  it('requires a manual advance for a pending handicap match with a missing ranking', function () {
    const state = createIntegral(
      [{ ...entrants[0]!, ranking: null }, entrants[1]!, entrants[2]!],
      { pointsPerSet: 11, setsToWin: 1, handicap: true }
    )
    const previous = structuredClone(state)
    expect(function () {
      simulateDemoMatches(state, { poolId: 1 }, 4)
    }).toThrow(/Classement manquant/)
    expect(state).toEqual(previous)
    advancePhase(state)
    startMatch(state, 1, { startScores: [0, 0] })
    expect(simulateDemoMatches(state, { matchId: 1 }, 4)).toBe(1)
  })
})
