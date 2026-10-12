import { expect, it } from 'vitest'
import {
  advancePhase,
  createIntegral
} from '../../../server/domains/tournament/integral'
import { simulateDemoMatches } from '../../../server/domains/tournament/demo-results'
import { placementPrintPages } from '../../../app/utils/tournament-placement-tree'

function series(count: number) {
  return createIntegral(
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
}

function finishCurrentPhase(state: ReturnType<typeof series>): void {
  for (const match of [...state.matches])
    if (match.status === 'pending')
      simulateDemoMatches(state, { matchId: match.id }, 4)
}

it('prints the waiting pool winners and both barrage destinations across readable pages', function () {
  const state = series(24)
  advancePhase(state)
  finishCurrentPhase(state)
  advancePhase(state)
  const before = structuredClone(state)

  const pages = placementPrintPages(state)

  expect(pages).toHaveLength(3)
  expect(
    pages.map(function (page) {
      return page.part
    })
  ).toEqual([1, 2, 3])
  expect(
    pages.every(function (page) {
      return page.parts === 3
    })
  ).toBe(true)
  const cards = pages.flatMap(function (page) {
    return page.layout.cards
  })
  expect(
    cards.filter(function (card) {
      return card.match
    })
  ).toHaveLength(8)
  expect(
    cards.filter(function (card) {
      return card.qualification === 'first'
    })
  ).toHaveLength(8)
  expect(
    pages.flatMap(function (page) {
      return page.layout.links
    })
  ).toHaveLength(16)
  expect(state).toEqual(before)
})

it('keeps unfinished branches and exemptions, without changing the series', function () {
  const state = series(7)
  advancePhase(state)
  while (state.phase === 'pools' || state.phase === 'playoffs') {
    finishCurrentPhase(state)
    advancePhase(state)
  }
  const before = structuredClone(state)

  const pages = placementPrintPages(state)

  const cards = pages.flatMap(function (page) {
    return page.layout.cards
  })
  expect(
    cards.some(function (card) {
      return card.kind === 'bye'
    })
  ).toBe(true)
  expect(
    cards.some(function (card) {
      return card.kind === 'pending'
    })
  ).toBe(true)
  expect(state).toEqual(before)
})

it.each(
  Array.from({ length: 31 }, function (_, index) {
    return index + 2
  })
)(
  'prints all classification matches and final places with connected, non-overlapping cards for %i entrants',
  function (count) {
    const state = series(count)
    advancePhase(state)
    while (state.phase !== 'finished') {
      finishCurrentPhase(state)
      if (state.phase === 'pools' || state.phase === 'playoffs')
        advancePhase(state)
    }
    const before = structuredClone(state)

    const pages = placementPrintPages(state)

    const focusedMatches = pages.flatMap(function (page) {
      return page.layout.columns
        .filter(function (column) {
          return column.outcome === null && !column.title
        })
        .flatMap(function (column) {
          return column.cards
        })
        .filter(function (card) {
          return card.match
        })
        .map(function (card) {
          return card.match!.id
        })
    })
    expect(
      focusedMatches.sort(function (a, b) {
        return a - b
      })
    ).toEqual(
      state.matches
        .filter(function (match) {
          return match.phase === 'placement'
        })
        .map(function (match) {
          return match.id
        })
    )
    const places = new Set(
      pages.flatMap(function (page) {
        return page.layout.cards
          .filter(function (card) {
            return card.kind === 'place'
          })
          .map(function (card) {
            return card.range.start
          })
      })
    )
    expect(
      [...places].sort(function (a, b) {
        return a - b
      })
    ).toEqual(
      Array.from({ length: count }, function (_, index) {
        return index + 1
      })
    )
    for (const { layout } of pages) {
      expect(layout.columns).toHaveLength(3)
      for (const card of layout.cards) {
        expect(card.x).toBeGreaterThanOrEqual(0)
        expect(card.y).toBeGreaterThanOrEqual(0)
        expect(card.x + card.width).toBeLessThanOrEqual(layout.width)
        expect(card.y + card.height).toBeLessThanOrEqual(layout.height)
        for (const other of layout.cards)
          if (other.key !== card.key && other.x === card.x)
            expect(
              card.y + card.height <= other.y ||
                other.y + other.height <= card.y
            ).toBe(true)
      }
      for (const link of layout.links) {
        const from = layout.cards.find(function (card) {
          return card.key === link.from
        })!
        const to = layout.cards.find(function (card) {
          return card.key === link.to
        })!
        expect(from).toBeDefined()
        expect(to).toBeDefined()
        expect(link.path).toContain(
          `M ${from.x + (link.outcome === 'winner' ? from.width : 0)} `
        )
        if (link.playerId !== null)
          expect([to.playerId, to.match?.player1, to.match?.player2]).toContain(
            link.playerId
          )
      }
    }
    expect(state).toEqual(before)
  }
)
