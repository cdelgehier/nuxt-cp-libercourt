import { describe, expect, it } from 'vitest'
import {
  matchSheetTitle,
  paginateMatchSheets,
  selectMatchSheets
} from '../../../app/utils/tournament-match-sheets'
import {
  createIntegral,
  advancePhase,
  startMatch,
  recordResult
} from '../../../server/domains/tournament/integral'

describe('printed match sheets', function () {
  it.each<[number, number[]]>([
    [0, []],
    [1, [1]],
    [3, [3]],
    [4, [4]],
    [5, [4, 1]],
    [12, [4, 4, 4]]
  ])(
    'keeps %i match sheets in order on pages of four',
    function (count, sizes) {
      const state = createIntegral(
        Array.from({ length: 10 }, function (_, index) {
          return {
            id: index + 1,
            ranking: 1500 - index * 50,
            club: null,
            identities: [`player:${index}`],
            withdrawn: false,
            seed: index + 1
          }
        }),
        { setsToWin: 3, pointsPerSet: 11, handicap: false }
      )
      const selected = selectMatchSheets(state.matches).slice(0, count)
      const pages = paginateMatchSheets(selected)
      expect(
        pages.map(function (page) {
          return page.length
        })
      ).toEqual(sizes)
      expect(pages.flat()).toEqual(selected)
    }
  )

  it('numbers each pool locally and keeps its original match order', function () {
    const state = createIntegral(
      Array.from({ length: 10 }, function (_, index) {
        return {
          id: index + 1,
          ranking: 1500 - index * 50,
          club: null,
          identities: [`player:${index}`],
          withdrawn: false,
          seed: index + 1
        }
      }),
      { setsToWin: 3, pointsPerSet: 11, handicap: false }
    )
    const poolMatches = state.matches.filter(function (match) {
      return match.poolId === 2
    })
    const sheets = selectMatchSheets(
      state.matches,
      poolMatches
        .map(function (match) {
          return match.id
        })
        .reverse()
    )
    expect(sheets).toEqual(poolMatches)
    expect(matchSheetTitle(sheets[0]!, state.matches)).toBe('Poule 2 - Match 1')
    expect(matchSheetTitle(sheets[1]!, state.matches)).toBe('Poule 2 - Match 2')
    expect(selectMatchSheets(state.matches, [])).toEqual([])
  })

  it('prints a single barrage and distinguishes placement matches', function () {
    const state = createIntegral(
      Array.from({ length: 6 }, function (_, index) {
        return {
          id: index + 1,
          ranking: 1500 - index * 50,
          club: null,
          identities: [`player:${index}`],
          withdrawn: false,
          seed: index + 1
        }
      }),
      { setsToWin: 1, pointsPerSet: 3, handicap: false }
    )
    advancePhase(state)
    for (const match of state.matches) {
      startMatch(state, match.id, { table: 1 })
      recordResult(state, match.id, [{ score1: 3, score2: 0 }])
    }
    advancePhase(state)
    const barrage = state.matches.find(function (match) {
      return match.phase === 'playoffs'
    })!
    expect(selectMatchSheets(state.matches, [barrage.id])).toEqual([barrage])
    expect(matchSheetTitle(barrage, state.matches)).toBe('Barrage')
    for (const match of state.matches.filter(function (match) {
      return match.phase === 'playoffs'
    })) {
      startMatch(state, match.id, { table: 1 })
      recordResult(state, match.id, [{ score1: 3, score2: 0 }])
    }
    advancePhase(state)
    const placement = state.matches.find(function (match) {
      return match.phase === 'placement'
    })!
    expect(matchSheetTitle(placement, state.matches)).toBe('Classement')
    expect(
      selectMatchSheets(state.matches).every(function (match) {
        return match.player1 !== null && match.player2 !== null
      })
    ).toBe(true)
    expect(selectMatchSheets(state.matches, [99999])).toEqual([])
  })
})
