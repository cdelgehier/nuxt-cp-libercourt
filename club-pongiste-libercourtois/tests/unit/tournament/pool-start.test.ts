import { describe, expect, it } from 'vitest'
import {
  advancePhase,
  createIntegral,
  planSchedule,
  recordResult,
  startMatch
} from '../../../server/domains/tournament/integral'
import {
  matchStartBlock,
  startPool
} from '../../../server/domains/tournament/pool-start'

function poolState(count = 3, handicap = false, prepared = false) {
  const state = createIntegral(
    Array.from({ length: count }, function (_, index) {
      return {
        id: index + 1,
        ranking: 1500 - index * 100,
        club: null,
        identities: [`licence:${index + 1}`],
        withdrawn: false,
        seed: index + 1
      }
    }),
    { pointsPerSet: 11, setsToWin: 1, handicap }
  )
  if (!prepared) advancePhase(state)
  return state
}

describe('pool launch without mandatory table allocation', function () {
  it('does not reserve a physical table for open pool sheets', function () {
    const state = poolState(),
      final = poolState(2),
      start = '2026-10-12T08:00:00Z'
    final.entrants.forEach(function (entry) {
      entry.identities = [`other:${entry.id}`]
    })
    startPool(state, 1, [state], {}, start)
    const opened = structuredClone(state.matches)

    planSchedule(
      [
        { state, earliest: start },
        { state: final, earliest: start }
      ],
      1,
      30,
      10,
      Date.parse(start)
    )

    expect(final.matches[0]!.table).toBe(1)
    expect(final.matches[0]!.scheduledAt).toBe('2026-10-12T08:00:00.000Z')
    expect(state.matches).toEqual(opened)
  })

  it('keeps player rest across series when an open pool has no table', function () {
    const state = poolState(),
      final = poolState(2),
      start = '2026-10-12T08:00:00Z'
    startPool(state, 1, [state], {}, start)

    planSchedule(
      [
        { state, earliest: start },
        { state: final, earliest: start }
      ],
      2,
      30,
      10,
      Date.parse(start)
    )

    expect(final.matches[0]!.scheduledAt).toBe('2026-10-12T09:40:00.000Z')
  })

  it('clears old individual pool allocations when replanning prepared sheets', function () {
    const state = poolState(3, false, true)
    state.matches[0]!.table = 2
    state.matches[0]!.scheduledAt = '2026-10-12T09:20:00Z'

    planSchedule([{ state, earliest: '2026-10-12T08:00:00Z' }], 4)

    expect(
      state.matches.every(function (match) {
        return (
          match.table === null &&
          match.scheduledAt === '2026-10-12T08:00:00.000Z'
        )
      })
    ).toBe(true)
    expect(state.phase).toBe('ready')
  })

  it('preserves the planned pool time when a pool sheet opens without a table', function () {
    const state = poolState()
    state.matches[0]!.table = 2
    state.matches[0]!.scheduledAt = '2026-10-12T09:20:00Z'

    startPool(state, 1, [state], {}, '2026-10-12T08:00:00Z')

    expect(state.matches[0]!.table).toBeNull()
    expect(state.matches[0]!.scheduledAt).toBe('2026-10-12T09:20:00Z')
    expect(state.matches[0]!.startedAt).toBe('2026-10-12T08:00:00Z')
  })

  it('blocks an explicit occupied table even within the same pool after all confirmations', function () {
    const state = poolState()
    startMatch(state, 1, { table: 2 })

    const blocked = matchStartBlock(
      state,
      state.matches[1]!,
      2,
      [state],
      Date.now(),
      true,
      true
    )

    expect(blocked?.message).toContain('occupée')
  })

  it('starts the series and its first pool in one action after pool preparation', function () {
    const state = poolState(7, false, true)
    const assignment = structuredClone(state.pools)
    startPool(state, 1, [state])
    expect(state.phase).toBe('pools')
    expect(state.pools).toEqual(assignment)
    expect(
      state.matches
        .filter(function (match) {
          return match.poolId === 1
        })
        .every(function (match) {
          return (
            match.status === 'in_progress' &&
            match.rules !== null &&
            match.table === null
          )
        })
    ).toBe(true)
    expect(
      state.matches
        .filter(function (match) {
          return match.poolId !== 1
        })
        .every(function (match) {
          return match.status === 'pending' && match.rules === null
        })
    ).toBe(true)
  })

  it('keeps prepared pools editable if the first launch requires confirmation', function () {
    const state = poolState(3, false, true),
      other = poolState()
    startMatch(other, 1)
    const before = structuredClone(state)
    expect(function () {
      startPool(state, 1, [state, other])
    }).toThrow('autre série')
    expect(state).toEqual(before)
    startPool(
      state,
      1,
      [state, other],
      {},
      new Date().toISOString(),
      false,
      true
    )
    expect(state.phase).toBe('pools')
  })

  it('does not start a series for a missing pool or an invalid handicap advance', function () {
    const state = poolState(3, true, true)
    const before = structuredClone(state)
    expect(function () {
      startPool(state, 99, [state])
    }).toThrow('Poule indisponible')
    expect(state).toEqual(before)
    expect(function () {
      startPool(state, 1, [state], { '1': [11, 0] })
    }).toThrow()
    expect(state).toEqual(before)
  })

  it.each([3, 4])(
    'opens every score sheet in a %i-player pool without tables',
    function (count) {
      const state = poolState(count)
      startPool(state, 1, [state])
      expect(
        state.matches.every(function (match) {
          return (
            match.status === 'in_progress' &&
            match.table === null &&
            match.rules !== null
          )
        })
      ).toBe(true)
      for (const match of state.matches)
        recordResult(state, match.id, [{ score1: 11, score2: 0 }])
      expect(
        state.matches.every(function (match) {
          return match.status === 'finished'
        })
      ).toBe(true)
      advancePhase(state)
      expect(state.phase).toBe('playoffs')
    }
  )

  it('adopts a launched game without changing its frozen rules or start time', function () {
    const state = poolState()
    startMatch(state, 1, { table: 2 }, '2026-10-11T10:00:00Z')
    const first = structuredClone(state.matches[0])
    startPool(state, 1, [state])
    expect(state.matches[0]).toEqual(first)
    expect(
      state.matches.every(function (match) {
        return match.status === 'in_progress'
      })
    ).toBe(true)
  })

  it('allows individual pool sheets to open while the same pool is active', function () {
    const state = poolState()
    startMatch(state, 1)
    expect(
      matchStartBlock(state, state.matches[1]!, undefined, [state])
    ).toBeNull()
    startMatch(state, 2)
    expect(state.matches[1]!.table).toBeNull()
  })

  it('does not impose tournament rest between sheets in the same pool', function () {
    const state = poolState()
    startMatch(state, 1)
    recordResult(state, 1, [{ score1: 11, score2: 0 }])
    expect(
      matchStartBlock(state, state.matches[1]!, undefined, [state])
    ).toBeNull()
  })

  it('asks for confirmation before shortening rest between series', function () {
    const state = poolState(),
      other = poolState()
    startMatch(other, 1)
    recordResult(other, 1, [{ score1: 11, score2: 0 }])
    const warning = matchStartBlock(state, state.matches[0]!, undefined, [
      state,
      other
    ])
    expect(warning?.message).toContain('10 minutes')
    expect(warning?.code).toBe('REST_CONFIRMATION_REQUIRED')
    expect(
      matchStartBlock(
        state,
        state.matches[0]!,
        undefined,
        [state, other],
        Date.now(),
        true
      )
    ).toBeNull()
  })

  it('opens a pool with short rest only after explicit confirmation', function () {
    const state = poolState(),
      other = poolState()
    startMatch(other, 1)
    recordResult(other, 1, [{ score1: 11, score2: 0 }])
    const before = structuredClone(state)
    expect(function () {
      startPool(state, 1, [state, other])
    }).toThrow('repos')
    expect(state).toEqual(before)
    startPool(state, 1, [state, other], {}, new Date().toISOString(), true)
    expect(
      state.matches.every(function (match) {
        return match.status === 'in_progress'
      })
    ).toBe(true)
    expect(state.planning).toEqual(before.planning)
  })

  it('still blocks an active doubles partner after rest confirmation', function () {
    const state = poolState(),
      other = poolState()
    other.entrants[0]!.identities = ['licence:99', 'licence:1']
    startMatch(other, 1)
    const before = structuredClone(state)
    expect(function () {
      startPool(state, 1, [state, other], {}, new Date().toISOString(), true)
    }).toThrow('autre série')
    expect(state).toEqual(before)
  })

  it('prioritizes an occupied table over a rest warning', function () {
    const state = poolState(),
      recent = poolState(),
      playing = poolState()
    startMatch(recent, 1)
    recordResult(recent, 1, [{ score1: 11, score2: 0 }])
    playing.entrants.forEach(function (entry) {
      entry.identities = [`other:${entry.id}`]
    })
    startMatch(playing, 1, { table: 2 })
    for (const confirmed of [false, true]) {
      expect(
        matchStartBlock(
          state,
          state.matches[0]!,
          2,
          [state, recent, playing],
          Date.now(),
          confirmed
        )?.message
      ).toContain('occupée')
    }
  })

  it('allows a launch after the configured rest period has elapsed', function () {
    const state = poolState(),
      other = poolState()
    startMatch(other, 1)
    recordResult(other, 1, [{ score1: 11, score2: 0 }])
    const finished = new Date(other.matches[0]!.finishedAt!).getTime()
    expect(
      matchStartBlock(
        state,
        state.matches[0]!,
        undefined,
        [state, other],
        finished + 10 * 60000
      )
    ).toBeNull()
  })

  it('blocks a player active as a doubles partner in another series atomically', function () {
    const state = poolState(),
      other = poolState()
    other.entrants[0]!.identities = ['licence:99', 'licence:1']
    other.entrants[1]!.identities = ['licence:88', 'licence:89']
    startMatch(other, 1)
    const before = structuredClone(state)
    expect(function () {
      startPool(state, 1, [state, other])
    }).toThrow('autre série')
    expect(state).toEqual(before)
  })

  it('opens a pool after confirming an active doubles partner in another series', function () {
    const state = poolState(3, true),
      other = poolState()
    other.entrants[0]!.identities = ['licence:99', 'licence:1']
    startMatch(other, 1)
    const playing = structuredClone(other)
    const warning = matchStartBlock(state, state.matches[0]!, undefined, [
      state,
      other
    ])
    expect(warning?.code).toBe('PLAYER_CONFLICT_CONFIRMATION_REQUIRED')
    startPool(
      state,
      1,
      [state, other],
      { '1': [0, 4] },
      new Date().toISOString(),
      false,
      true
    )
    expect(
      state.matches.every(function (match) {
        return match.status === 'in_progress' && match.table === null
      })
    ).toBe(true)
    expect(state.matches[0]!.rules!.startScores).toEqual([0, 4])
    expect(other).toEqual(playing)
  })

  it('requires a separate rest confirmation after confirming active players', function () {
    const state = poolState(),
      recent = poolState(),
      playing = poolState()
    startMatch(recent, 1)
    recordResult(recent, 1, [{ score1: 11, score2: 0 }])
    startMatch(playing, 1)
    expect(
      matchStartBlock(
        state,
        state.matches[0]!,
        undefined,
        [state, recent, playing],
        Date.now(),
        false,
        true
      )?.code
    ).toBe('REST_CONFIRMATION_REQUIRED')
    expect(
      matchStartBlock(
        state,
        state.matches[0]!,
        undefined,
        [state, recent, playing],
        Date.now(),
        true,
        true
      )
    ).toBeNull()
  })

  it('keeps an occupied table blocking after confirming active players and rest', function () {
    const state = poolState(),
      playing = poolState(),
      occupied = poolState()
    startMatch(playing, 1)
    occupied.entrants.forEach(function (entry) {
      entry.identities = [`other:${entry.id}`]
    })
    startMatch(occupied, 1, { table: 2 })
    for (const confirmed of [false, true]) {
      expect(
        matchStartBlock(
          state,
          state.matches[0]!,
          2,
          [state, playing, occupied],
          Date.now(),
          confirmed,
          confirmed
        )?.message
      ).toContain('occupée')
    }
  })

  it('keeps handicap validation atomic after confirming active players', function () {
    const state = poolState(3, true),
      other = poolState()
    startMatch(other, 1)
    state.entrants[0]!.ranking = null
    const before = structuredClone(state)
    expect(function () {
      startPool(
        state,
        1,
        [state, other],
        {},
        new Date().toISOString(),
        true,
        true
      )
    }).toThrow('Classement manquant')
    expect(state).toEqual(before)
  })

  it('retains table conflicts for matches outside the pool', function () {
    const state = poolState(),
      other = poolState()
    other.entrants.forEach(function (entry) {
      entry.identities = [`other:${entry.id}`]
    })
    startMatch(other, 1, { table: 2 })
    expect(
      matchStartBlock(state, state.matches[0]!, 2, [state, other])?.message
    ).toContain('occupée')
    expect(
      matchStartBlock(state, state.matches[0]!, undefined, [state, other])
    ).toBeNull()
  })

  it('requires confirmation for a shared identity in another pool of the same series', function () {
    const state = poolState(6)
    const first = state.matches[0]!
    const otherPool = state.matches.find(function (match) {
      return match.poolId !== first.poolId
    })!
    const player = state.entrants.find(function (entry) {
      return entry.id === otherPool.player1
    })!
    const shared = state.entrants.find(function (entry) {
      return entry.id === first.player1
    })!
    player.identities = [...shared.identities]
    startMatch(state, otherPool.id)
    const before = structuredClone(state)
    expect(function () {
      startPool(state, first.poolId!, [state])
    }).toThrow('autre série ou poule')
    expect(state).toEqual(before)
    startPool(
      state,
      first.poolId!,
      [state],
      {},
      new Date().toISOString(),
      false,
      true
    )
    expect(
      state.matches
        .filter(function (match) {
          return match.poolId === first.poolId
        })
        .every(function (match) {
          return match.status === 'in_progress'
        })
    ).toBe(true)
  })

  it('does not allow the same person on both sides of a pool sheet', function () {
    const state = poolState()
    state.entrants[1]!.identities = [...state.entrants[0]!.identities]
    const before = structuredClone(state)
    expect(function () {
      startPool(state, 1, [state], {}, new Date().toISOString(), true, true)
    }).toThrow('deux fois')
    expect(state).toEqual(before)
  })

  it('freezes Speedy rules on every pool sheet', function () {
    const state = poolState()
    state.rules.pointsPerSet = 3
    startPool(state, 1, [state])
    state.rules.pointsPerSet = 11
    expect(
      state.matches.every(function (match) {
        return match.rules?.pointsPerSet === 3
      })
    ).toBe(true)
  })

  it('computes and allows JA advances for all handicap pool matches', function () {
    const state = poolState(3, true)
    startPool(state, 1, [state], { '1': [0, 4] })
    expect(
      state.matches.map(function (match) {
        return match.rules!.startScores
      })
    ).toEqual([
      [0, 4],
      [0, 2],
      [0, 1]
    ])
  })

  it('requires manual advances for missing rankings and rejects partial launches', function () {
    const state = poolState(3, true)
    state.entrants[0]!.ranking = null
    const before = structuredClone(state)
    expect(function () {
      startPool(state, 1, [state])
    }).toThrow('Classement manquant')
    expect(state).toEqual(before)
    startPool(state, 1, [state], { '1': [0, 2], '2': [0, 3] })
    expect(
      state.matches.every(function (match) {
        return match.status === 'in_progress'
      })
    ).toBe(true)
  })

  it('resolves the remaining pool sheets when a player withdraws', function () {
    const state = poolState()
    startPool(state, 1, [state])
    recordResult(state, 1, [], state.matches[0]!.player1!)
    expect(
      state.matches.filter(function (match) {
        return match.status === 'in_progress'
      })
    ).toHaveLength(1)
    expect(
      state.matches.filter(function (match) {
        return match.status === 'forfeit'
      })
    ).toHaveLength(2)
  })

  it('still requires a table for a barrage and a placement match', function () {
    const state = poolState()
    startPool(state, 1, [state])
    for (const match of state.matches)
      recordResult(state, match.id, [{ score1: 11, score2: 0 }])
    advancePhase(state)
    const barrage = state.matches.find(function (match) {
      return match.phase === 'playoffs'
    })!
    expect(function () {
      startMatch(state, barrage.id)
    }).toThrow('Table invalide')
    startMatch(state, barrage.id, { table: 2 })
    recordResult(state, barrage.id, [{ score1: 11, score2: 0 }])
    advancePhase(state)
    const final = state.matches.find(function (match) {
      return match.phase === 'placement'
    })!
    expect(function () {
      startMatch(state, final.id)
    }).toThrow('Table invalide')
    startMatch(state, final.id, { table: 2 })
    expect(final.table).toBe(2)
  })

  it('rejects an unknown pool and repeated launch without changing results', function () {
    const state = poolState(),
      before = structuredClone(state)
    expect(function () {
      startPool(state, 2, [state])
    }).toThrow('Poule indisponible')
    expect(state).toEqual(before)
    startPool(state, 1, [state])
    const started = structuredClone(state)
    expect(function () {
      startPool(state, 1, [state])
    }).toThrow('Poule indisponible')
    expect(state).toEqual(started)
  })

  it('rejects advances for a match outside the pool or already launched', function () {
    const state = poolState()
    startMatch(state, 1)
    expect(function () {
      startPool(state, 1, [state], { '1': [0, 0] })
    }).toThrow('Avance')
    expect(function () {
      startPool(state, 1, [state], { '999': [0, 0] })
    }).toThrow('Avance')
  })
})
