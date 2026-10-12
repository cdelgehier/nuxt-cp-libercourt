import { describe, expect, it } from 'vitest'
import {
  advancePhase,
  createIntegral,
  recordResult,
  startMatch
} from '../../../server/domains/tournament/integral'
import type { IntegralState } from '../../../server/domains/tournament/integral'
import {
  placementLayout,
  placementRanges,
  placementRoots,
  placementPlayerFocus,
  poolExitLayout
} from '../../../app/utils/tournament-placement-tree'

function placementState(count: number): IntegralState {
  const state = createIntegral(
    Array.from({ length: count }, function (_, index) {
      return {
        id: index + 1,
        ranking: 2000 - index * 40,
        club: null,
        identities: [`player:${index}`],
        withdrawn: false,
        seed: index + 1
      }
    }),
    { pointsPerSet: 11, setsToWin: 1, handicap: false }
  )
  advancePhase(state)
  while (state.phase === 'pools' || state.phase === 'playoffs') {
    for (const match of [...state.matches]) {
      if (match.status !== 'pending') continue
      startMatch(state, match.id, { table: 1 })
      recordResult(state, match.id, [{ score1: 11, score2: 0 }])
    }
    advancePhase(state)
  }
  return state
}

function finishPlacement(state: IntegralState): void {
  while (state.phase !== 'finished') {
    const match = state.matches.find(function (entry) {
      return entry.status === 'pending'
    })!
    startMatch(state, match.id, { table: 1 })
    recordResult(state, match.id, [{ score1: 0, score2: 11 }])
  }
}

function playoffState(count: number): IntegralState {
  const state = createIntegral(
    Array.from({ length: count }, function (_, index) {
      return {
        id: index + 1,
        ranking: 2000 - index * 40,
        club: null,
        identities: [`player:${index}`],
        withdrawn: false,
        seed: index + 1
      }
    }),
    { pointsPerSet: 11, setsToWin: 1, handicap: false }
  )
  advancePhase(state)
  if (state.phase === 'pools') {
    for (const match of [...state.matches]) {
      startMatch(state, match.id, { table: 1 })
      recordResult(state, match.id, [{ score1: 11, score2: 0 }])
    }
    advancePhase(state)
  }
  return state
}

describe('pool exit diagram', function () {
  it('shows 8 barrages and the 8 waiting pool winners before the 24-player trees open', function () {
    const state = playoffState(24)
    const before = structuredClone(state)
    expect(placementRoots(state)).toEqual([])
    const layout = poolExitLayout(state)!
    expect(
      layout.cards.filter(function (card) {
        return card.match
      })
    ).toHaveLength(8)
    expect(
      layout.cards.filter(function (card) {
        return card.qualification === 'first'
      })
    ).toHaveLength(8)
    const upper = layout.columns.find(function (column) {
      return column.outcome === 'winner'
    })!
    const lower = layout.columns.find(function (column) {
      return column.outcome === 'loser'
    })!
    expect(upper.range).toEqual({ start: 1, end: 16 })
    expect(lower.range).toEqual({ start: 17, end: 24 })
    expect(upper.cards).toHaveLength(16)
    expect(lower.cards).toHaveLength(8)
    expect(layout.links).toHaveLength(16)
    expect(
      layout.links.every(function (link) {
        return link.playerId === null
      })
    ).toBe(true)
    expect(state).toEqual(before)
  })

  it('updates both barrage destinations without assigning the next opponent before JA validation', function () {
    const state = playoffState(24)
    const barrage = state.matches.find(function (match) {
      return match.phase === 'playoffs'
    })!
    startMatch(state, barrage.id, { table: 2 })
    recordResult(state, barrage.id, [{ score1: 0, score2: 11 }])
    const result = state.matches.find(function (match) {
      return match.id === barrage.id
    })!
    const layout = poolExitLayout(state)!
    const links = layout.links.filter(function (link) {
      return (
        layout.cards.find(function (card) {
          return card.key === link.from
        })?.match?.id === barrage.id
      )
    })
    expect(links).toHaveLength(2)
    for (const link of links) {
      const target = layout.cards.find(function (card) {
        return card.key === link.to
      })!
      expect(target.playerId).toBe(result[link.outcome])
      expect(target.match).toBeNull()
      expect(target.source).toEqual({
        match: barrage.id,
        outcome: link.outcome
      })
    }
    expect(state.phase).toBe('playoffs')
    expect(state.nodes).toEqual([])
  })

  it('keeps automatic seconds and fourth-place pool players visible', function () {
    const five = poolExitLayout(playoffState(5))!
    expect(
      five.cards.filter(function (card) {
        return card.qualification === 'second'
      })
    ).toHaveLength(1)
    expect(
      five.cards.filter(function (card) {
        return card.match
      })
    ).toHaveLength(1)
    const four = poolExitLayout(playoffState(4))!
    const fourth = four.cards.find(function (card) {
      return card.qualification === 'fourth'
    })!
    expect(fourth.range).toEqual({ start: 3, end: 4 })
    expect(fourth.playerId).not.toBeNull()
  })

  it('keeps forfeits and their two destinations visible', function () {
    const state = playoffState(7)
    const barrage = state.matches.find(function (match) {
      return match.phase === 'playoffs'
    })!
    recordResult(state, barrage.id, [], barrage.player1!)
    const layout = poolExitLayout(state)!
    expect(
      layout.cards.find(function (card) {
        return card.match?.id === barrage.id
      })!.match!.status
    ).toBe('forfeit')
    expect(
      layout.cards
        .filter(function (card) {
          return card.source?.match === barrage.id
        })
        .map(function (card) {
          return card.playerId
        })
        .sort()
    ).toEqual([barrage.player1, barrage.player2].sort())
  })

  it('does not invent a pool exit before validation or for a direct final', function () {
    expect(poolExitLayout(playoffState(2))).toBeNull()
    const state = playoffState(3)
    state.phase = 'pools'
    expect(poolExitLayout(state)).toBeNull()
  })

  it.each(
    Array.from({ length: 30 }, function (_, index) {
      return index + 3
    })
  )(
    'accounts for every player once across the two destinations for %i players',
    function (count) {
      const state = playoffState(count)
      for (const match of [...state.matches]) {
        if (match.phase !== 'playoffs' || match.status !== 'pending') continue
        startMatch(state, match.id, { table: 1 })
        recordResult(state, match.id, [{ score1: 11, score2: 0 }])
      }
      const layout = poolExitLayout(state)!
      const players = layout.cards
        .filter(function (card) {
          return card.kind === 'qualifier'
        })
        .map(function (card) {
          return card.playerId!
        })
        .sort(function (a, b) {
          return a - b
        })
      expect(players).toEqual(
        Array.from({ length: count }, function (_, index) {
          return index + 1
        })
      )
      advancePhase(state)
      expect(
        layout.columns
          .filter(function (column) {
            return column.outcome !== null
          })
          .map(function (column) {
            return column.range
          })
          .sort(function (a, b) {
            return a.start - b.start
          })
      ).toEqual(placementRoots(state))
      expect(
        poolExitLayout(state)!
          .cards.filter(function (card) {
            return card.kind === 'qualifier'
          })
          .map(function (card) {
            return card.playerId!
          })
          .sort(function (a, b) {
            return a - b
          })
      ).toEqual(players)
      for (const card of layout.cards) {
        expect(card.x).toBeGreaterThanOrEqual(0)
        expect(card.y).toBeGreaterThanOrEqual(0)
        expect(card.x + card.width).toBeLessThanOrEqual(layout.width)
        expect(card.y + card.height).toBeLessThanOrEqual(layout.height)
        for (const other of layout.cards) {
          if (other.key === card.key || other.x !== card.x) continue
          expect(
            card.y + card.height <= other.y || other.y + other.height <= card.y
          ).toBe(true)
        }
      }
    }
  )
})

describe('placement tree diagram', function () {
  it('follows an exempt player into the waiting final without inventing an opponent', function () {
    const state = placementState(10)
    const root = placementRoots(state)[0]!
    for (const match of [...state.matches]) {
      if (
        match.phase !== 'placement' ||
        match.rangeStart !== root.start ||
        match.rangeEnd !== root.end
      )
        continue
      startMatch(state, match.id, { table: 1 })
      recordResult(state, match.id, [{ score1: 11, score2: 0 }])
    }
    const bye = placementLayout(state, root).cards.find(function (card) {
      return card.kind === 'bye' && card.range.start === 1
    })!
    expect(bye.playerId).not.toBeNull()
    expect(placementPlayerFocus(state, bye.playerId!)).toEqual({
      range: { start: 1, end: 2 },
      matchId: null
    })
    const final = placementLayout(state, { start: 1, end: 2 }).cards.find(
      function (card) {
        return card.kind === 'pending'
      }
    )!
    expect(final.waitingPlayers).toEqual([bye.playerId])
  })

  it('finds the next match of a losing player in the lower tree', function () {
    const state = placementState(24)
    const lower = placementRoots(state)[1]!
    const match = state.matches.find(function (entry) {
      return entry.rangeStart === lower.start && entry.rangeEnd === lower.end
    })!
    expect(placementPlayerFocus(state, match.player1!)).toEqual({
      range: lower,
      matchId: match.id
    })
    expect(placementPlayerFocus(state, -1)).toBeNull()
  })

  it('follows a finished player to their individual place', function () {
    const state = placementState(7)
    finishPlacement(state)
    for (const entrant of state.entrants) {
      const place = state.placements[String(entrant.id)]!
      expect(placementPlayerFocus(state, entrant.id)).toEqual({
        range: { start: place, end: place },
        matchId: null
      })
    }
  })

  it('keeps the 24-player upper and lower trees distinct', function () {
    const state = placementState(24)
    expect(placementRoots(state)).toEqual([
      { start: 1, end: 16 },
      { start: 17, end: 24 }
    ])
    const before = structuredClone(state)
    const layout = placementLayout(state, { start: 1, end: 16 })
    const matches = layout.cards.filter(function (card) {
      return card.kind === 'match'
    })
    expect(matches).toHaveLength(8)
    expect(
      layout.cards.some(function (card) {
        return card.kind === 'pending'
      })
    ).toBe(true)
    const rootX = matches[0]!.x
    expect(
      layout.columns.some(function (column) {
        return column.x > rootX && column.outcome === 'winner'
      })
    ).toBe(true)
    expect(
      layout.columns.some(function (column) {
        return column.x < rootX && column.outcome === 'loser'
      })
    ).toBe(true)
    expect(state).toEqual(before)
  })

  it('connects actual results after reseeding, including the losing path', function () {
    const state = placementState(10)
    finishPlacement(state)
    const layout = placementLayout(state, placementRoots(state)[0]!)
    for (const link of layout.links) {
      const from = layout.cards.find(function (card) {
        return card.key === link.from
      })!
      const to = layout.cards.find(function (card) {
        return card.key === link.to
      })!
      expect(from).toBeDefined()
      expect(to).toBeDefined()
      if (from.match && to.match) {
        const player =
          link.outcome === 'winner' ? from.match.winner : from.match.loser
        expect([to.match.player1, to.match.player2]).toContain(player)
        expect(link.playerId).toBe(player)
      }
    }
    expect(
      layout.links.some(function (link) {
        return link.outcome === 'loser' && link.playerId !== null
      })
    ).toBe(true)
  })

  it('shows an odd-size exemption without inventing a match', function () {
    const state = placementState(23)
    const layout = placementLayout(state, placementRoots(state)[1]!)
    const exemption = layout.cards.find(function (card) {
      return card.kind === 'bye'
    })!
    expect(exemption.playerId).not.toBeNull()
    expect(exemption.match).toBeNull()
    expect(
      layout.links.some(function (link) {
        return link.from === exemption.key && link.outcome === 'winner'
      })
    ).toBe(true)
  })

  it.each(
    Array.from({ length: 31 }, function (_, index) {
      return index + 2
    })
  )(
    'keeps every place accessible and all cards separate for %i players',
    function (count) {
      const state = placementState(count)
      finishPlacement(state)
      const ranges = placementRoots(state).flatMap(function (root) {
        return placementRanges(root)
      })
      expect(
        ranges
          .filter(function (range) {
            return range.start === range.end
          })
          .map(function (range) {
            return range.start
          })
          .sort(function (a, b) {
            return a - b
          })
      ).toEqual(
        Array.from({ length: count }, function (_, index) {
          return index + 1
        })
      )
      for (const range of ranges) {
        const layout = placementLayout(state, range)
        expect(
          Number.isFinite(layout.width) && Number.isFinite(layout.height)
        ).toBe(true)
        for (const card of layout.cards) {
          expect(card.x).toBeGreaterThanOrEqual(0)
          expect(card.y).toBeGreaterThanOrEqual(0)
          expect(card.x + card.width).toBeLessThanOrEqual(layout.width)
          expect(card.y + card.height).toBeLessThanOrEqual(layout.height)
          for (const other of layout.cards) {
            if (other.key === card.key || other.x !== card.x) continue
            expect(
              card.y + card.height <= other.y ||
                other.y + other.height <= card.y
            ).toBe(true)
          }
        }
        if (range.start === range.end) {
          expect(layout.cards).toHaveLength(1)
          const player = layout.cards[0]!.playerId
          expect(state.placements[String(player)]).toBe(range.start)
        }
      }
    }
  )
})
