import { describe, expect, it } from 'vitest'
import {
  createIntegral,
  advancePhase,
  recordResult,
  startMatch,
  poolStandings,
  handicapStart,
  planSchedule,
  swapPoolPlayers,
  seriesEarliest
} from '../../../server/domains/tournament/integral'
import type {
  Entrant,
  IntegralState
} from '../../../server/domains/tournament/integral'

function entrants(count: number): Entrant[] {
  return Array.from({ length: count }, function (_, index) {
    return {
      id: index + 1,
      ranking: 2000 - index * 50,
      club: `Club ${index % 4}`,
      identities: [`licence:${index + 1}`],
      withdrawn: false,
      seed: index + 1
    }
  })
}
function finishReady(state: IntegralState): void {
  let ready = state.matches.find(function (match) {
    return (
      match.status === 'pending' &&
      match.player1 !== null &&
      match.player2 !== null
    )
  })
  while (ready) {
    startMatch(state, ready.id, { table: 1 })
    recordResult(state, ready.id, [{ score1: 11, score2: 0 }])
    ready = state.matches.find(function (match) {
      return (
        match.status === 'pending' &&
        match.player1 !== null &&
        match.player2 !== null
      )
    })
  }
}
describe('integral sporting progression', function () {
  it.each(
    Array.from({ length: 31 }, function (_, index) {
      return index + 2
    })
  )('assigns every place exactly once for %i entrants', function (count) {
    const state = createIntegral(entrants(count), {
      pointsPerSet: 11,
      setsToWin: 1,
      handicap: false
    })
    advancePhase(state)
    finishReady(state)
    while (state.phase !== 'finished') {
      advancePhase(state)
      finishReady(state)
    }
    expect(Object.keys(state.placements)).toHaveLength(count)
    expect(
      Object.values(state.placements).sort(function (a, b) {
        return a - b
      })
    ).toEqual(
      Array.from({ length: count }, function (_, i) {
        return i + 1
      })
    )
  })
  it('creates eight pools and eight playoffs for 24 entrants', function () {
    const state = createIntegral(entrants(24), {
      pointsPerSet: 11,
      setsToWin: 1,
      handicap: false
    })
    expect(
      state.pools.map(function (pool) {
        return pool.players.length
      })
    ).toEqual(Array(8).fill(3))
    advancePhase(state)
    finishReady(state)
    advancePhase(state)
    expect(
      state.matches.filter(function (match) {
        return match.phase === 'playoffs'
      })
    ).toHaveLength(8)
    finishReady(state)
    advancePhase(state)
    expect(
      state.matches.some(function (match) {
        return match.rangeStart === 1 && match.rangeEnd === 16
      })
    ).toBe(true)
    expect(
      state.matches.some(function (match) {
        return match.rangeStart === 17 && match.rangeEnd === 24
      })
    ).toBe(true)
  })
  it('prevents pool swaps after starting', function () {
    const state = createIntegral(entrants(6), {
      pointsPerSet: 11,
      setsToWin: 1,
      handicap: false
    })
    swapPoolPlayers(state, 1, 2)
    advancePhase(state)
    expect(function () {
      swapPoolPlayers(state, 1, 2)
    }).toThrow()
  })
  it('requires all phase results and validates residual ties manually', function () {
    const state = createIntegral(entrants(3), {
      pointsPerSet: 11,
      setsToWin: 1,
      handicap: false
    })
    advancePhase(state)
    expect(function () {
      advancePhase(state)
    }).toThrow()
    const results = [
      [11, 0],
      [0, 11],
      [11, 0]
    ]
    for (const [i, match] of state.matches.entries()) {
      startMatch(state, match.id, { table: 1 })
      recordResult(state, match.id, [
        { score1: results[i]![0]!, score2: results[i]![1]! }
      ])
    }
    expect(poolStandings(state, state.pools[0]!)[0]!.tied).toBe(true)
    expect(function () {
      advancePhase(state)
    }).toThrow()
    advancePhase(state, { poolOrders: { '1': [1, 2, 3] } })
    expect(state.phase).toBe('playoffs')
  })
  it('preserves JA arbitration when a corrected score leaves the residual tie unchanged', function () {
    const state = createIntegral(entrants(3), {
      pointsPerSet: 11,
      setsToWin: 1,
      handicap: false
    })
    advancePhase(state)
    for (const [i, match] of state.matches.entries()) {
      startMatch(state, match.id, { table: 1 })
      recordResult(state, match.id, [
        { score1: i === 1 ? 0 : 11, score2: i === 1 ? 11 : 0 }
      ])
    }
    advancePhase(state, { poolOrders: { '1': [2, 1, 3] } })
    const first = state.matches[0]!
    recordResult(state, first.id, first.sets)
    expect(state.poolOrders['1']).toEqual([2, 1, 3])
  })

  it('rejects participant-changing corrections after either downstream path starts', function () {
    const state = createIntegral(entrants(8), {
      pointsPerSet: 11,
      setsToWin: 1,
      handicap: false
    })
    advancePhase(state)
    finishReady(state)
    advancePhase(state)
    finishReady(state)
    advancePhase(state)
    const first = state.matches.find(function (match) {
      return match.phase === 'placement' && match.player1 && match.player2
    })!
    startMatch(state, first.id, { table: 1 })
    recordResult(state, first.id, [{ score1: 11, score2: 0 }])
    finishReady(state)
    const before = JSON.stringify(state)
    expect(function () {
      recordResult(state, first.id, [{ score1: 0, score2: 11 }])
    }).toThrow()
    expect(JSON.stringify(state)).toBe(before)
  })
  it('preserves a prior forfeit victory when its winner later withdraws', function () {
    const state = createIntegral(entrants(3), {
      pointsPerSet: 11,
      setsToWin: 1,
      handicap: false
    })
    advancePhase(state)
    const first = state.matches[0]!
    recordResult(state, first.id, [], first.player1!)
    const next = state.matches.find(
      match => match.status === 'pending' && match.player1 === first.player1
    )!
    recordResult(state, next.id, [], next.player2!)
    const standing = poolStandings(state, state.pools[0]!).find(
      row => row.id === first.player1
    )!
    expect(standing.points).toBe(2)
  })
  it('withdraws a player only in this series and resolves future matches', function () {
    const state = createIntegral(entrants(6), {
      pointsPerSet: 11,
      setsToWin: 1,
      handicap: false
    })
    advancePhase(state)
    const match = state.matches[0]!
    recordResult(state, match.id, [], match.player2!)
    expect(
      state.entrants.find(function (entry) {
        return entry.id === match.player1
      })!.withdrawn
    ).toBe(true)
    finishReady(state)
    advancePhase(state)
    finishReady(state)
    advancePhase(state)
    finishReady(state)
    expect(state.phase).toBe('finished')
    expect(Object.keys(state.placements)).toHaveLength(6)
  })
})
describe('match rules', function () {
  it.each([
    [99, 0],
    [100, 1],
    [250, 2],
    [900, 7]
  ])('computes advance for difference %i', function (difference, advance) {
    expect(handicapStart(1000, 1000 + difference, 11)).toEqual([advance, 0])
  })
  it('caps under the target and rejects unknown rankings', function () {
    expect(handicapStart(0, 1000, 3)).toEqual([2, 0])
    expect(function () {
      handicapStart(null, 1000, 11)
    }).toThrow()
  })
  it('freezes a manual handicap and rejects scores below its advance', function () {
    const state = createIntegral(entrants(2), {
      pointsPerSet: 11,
      setsToWin: 1,
      handicap: true
    })
    advancePhase(state)
    const match = state.matches[0]!
    startMatch(state, match.id, { table: 1, startScores: [0, 4] })
    expect(function () {
      recordResult(state, match.id, [{ score1: 11, score2: 3 }])
    }).toThrow()
    recordResult(state, match.id, [{ score1: 11, score2: 4 }])
    expect(match.rules!.startScores).toEqual([0, 4])
  })
  it('plays a configurable speedy match with exact deuce and no extra sets', function () {
    const state = createIntegral(entrants(2), {
      pointsPerSet: 5,
      setsToWin: 2,
      handicap: false
    })
    advancePhase(state)
    startMatch(state, state.matches[0]!.id, { table: 1 })
    expect(function () {
      recordResult(state, state.matches[0]!.id, [
        { score1: 7, score2: 4 },
        { score1: 5, score2: 0 }
      ])
    }).toThrow()
    expect(function () {
      recordResult(state, state.matches[0]!.id, [
        { score1: 5, score2: 0 },
        { score1: 5, score2: 1 },
        { score1: 5, score2: 2 }
      ])
    }).toThrow()
    recordResult(state, state.matches[0]!.id, [
      { score1: 6, score2: 4 },
      { score1: 5, score2: 1 }
    ])
    expect(state.phase).toBe('finished')
  })
})
describe('additional match boundaries', function () {
  it('uses equal rankings with zero advance and a manual advance with unknown rankings', function () {
    expect(handicapStart(1000, 1000, 11)).toEqual([0, 0])
    const entries = entrants(2)
    entries[0]!.ranking = null
    const state = createIntegral(entries, {
      pointsPerSet: 3,
      setsToWin: 2,
      handicap: true
    })
    advancePhase(state)
    startMatch(state, state.matches[0]!.id, { table: 1, startScores: [0, 2] })
    expect(function () {
      recordResult(state, state.matches[0]!.id, [
        { score1: 3, score2: 2 },
        { score1: 3, score2: 2 }
      ])
    }).toThrow()
    recordResult(state, state.matches[0]!.id, [
      { score1: 4, score2: 2 },
      { score1: 4, score2: 2 }
    ])
    expect(state.phase).toBe('finished')
  })
  it('rejects an advance for the stronger player and an excessive manual advance', function () {
    const state = createIntegral(entrants(2), {
      pointsPerSet: 3,
      setsToWin: 1,
      handicap: true
    })
    advancePhase(state)
    expect(function () {
      startMatch(state, state.matches[0]!.id, { table: 1, startScores: [1, 0] })
    }).toThrow()
    expect(function () {
      startMatch(state, state.matches[0]!.id, { table: 1, startScores: [0, 3] })
    }).toThrow()
  })
  it('keeps the frozen rules when series rules change and checks every set advance', function () {
    const state = createIntegral(entrants(2), {
      pointsPerSet: 11,
      setsToWin: 2,
      handicap: true
    })
    advancePhase(state)
    startMatch(state, state.matches[0]!.id, { table: 1, startScores: [0, 4] })
    state.rules.pointsPerSet = 3
    expect(function () {
      recordResult(state, state.matches[0]!.id, [
        { score1: 11, score2: 4 },
        { score1: 11, score2: 3 }
      ])
    }).toThrow()
    recordResult(state, state.matches[0]!.id, [
      { score1: 11, score2: 4 },
      { score1: 11, score2: 4 }
    ])
    expect(state.matches[0]!.rules!.pointsPerSet).toBe(11)
  })
  it('rejects a shared player identity within one match', function () {
    const entries = entrants(2)
    entries[1]!.identities = [...entries[0]!.identities]
    const state = createIntegral(entries, {
      pointsPerSet: 11,
      setsToWin: 1,
      handicap: false
    })
    advancePhase(state)
    expect(function () {
      startMatch(state, state.matches[0]!.id, { table: 1 })
    }).toThrow()
  })
  it('rebuilds winner and loser placement paths before dependent matches start', function () {
    const state = createIntegral(entrants(6), {
      pointsPerSet: 11,
      setsToWin: 1,
      handicap: false
    })
    advancePhase(state)
    finishReady(state)
    advancePhase(state)
    finishReady(state)
    advancePhase(state)
    const match = state.matches.find(entry => entry.phase === 'placement')!
    startMatch(state, match.id, { table: 1 })
    recordResult(state, match.id, [{ score1: 11, score2: 0 }])
    recordResult(state, match.id, [{ score1: 0, score2: 11 }])
    finishReady(state)
    expect(state.phase).toBe('finished')
    expect(Object.values(state.placements).sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6
    ])
  })
})

describe('planning', function () {
  it('respects a series start time in the club timezone in summer and winter', function () {
    expect(seriesEarliest('2026-10-10', '09:00', '2026-10-10T00:00:00Z')).toBe(
      '2026-10-10T07:00:00.000Z'
    )
    expect(seriesEarliest('2026-12-10', '09:00', '2026-12-10T00:00:00Z')).toBe(
      '2026-12-10T08:00:00.000Z'
    )
  })
  it('shares player identities between singles and doubles and enforces rest', function () {
    const singles = createIntegral(entrants(2), {
      pointsPerSet: 11,
      setsToWin: 1,
      handicap: false
    })
    advancePhase(singles)
    const pairs = entrants(2)
    pairs[0]!.identities.push('partner:1')
    const doubles = createIntegral(pairs, {
      pointsPerSet: 11,
      setsToWin: 1,
      handicap: false
    })
    advancePhase(doubles)
    planSchedule(
      [
        { state: singles, earliest: '2026-10-10T08:00:00Z' },
        { state: doubles, earliest: '2026-10-10T08:00:00Z' }
      ],
      2,
      30,
      10
    )
    expect(
      new Date(doubles.matches[0]!.scheduledAt!).getTime() -
        new Date(singles.matches[0]!.scheduledAt!).getTime()
    ).toBe(40 * 60000)
    const original = singles.matches[0]!.scheduledAt
    startMatch(singles, singles.matches[0]!.id, { table: 1 })
    planSchedule(
      [{ state: singles, earliest: '2026-10-10T08:00:00Z' }],
      2,
      30,
      10
    )
    expect(singles.matches[0]!.scheduledAt).toBe(original)
  })
})
