import type {
  IntegralMatch,
  IntegralState,
  Source
} from '../../server/domains/tournament/integral'

export interface PlacementRange {
  start: number
  end: number
}
type Outcome = 'winner' | 'loser'
export interface PlacementCard {
  key: string
  kind: 'match' | 'bye' | 'place' | 'pending' | 'qualifier'
  range: PlacementRange
  match: IntegralMatch | null
  playerId: number | null
  source?: Source
  poolId?: number
  qualification?: 'first' | 'second' | 'fourth'
  waitingPlayers?: number[]
  x: number
  y: number
  width: number
  height: number
}
export interface PlacementLink {
  from: string
  to: string
  outcome: Outcome
  playerId: number | null
  path: string
}
interface PlacementColumn {
  range: PlacementRange
  outcome: Outcome | null
  x: number
  cards: PlacementCard[]
  title?: string
}

/** Show pool winners and both barrage outcomes before the JA opens the trees. */
export function poolExitLayout(state: IntegralState): PlacementLayout | null {
  if (
    !state.pools.length ||
    !['playoffs', 'placement', 'finished'].includes(state.phase)
  )
    return null
  const barrages = state.matches.filter(function (match) {
    return match.phase === 'playoffs'
  })
  const upperCount = state.pools.length * 2
  const upperRange = { start: 1, end: upperCount }
  const lowerRange = { start: upperCount + 1, end: state.entrants.length }
  const lower: PlacementColumn = {
    range: lowerRange,
    outcome: 'loser',
    x: 0,
    cards: [],
    title: 'Arbre inférieur'
  }
  const center: PlacementColumn = {
    range: { start: 1, end: state.entrants.length },
    outcome: null,
    x: CARD_WIDTH + COLUMN_GAP,
    cards: [],
    title: 'Barrages en sortie de poules'
  }
  const upper: PlacementColumn = {
    range: upperRange,
    outcome: 'winner',
    x: (CARD_WIDTH + COLUMN_GAP) * 2,
    cards: [],
    title: 'Arbre supérieur'
  }
  const blockHeight = CARD_HEIGHT + ROW_GAP * 2
  for (const [index, pool] of state.pools.entries()) {
    const order = state.poolOrders[String(pool.id)]
    if (!order) return null
    const barrage = barrages.find(function (match) {
      return match.key === `playoff:${pool.id}`
    })
    const top = HEADER_HEIGHT + index * blockHeight
    const first = qualifierCard(
      state,
      upperRange,
      { entrant: order[0]! },
      pool.id,
      'first'
    )
    first.x = upper.x
    first.y = top
    upper.cards.push(first)
    const qualified = qualifierCard(
      state,
      upperRange,
      barrage
        ? { match: barrage.id, outcome: 'winner' }
        : { entrant: order[1]! },
      pool.id,
      barrage ? undefined : 'second'
    )
    qualified.x = upper.x
    qualified.y = top + 112
    upper.cards.push(qualified)
    if (barrage) {
      const matchCard = newCard(center.range, 'match', null, barrage)
      matchCard.poolId = pool.id
      matchCard.x = center.x
      matchCard.y = top + 12
      center.cards.push(matchCard)
      const eliminated = qualifierCard(
        state,
        lowerRange,
        { match: barrage.id, outcome: 'loser' },
        pool.id
      )
      eliminated.x = lower.x
      eliminated.y = top + (order[3] === undefined ? 56 : 0)
      lower.cards.push(eliminated)
    }
    if (order[3] !== undefined) {
      const fourth = qualifierCard(
        state,
        lowerRange,
        { entrant: order[3] },
        pool.id,
        'fourth'
      )
      fourth.x = lower.x
      fourth.y = top + 112
      lower.cards.push(fourth)
    }
  }
  const columns = [lower, center, upper]
  const links: PlacementLink[] = []
  for (const card of center.cards) {
    for (const destination of [lower, upper]) {
      const target = destination.cards.find(function (entry) {
        return entry.source?.match === card.match!.id
      })!
      links.push(
        connectCards(card, target, destination.outcome!, target.playerId)
      )
    }
  }
  return {
    width: CARD_WIDTH * 3 + COLUMN_GAP * 2,
    height: HEADER_HEIGHT + state.pools.length * blockHeight,
    columns,
    cards: columns.flatMap(function (column) {
      return column.cards
    }),
    links
  }
}

function qualifierCard(
  state: IntegralState,
  range: PlacementRange,
  source: Source,
  poolId: number,
  qualification?: PlacementCard['qualification']
): PlacementCard {
  return {
    ...newCard(range, 'qualifier', sourcePlayer(state, source)),
    key: `qualifier:${poolId}:${qualification ?? source.outcome}`,
    height: 96,
    source,
    poolId,
    qualification
  }
}
export interface PlacementLayout {
  width: number
  height: number
  columns: PlacementColumn[]
  cards: PlacementCard[]
  links: PlacementLink[]
}

const CARD_WIDTH = 252
const CARD_HEIGHT = 188
const COLUMN_GAP = 64
const ROW_GAP = 32
const HEADER_HEIGHT = 88

/** Split the place range exactly as the sporting engine does, including exemptions. */
export function placementBranch(
  range: PlacementRange,
  outcome: Outcome
): PlacementRange {
  const middle = range.start + Math.ceil((range.end - range.start + 1) / 2) - 1
  return outcome === 'winner'
    ? { start: range.start, end: middle }
    : { start: middle + 1, end: range.end }
}

/** Return the independent upper and lower trees, without their nested branches. */
export function placementRoots(state: IntegralState): PlacementRange[] {
  return state.nodes
    .filter(function (node) {
      return !state.nodes.some(function (other) {
        return (
          other !== node && other.start <= node.start && other.end >= node.end
        )
      })
    })
    .map(function (node) {
      return { start: node.start, end: node.end }
    })
    .sort(function (a, b) {
      return a.start - b.start
    })
}

/** Find a player's current match, waiting range or final place, including exemptions. */
export function placementPlayerFocus(
  state: IntegralState,
  playerId: number
): { range: PlacementRange; matchId: number | null } | null {
  const place = state.placements[String(playerId)]
  if (place !== undefined)
    return { range: { start: place, end: place }, matchId: null }
  const nodes = state.nodes
    .filter(function (node) {
      return node.sources.some(function (source) {
        return sourcePlayer(state, source) === playerId
      })
    })
    .sort(function (first, second) {
      return first.end - first.start - (second.end - second.start)
    })
  const node = nodes[0]
  if (!node) return null
  const match = state.matches.find(function (entry) {
    return (
      entry.phase === 'placement' &&
      entry.rangeStart === node.start &&
      entry.rangeEnd === node.end &&
      (entry.player1 === playerId || entry.player2 === playerId)
    )
  })
  return {
    range: { start: node.start, end: node.end },
    matchId: match?.id ?? null
  }
}

/** Keep every intermediate branch and individual place available in the diagram selector. */
export function placementRanges(range: PlacementRange): PlacementRange[] {
  if (range.start === range.end) return [range]
  return [
    range,
    ...placementRanges(placementBranch(range, 'winner')),
    ...placementRanges(placementBranch(range, 'loser'))
  ]
}

function sourcePlayer(state: IntegralState, source: Source): number | null {
  if (source.entrant !== undefined) return source.entrant
  const match = state.matches.find(function (entry) {
    return entry.id === source.match
  })
  return (source.outcome === 'winner' ? match?.winner : match?.loser) ?? null
}

function newCard(
  range: PlacementRange,
  kind: PlacementCard['kind'],
  playerId: number | null = null,
  match: IntegralMatch | null = null
): PlacementCard {
  return {
    key: `${range.start}:${range.end}:${kind}:${match?.id ?? playerId ?? ''}`,
    kind,
    range,
    playerId,
    match,
    x: 0,
    y: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT
  }
}

function columnCards(
  state: IntegralState,
  range: PlacementRange
): PlacementCard[] {
  const node = state.nodes.find(function (entry) {
    return entry.start === range.start && entry.end === range.end
  })
  if (range.start === range.end) {
    const assigned = Object.entries(state.placements).find(function ([
      ,
      place
    ]) {
      return place === range.start
    })
    const player = assigned
      ? Number(assigned[0])
      : node?.sources[0]
        ? sourcePlayer(state, node.sources[0])
        : null
    return [newCard(range, 'place', player)]
  }
  const matches = state.matches.filter(function (match) {
    return (
      match.phase === 'placement' &&
      match.rangeStart === range.start &&
      match.rangeEnd === range.end
    )
  })
  if (!matches.length)
    return [
      {
        ...newCard(range, 'pending'),
        waitingPlayers: (node?.sources ?? [])
          .map(function (source) {
            return sourcePlayer(state, source)
          })
          .filter(function (player): player is number {
            return player !== null
          })
      }
    ]
  const cards = matches.map(function (match) {
    return newCard(range, 'match', null, match)
  })
  for (const source of node?.sources ?? []) {
    const player = sourcePlayer(state, source)
    if (
      player !== null &&
      !matches.some(function (match) {
        return match.player1 === player || match.player2 === player
      })
    )
      cards.unshift(newCard(range, 'bye', player))
  }
  return cards
}

function columnChain(
  state: IntegralState,
  range: PlacementRange,
  outcome: Outcome
): PlacementColumn[] {
  const columns: PlacementColumn[] = []
  let branch = range
  while (branch.start < branch.end) {
    branch = placementBranch(branch, outcome)
    columns.push({
      range: branch,
      outcome,
      x: 0,
      cards: columnCards(state, branch)
    })
  }
  return columns
}

function cardHasPlayer(card: PlacementCard, player: number): boolean {
  return (
    card.playerId === player ||
    card.match?.player1 === player ||
    card.match?.player2 === player
  )
}

function cardPortY(card: PlacementCard, player: number | null): number {
  if (card.match && player !== null)
    return card.y + (card.match.player1 === player ? 60 : 103)
  return card.y + card.height / 2
}

function connectCards(
  card: PlacementCard,
  target: PlacementCard,
  outcome: Outcome,
  player: number | null
): PlacementLink {
  const right = outcome === 'winner'
  const x1 = card.x + (right ? card.width : 0)
  const x2 = target.x + (right ? 0 : target.width)
  const middle = (x1 + x2) / 2
  return {
    from: card.key,
    to: target.key,
    outcome,
    playerId: player,
    path: `M ${x1} ${cardPortY(card, player)} H ${middle} V ${cardPortY(target, player)} H ${x2}`
  }
}

/** Connect resolved players by identity because each new branch is reseeded. */
function columnLinks(
  from: PlacementColumn,
  to: PlacementColumn,
  outcome: Outcome
): PlacementLink[] {
  const links: PlacementLink[] = []
  for (const card of from.cards) {
    if (card.kind === 'place' || (card.kind === 'bye' && outcome === 'loser'))
      continue
    const player = card.match ? card.match[outcome] : card.playerId
    const target =
      to.cards.find(function (entry) {
        return player !== null && cardHasPlayer(entry, player)
      }) ??
      to.cards.find(function (entry) {
        return (
          entry.kind === 'pending' ||
          (entry.kind === 'place' && entry.playerId === null)
        )
      })
    if (!target) continue
    links.push(connectCards(card, target, outcome, player))
  }
  return links
}

/** Show winners to the right and losers to the left; other ranges remain selectable. */
export function placementLayout(
  state: IntegralState,
  range: PlacementRange
): PlacementLayout {
  const left = columnChain(state, range, 'loser').reverse()
  const center: PlacementColumn = {
    range,
    outcome: null,
    x: 0,
    cards: columnCards(state, range)
  }
  const columns = [...left, center, ...columnChain(state, range, 'winner')]
  const rows = Math.max(
    ...columns.map(function (column) {
      return column.cards.length
    })
  )
  const bodyHeight = rows * (CARD_HEIGHT + ROW_GAP) - ROW_GAP
  const height = HEADER_HEIGHT + bodyHeight + 16
  const width = columns.length * (CARD_WIDTH + COLUMN_GAP) - COLUMN_GAP
  for (const [index, column] of columns.entries()) {
    column.x = index * (CARD_WIDTH + COLUMN_GAP)
    for (const [row, card] of column.cards.entries()) {
      card.x = column.x
      card.y =
        HEADER_HEIGHT +
        (bodyHeight * (row + 0.5)) / column.cards.length -
        CARD_HEIGHT / 2
    }
  }
  const links: PlacementLink[] = []
  for (let index = 0; index < columns.length - 1; index++) {
    const right = index >= left.length
    links.push(
      ...columnLinks(
        columns[right ? index : index + 1]!,
        columns[right ? index + 1 : index]!,
        right ? 'winner' : 'loser'
      )
    )
  }
  return {
    width,
    height,
    columns,
    cards: columns.flatMap(function (column) {
      return column.cards
    }),
    links
  }
}

export interface PlacementPrintPage {
  key: string
  title: string
  part: number
  parts: number
  layout: PlacementLayout
}

/** Reposition copied cards and reconnect them inside a compact printed diagram. */
function printLayout(
  sourceColumns: PlacementColumn[],
  sourceLinks: PlacementLink[]
): PlacementLayout {
  const gap = 12
  const header = 52
  const columns = sourceColumns.map(function (column) {
    return {
      ...column,
      cards: column.cards.map(function (card) {
        return {
          ...card,
          kind:
            card.kind === 'qualifier' && card.range.start === card.range.end
              ? ('place' as const)
              : card.kind,
          height: ['match', 'pending'].includes(card.kind) ? 148 : 96
        }
      })
    }
  })
  const heights = columns.map(function (column) {
    return column.cards.reduce(
      function (height, card) {
        return height + card.height
      },
      Math.max(0, column.cards.length - 1) * gap
    )
  })
  const bodyHeight = Math.max(...heights)
  for (const [index, column] of columns.entries()) {
    column.x = index * (CARD_WIDTH + COLUMN_GAP)
    let top = header + (bodyHeight - heights[index]!) / 2
    for (const card of column.cards) {
      card.x = column.x
      card.y = top
      top += card.height + gap
    }
  }
  const cards = columns.flatMap(function (column) {
    return column.cards
  })
  const links = sourceLinks.flatMap(function (link) {
    const from = cards.find(function (card) {
      return card.key === link.from
    })
    const to = cards.find(function (card) {
      return card.key === link.to
    })
    return from && to
      ? [connectCards(from, to, link.outcome, link.playerId)]
      : []
  })
  return {
    width: columns.length * (CARD_WIDTH + COLUMN_GAP) - COLUMN_GAP,
    height: header + bodyHeight + 8,
    columns,
    cards,
    links
  }
}

/** Print every opened range, with its immediate winner and loser destinations. */
export function placementPrintPages(
  state: IntegralState
): PlacementPrintPage[] {
  const pages: PlacementPrintPage[] = []
  const exit = poolExitLayout(state)
  if (exit) {
    const parts = Math.ceil(state.pools.length / 3)
    for (let index = 0; index < parts; index++) {
      const poolIds = state.pools
        .slice(index * 3, index * 3 + 3)
        .map(function (pool) {
          return pool.id
        })
      pages.push({
        key: `pool-exit:${index}`,
        title: 'Sortie de poules · Barrages et qualifiés',
        part: index + 1,
        parts,
        layout: printLayout(
          exit.columns.map(function (column) {
            return {
              ...column,
              cards: column.cards.filter(function (card) {
                return poolIds.includes(card.poolId!)
              })
            }
          }),
          exit.links
        )
      })
    }
  }
  for (const root of placementRoots(state)) {
    const ranges = state.nodes
      .filter(function (node) {
        return (
          node.start >= root.start &&
          node.end <= root.end &&
          node.start < node.end
        )
      })
      .sort(function (first, second) {
        return first.start - second.start || second.end - first.end
      })
    for (const range of ranges) {
      const full = placementLayout(state, range)
      const columns = full.columns.filter(function (column) {
        const branch = column.outcome
          ? placementBranch(range, column.outcome)
          : range
        return (
          column.range.start === branch.start && column.range.end === branch.end
        )
      })
      const center = columns.find(function (column) {
        return column.outcome === null
      })!
      const parts = Math.ceil(center.cards.length / 4)
      for (let index = 0; index < parts; index++) {
        const focused = center.cards.slice(index * 4, index * 4 + 4)
        const keys = new Set(
          focused.map(function (card) {
            return card.key
          })
        )
        const links = full.links.filter(function (link) {
          return keys.has(link.from)
        })
        const targets = new Set(
          links.map(function (link) {
            return link.to
          })
        )
        pages.push({
          key: `placement:${range.start}:${range.end}:${index}`,
          title: `Places ${range.start}–${range.end}`,
          part: index + 1,
          parts,
          layout: printLayout(
            columns.map(function (column) {
              return {
                ...column,
                cards:
                  column.outcome === null
                    ? focused
                    : column.cards.filter(function (card) {
                        return targets.has(card.key)
                      })
              }
            }),
            links
          )
        })
      }
    }
  }
  return pages
}
