/** Sporting state of one full-placement series. Persisted as one atomic snapshot. */
export interface Entrant {
  id: number
  ranking: number | null
  club: string | null
  partnerClub?: string | null
  identities: string[]
  withdrawn: boolean
  seed: number
  poolRank?: number
}
export interface Rules {
  pointsPerSet: number
  setsToWin: number
  handicap: boolean
}
export interface FrozenRules extends Rules {
  startScores: [number, number]
}
export interface Pool {
  id: number
  players: number[]
}
export interface Source {
  entrant?: number
  match?: number
  outcome?: 'winner' | 'loser'
}
export interface IntegralMatch {
  id: number
  key: string
  phase: 'pools' | 'playoffs' | 'placement'
  poolId: number | null
  rangeStart: number | null
  rangeEnd: number | null
  sources: [Source, Source]
  player1: number | null
  player2: number | null
  winner: number | null
  loser: number | null
  status: 'pending' | 'in_progress' | 'finished' | 'forfeit'
  sets: { score1: number; score2: number }[]
  forfeitPlayers?: number[]
  rules: FrozenRules | null
  table: number | null
  scheduledAt: string | null
  startedAt: string | null
  finishedAt: string | null
}
interface PlacementNode {
  start: number
  end: number
  sources: Source[]
  generated: boolean
}
export interface IntegralState {
  phase: 'ready' | 'pools' | 'playoffs' | 'placement' | 'finished'
  entrants: Entrant[]
  pools: Pool[]
  matches: IntegralMatch[]
  rules: Rules
  poolOrders: Record<string, number[]>
  placements: Record<string, number>
  nodes: PlacementNode[]
  nextMatchId: number
  planning?: { duration: number; rest: number }
}
export interface Standing {
  id: number
  points: number
  wins: number
  losses: number
  setsWon: number
  setsLost: number
  pointsWon: number
  pointsLost: number
  tied: boolean
}

/** Pool sizes favor three players, then use fours to absorb the remainder. */
export function poolSizes(count: number): number[] {
  if (count < 2 || count > 512)
    throw new Error('Une série nécessite entre 2 et 512 participants.')
  if (count === 2) return []
  if (count <= 4) return [count]
  if (count === 5) return [3, 2]
  const number = Math.floor(count / 3)
  const sizes = Array(number).fill(3) as number[]
  for (let index = 0; index < count % 3; index++) sizes[number - index - 1]!++
  return sizes
}
function compareEntrants(first: Entrant, second: Entrant): number {
  return (
    (first.poolRank ?? 0) - (second.poolRank ?? 0) || first.seed - second.seed
  )
}
function entrantById(state: IntegralState, id: number): Entrant {
  const entrant = state.entrants.find(function (entry) {
    return entry.id === id
  })
  if (!entrant) throw new Error('Participant introuvable.')
  return entrant
}
function resolveSource(state: IntegralState, source: Source): number | null {
  if (source.entrant !== undefined) return source.entrant
  const match = state.matches.find(function (entry) {
    return entry.id === source.match
  })
  return (source.outcome === 'winner' ? match?.winner : match?.loser) ?? null
}
function sourceOf(id: number): Source {
  return { entrant: id }
}
function samePool(
  state: IntegralState,
  first: number,
  second: number
): boolean {
  return state.pools.some(function (pool) {
    return pool.players.includes(first) && pool.players.includes(second)
  })
}
function makeMatch(
  state: IntegralState,
  key: string,
  phase: IntegralMatch['phase'],
  first: Source,
  second: Source,
  poolId: number | null = null,
  start: number | null = null,
  end: number | null = null,
  previous: IntegralMatch[] = []
): IntegralMatch {
  const player1 = resolveSource(state, first),
    player2 = resolveSource(state, second)
  const old = previous.find(function (match) {
    return match.key === key
  })
  if (
    old &&
    (old.player1 !== player1 || old.player2 !== player2) &&
    old.status !== 'pending'
  ) {
    throw new Error(
      'Correction impossible : un match dépendant a déjà été lancé ou terminé.'
    )
  }
  const match: IntegralMatch = {
    id: old?.id ?? state.nextMatchId++,
    key,
    phase,
    poolId,
    rangeStart: start,
    rangeEnd: end,
    sources: [first, second],
    player1,
    player2,
    winner: null,
    loser: null,
    status: 'pending',
    sets: [],
    rules: null,
    table: null,
    scheduledAt: null,
    startedAt: null,
    finishedAt: null
  }
  if (old && old.player1 === player1 && old.player2 === player2)
    Object.assign(match, old, { sources: [first, second] })
  state.matches.push(match)
  return match
}
function createPoolMatches(state: IntegralState): void {
  state.matches = []
  for (const pool of state.pools) {
    for (let first = 0; first < pool.players.length; first++) {
      for (let second = first + 1; second < pool.players.length; second++) {
        makeMatch(
          state,
          `pool:${pool.id}:${first}:${second}`,
          'pools',
          sourceOf(pool.players[first]!),
          sourceOf(pool.players[second]!),
          pool.id
        )
      }
    }
  }
}
/** Build pools by FFTT seeding, with manual swaps still allowed before start. */
export function createIntegral(
  entries: Entrant[],
  rules: Rules
): IntegralState {
  const sizes = poolSizes(entries.length)
  const entrants = structuredClone(entries).sort(function (first, second) {
    return (
      (second.ranking ?? -1) - (first.ranking ?? -1) || first.id - second.id
    )
  })
  if (
    new Set(
      entrants.map(function (entry) {
        return entry.id
      })
    ).size !== entrants.length
  )
    throw new Error('Participant inscrit deux fois.')
  for (const [index, entrant] of entrants.entries()) entrant.seed = index + 1
  const state: IntegralState = {
    phase: 'ready',
    entrants,
    pools: sizes.map(function (_, index) {
      return { id: index + 1, players: [] }
    }),
    matches: [],
    rules,
    poolOrders: {},
    placements: {},
    nodes: [],
    nextMatchId: 1
  }
  let cursor = 0
  for (let row = 0; cursor < entrants.length && sizes.length; row++) {
    const indices = sizes.map(function (_, index) {
      return index
    })
    if (row % 2) indices.reverse()
    for (const index of indices) {
      if (state.pools[index]!.players.length < sizes[index]!)
        state.pools[index]!.players.push(entrants[cursor++]!.id)
    }
  }
  // Only exchange players from the same seeding row when it reduces club clashes.
  for (let row = 1; row < 4; row++) {
    for (let first = 0; first < state.pools.length; first++) {
      for (let second = first + 1; second < state.pools.length; second++) {
        const a = state.pools[first]!,
          b = state.pools[second]!
        if (a.players[row] === undefined || b.players[row] === undefined)
          continue
        const before = clubClashes(state, a) + clubClashes(state, b)
        ;[a.players[row], b.players[row]] = [b.players[row]!, a.players[row]!]
        if (clubClashes(state, a) + clubClashes(state, b) >= before)
          [a.players[row], b.players[row]] = [b.players[row]!, a.players[row]!]
      }
    }
  }
  createPoolMatches(state)
  return state
}
function clubClashes(state: IntegralState, pool: Pool): number {
  let clashes = 0
  for (let first = 0; first < pool.players.length; first++)
    for (let second = first + 1; second < pool.players.length; second++) {
      const firstEntry = entrantById(state, pool.players[first]!),
        secondEntry = entrantById(state, pool.players[second]!)
      if (
        [firstEntry.club, firstEntry.partnerClub].some(function (club) {
          return (
            club && [secondEntry.club, secondEntry.partnerClub].includes(club)
          )
        })
      )
        clashes++
    }
  return clashes
}
/** Swap two pool members and recreate the unplayed fixtures. */
export function swapPoolPlayers(
  state: IntegralState,
  first: number,
  second: number
): void {
  if (state.phase !== 'ready')
    throw new Error('Les poules sont figées après le démarrage.')
  entrantById(state, first)
  entrantById(state, second)
  for (const pool of state.pools)
    pool.players = pool.players.map(function (id) {
      return id === first ? second : id === second ? first : id
    })
  createPoolMatches(state)
}
function emptyStanding(id: number): Standing {
  return {
    id,
    points: 0,
    wins: 0,
    losses: 0,
    setsWon: 0,
    setsLost: 0,
    pointsWon: 0,
    pointsLost: 0,
    tied: false
  }
}
function computeStandings(
  state: IntegralState,
  ids: number[],
  matches: IntegralMatch[]
): Standing[] {
  const rows = ids.map(emptyStanding)
  for (const match of matches) {
    if (
      match.winner === null ||
      !ids.includes(match.player1!) ||
      !ids.includes(match.player2!)
    )
      continue
    for (const row of rows) {
      if (row.id !== match.player1 && row.id !== match.player2) continue
      const won = row.id === match.winner
      if (won) row.wins++
      else row.losses++
      const retired =
        match.status === 'forfeit' &&
        (match.forfeitPlayers ?? [match.loser!]).includes(row.id)
      row.points += retired ? 0 : won ? 2 : 1
      if (match.status === 'forfeit') {
        if (won) row.setsWon += state.rules.setsToWin
        else row.setsLost += state.rules.setsToWin
      }
      for (const set of match.sets) {
        const own = row.id === match.player1 ? set.score1 : set.score2
        const other = row.id === match.player1 ? set.score2 : set.score1
        row.pointsWon += own
        row.pointsLost += other
        if (own > other) row.setsWon++
        else row.setsLost++
      }
    }
  }
  return rows
}
function quotient(won: number, lost: number): number {
  return lost ? won / lost : won ? Infinity : 0
}
function compareTied(first: Standing, second: Standing): number {
  const points = second.points - first.points
  if (points) return points
  const firstSets = quotient(first.setsWon, first.setsLost),
    secondSets = quotient(second.setsWon, second.setsLost)
  if (firstSets !== secondSets) return secondSets > firstSets ? 1 : -1
  const firstPoints = quotient(first.pointsWon, first.pointsLost),
    secondPoints = quotient(second.pointsWon, second.pointsLost)
  return firstPoints === secondPoints ? 0 : secondPoints > firstPoints ? 1 : -1
}
/** Rank tied players using only their mutual matches, before JA arbitration. */
export function poolStandings(state: IntegralState, pool: Pool): Standing[] {
  const matches = state.matches.filter(function (match) {
    return match.poolId === pool.id
  })
  const rows = computeStandings(state, pool.players, matches)
  const mutual = new Map<number, Standing>()
  for (const row of rows) {
    const tiedIds = rows
      .filter(function (other) {
        return other.points === row.points
      })
      .map(function (other) {
        return other.id
      })
    const standing = computeStandings(state, tiedIds, matches).find(
      function (entry) {
        return entry.id === row.id
      }
    )!
    mutual.set(row.id, standing)
  }
  rows.sort(function (first, second) {
    return (
      second.points - first.points ||
      compareTied(mutual.get(first.id)!, mutual.get(second.id)!) ||
      entrantById(state, first.id).seed - entrantById(state, second.id).seed
    )
  })
  for (const row of rows)
    row.tied = rows.some(function (other) {
      return (
        row.id !== other.id &&
        row.points === other.points &&
        compareTied(mutual.get(row.id)!, mutual.get(other.id)!) === 0
      )
    })
  return rows
}
function validatePoolOrders(
  state: IntegralState,
  orders: Record<string, number[]>
): void {
  for (const pool of state.pools) {
    const standings = poolStandings(state, pool)
    const manual = orders[String(pool.id)]
    if (
      standings.some(function (row) {
        return row.tied
      }) &&
      !manual
    )
      throw new Error(`Poule ${pool.id} : départage du JA requis.`)
    const order =
      manual ??
      standings.map(function (row) {
        return row.id
      })
    if (
      order.length !== pool.players.length ||
      new Set(order).size !== order.length ||
      order.some(function (id) {
        return !pool.players.includes(id)
      })
    )
      throw new Error('Classement de poule invalide.')
    for (let first = 0; first < order.length; first++)
      for (let second = first + 1; second < order.length; second++) {
        const a = standings.find(function (row) {
            return row.id === order[first]
          })!,
          b = standings.find(function (row) {
            return row.id === order[second]
          })!
        const tiedIds = standings
          .filter(function (row) {
            return row.points === a.points
          })
          .map(function (row) {
            return row.id
          })
        const mutual = computeStandings(
          state,
          tiedIds,
          state.matches.filter(function (match) {
            return match.poolId === pool.id
          })
        )
        if (
          a.points < b.points ||
          (a.points === b.points &&
            compareTied(
              mutual.find(function (row) {
                return row.id === a.id
              })!,
              mutual.find(function (row) {
                return row.id === b.id
              })!
            ) > 0)
        )
          throw new Error(
            'Le départage manuel doit respecter les résultats sportifs.'
          )
      }
    state.poolOrders[String(pool.id)] = order
    for (const [index, id] of order.entries())
      entrantById(state, id).poolRank = index + 1
  }
}
function buildPlayoffs(
  state: IntegralState,
  previous: IntegralMatch[] = []
): void {
  state.matches = state.matches.filter(function (match) {
    return match.phase === 'pools'
  })
  for (const [index, pool] of state.pools.entries()) {
    const own = state.poolOrders[String(pool.id)]!
    const next = state.pools[(index + 1) % state.pools.length]!
    const third = state.poolOrders[String(next.id)]![2]
    if (third !== undefined)
      makeMatch(
        state,
        `playoff:${pool.id}`,
        'playoffs',
        sourceOf(own[1]!),
        sourceOf(third),
        null,
        null,
        null,
        previous
      )
  }
}
function buildPlacementRoots(state: IntegralState): void {
  state.placements = {}
  state.nodes = []
  if (!state.pools.length) {
    state.nodes.push({
      start: 1,
      end: state.entrants.length,
      sources: state.entrants.map(function (entry) {
        return sourceOf(entry.id)
      }),
      generated: false
    })
    return
  }
  const upper: Source[] = [],
    lower: Source[] = []
  for (const pool of state.pools) {
    const order = state.poolOrders[String(pool.id)]!
    upper.push(sourceOf(order[0]!))
    const playoff = state.matches.find(function (match) {
      return match.key === `playoff:${pool.id}`
    })
    if (playoff) {
      upper.push({ match: playoff.id, outcome: 'winner' })
      lower.push({ match: playoff.id, outcome: 'loser' })
    } else upper.push(sourceOf(order[1]!))
    if (order[3] !== undefined) lower.push(sourceOf(order[3]))
  }
  state.nodes.push({
    start: 1,
    end: upper.length,
    sources: upper,
    generated: false
  })
  if (lower.length)
    state.nodes.push({
      start: upper.length + 1,
      end: state.entrants.length,
      sources: lower,
      generated: false
    })
}
function generateNodes(
  state: IntegralState,
  previous: IntegralMatch[]
): boolean {
  let generated = false
  for (const node of [...state.nodes]) {
    if (node.generated) continue
    const players = node.sources.map(function (source) {
      return resolveSource(state, source)
    })
    if (
      players.some(function (id) {
        return id === null
      })
    )
      continue
    const ids = (players as number[]).sort(function (a, b) {
      return compareEntrants(entrantById(state, a), entrantById(state, b))
    })
    node.generated = true
    generated = true
    if (ids.length === 1) {
      state.placements[String(ids[0])] = node.start
      continue
    }
    const winners: Source[] = [],
      losers: Source[] = []
    if (ids.length % 2) winners.push(sourceOf(ids.shift()!))
    const half = ids.length / 2
    const stronger = ids.slice(0, half),
      weaker = ids.slice(half).reverse()
    for (let index = 0; index < half; index++) {
      if (samePool(state, stronger[index]!, weaker[index]!)) {
        const alternative = weaker.findIndex(function (id, other) {
          return (
            other > index &&
            !samePool(state, stronger[index]!, id) &&
            !samePool(state, stronger[other]!, weaker[index]!)
          )
        })
        if (alternative >= 0)
          [weaker[index], weaker[alternative]] = [
            weaker[alternative]!,
            weaker[index]!
          ]
      }
      const match = makeMatch(
        state,
        `places:${node.start}:${node.end}:${index}`,
        'placement',
        sourceOf(stronger[index]!),
        sourceOf(weaker[index]!),
        null,
        node.start,
        node.end,
        previous
      )
      winners.push({ match: match.id, outcome: 'winner' })
      losers.push({ match: match.id, outcome: 'loser' })
    }
    state.nodes.push(
      {
        start: node.start,
        end: node.start + winners.length - 1,
        sources: winners,
        generated: false
      },
      {
        start: node.start + winners.length,
        end: node.end,
        sources: losers,
        generated: false
      }
    )
  }
  return generated
}
function resolveWithdrawals(state: IntegralState): boolean {
  let changed = false
  for (const match of state.matches) {
    if (
      match.status !== 'pending' ||
      match.player1 === null ||
      match.player2 === null
    )
      continue
    const first = entrantById(state, match.player1),
      second = entrantById(state, match.player2)
    if (!first.withdrawn && !second.withdrawn) continue
    const winner =
      first.withdrawn && second.withdrawn
        ? compareEntrants(first, second) <= 0
          ? first
          : second
        : first.withdrawn
          ? second
          : first
    match.winner = winner.id
    match.loser = winner.id === first.id ? second.id : first.id
    match.status = 'forfeit'
    match.forfeitPlayers = [first, second]
      .filter(function (entry) {
        return entry.withdrawn
      })
      .map(function (entry) {
        return entry.id
      })
    match.finishedAt = new Date().toISOString()
    changed = true
  }
  return changed
}
function settle(state: IntegralState, previous: IntegralMatch[] = []): void {
  let changed = true
  while (changed) {
    changed = resolveWithdrawals(state)
    if (state.phase === 'placement')
      changed = generateNodes(state, previous) || changed
  }
  if (
    state.phase === 'placement' &&
    Object.keys(state.placements).length === state.entrants.length
  )
    state.phase = 'finished'
}
/** JA confirms transitions only when every match and tie is settled. */
export function advancePhase(
  state: IntegralState,
  input: { poolOrders?: Record<string, number[]> } = {}
): void {
  const draft = structuredClone(state)
  if (draft.phase === 'ready') {
    draft.phase = draft.pools.length ? 'pools' : 'placement'
    if (!draft.pools.length) buildPlacementRoots(draft)
  } else {
    if (draft.phase === 'finished' || draft.phase === 'placement')
      throw new Error('Les matchs de classement doivent être terminés.')
    if (
      draft.matches.some(function (match) {
        return match.phase === draft.phase && match.winner === null
      })
    )
      throw new Error('Tous les matchs de la phase doivent être terminés.')
    if (draft.phase === 'pools') {
      validatePoolOrders(draft, input.poolOrders ?? {})
      buildPlayoffs(draft)
      draft.phase = 'playoffs'
    } else {
      draft.phase = 'placement'
      buildPlacementRoots(draft)
    }
  }
  settle(draft)
  Object.assign(state, draft)
}
/** Advance is included in the final score of every set, never added again. */
export function handicapStart(
  first: number | null,
  second: number | null,
  target: number
): [number, number] {
  if (first === null || second === null)
    throw new Error(
      'Classement manquant : renseignez les points FFTT ou une avance manuelle.'
    )
  const advance = Math.min(
    7,
    target - 1,
    Math.floor(Math.abs(first - second) / 100)
  )
  return first < second ? [advance, 0] : first > second ? [0, advance] : [0, 0]
}
/** Freeze scoring rules and advance before the first point is played. */
export function startMatch(
  state: IntegralState,
  id: number,
  input: { table: number; startScores?: [number, number] },
  now = new Date().toISOString()
): void {
  if (state.phase === 'ready' || state.phase === 'finished')
    throw new Error('La série ne peut pas lancer de match.')
  const match = state.matches.find(function (entry) {
    return entry.id === id
  })
  if (
    !match ||
    match.status !== 'pending' ||
    match.player1 === null ||
    match.player2 === null
  )
    throw new Error('Match indisponible.')
  if (!Number.isInteger(input.table) || input.table < 1)
    throw new Error('Table invalide.')
  const first = entrantById(state, match.player1),
    second = entrantById(state, match.player2)
  if (
    first.identities.some(function (identity) {
      return second.identities.includes(identity)
    }) ||
    new Set(first.identities).size !== first.identities.length ||
    new Set(second.identities).size !== second.identities.length
  )
    throw new Error('Un joueur ne peut pas participer deux fois au même match.')
  const startScores: [number, number] = state.rules.handicap
    ? (input.startScores ??
      handicapStart(first.ranking, second.ranking, state.rules.pointsPerSet))
    : [0, 0]
  if (
    startScores.some(function (score) {
      return (
        !Number.isInteger(score) ||
        score < 0 ||
        score > Math.min(7, state.rules.pointsPerSet - 1)
      )
    }) ||
    startScores.every(function (score) {
      return score > 0
    })
  )
    throw new Error('Avance invalide.')
  if (
    state.rules.handicap &&
    first.ranking !== null &&
    second.ranking !== null &&
    ((first.ranking > second.ranking && startScores[0] > 0) ||
      (second.ranking > first.ranking && startScores[1] > 0))
  )
    throw new Error('L’avance est réservée au participant le moins classé.')
  match.rules = { ...state.rules, startScores: [...startScores] }
  match.status = 'in_progress'
  match.table = input.table
  match.startedAt = now
}
function scoreWinner(
  match: IntegralMatch,
  sets: IntegralMatch['sets']
): number {
  if (!match.rules)
    throw new Error('Lancez le match avant de saisir son score.')
  const rules = match.rules
  let first = 0,
    second = 0
  for (const set of sets) {
    if (first === rules.setsToWin || second === rules.setsToWin)
      throw new Error('Une manche a été saisie après la fin du match.')
    const high = Math.max(set.score1, set.score2),
      low = Math.min(set.score1, set.score2)
    if (
      ![set.score1, set.score2].every(Number.isInteger) ||
      set.score1 < rules.startScores[0] ||
      set.score2 < rules.startScores[1] ||
      high < rules.pointsPerSet ||
      high - low < 2 ||
      (low >= rules.pointsPerSet - 1
        ? high - low !== 2
        : high !== rules.pointsPerSet)
    )
      throw new Error('Score de manche invalide.')
    if (set.score1 > set.score2) first++
    else second++
  }
  if (first !== rules.setsToWin && second !== rules.setsToWin)
    throw new Error('Le score ne désigne pas de vainqueur.')
  return first === rules.setsToWin ? match.player1! : match.player2!
}
/** Validate and rebuild both paths on a copy, so rejected corrections change nothing. */
export function recordResult(
  state: IntegralState,
  id: number,
  sets: IntegralMatch['sets'],
  forfeitWinner?: number
): void {
  const draft = structuredClone(state),
    match = draft.matches.find(function (entry) {
      return entry.id === id
    })
  if (
    !match ||
    match.player1 === null ||
    match.player2 === null ||
    draft.phase === 'ready'
  )
    throw new Error('Match indisponible.')
  if (match.status === 'forfeit')
    throw new Error(
      'Un forfait doit être résolu par le JA avant toute reprise de la série.'
    )
  const correction = match.status === 'finished'
  let winner: number
  if (forfeitWinner !== undefined) {
    if (correction || ![match.player1, match.player2].includes(forfeitWinner))
      throw new Error('Forfait invalide.')
    winner = forfeitWinner
    entrantById(
      draft,
      winner === match.player1 ? match.player2 : match.player1
    ).withdrawn = true
  } else winner = scoreWinner(match, sets)
  match.winner = winner
  match.loser = winner === match.player1 ? match.player2 : match.player1
  match.sets = forfeitWinner === undefined ? sets : []
  match.status = forfeitWinner === undefined ? 'finished' : 'forfeit'
  if (forfeitWinner !== undefined) match.forfeitPlayers = [match.loser]
  if (!correction) match.finishedAt = new Date().toISOString()
  if (correction) {
    const previous = structuredClone(draft.matches),
      pastPools = draft.phase !== 'pools',
      pastPlayoffs = ['placement', 'finished'].includes(draft.phase)
    if (match.phase === 'pools' && pastPools) {
      const orders: Record<string, number[]> = {}
      for (const pool of draft.pools) {
        const before = poolStandings(state, pool),
          after = poolStandings(draft, pool)
        if (
          before.length === after.length &&
          before.every(function (row, index) {
            return (
              row.id === after[index]!.id && row.tied === after[index]!.tied
            )
          })
        )
          orders[String(pool.id)] = state.poolOrders[String(pool.id)]!
      }
      validatePoolOrders(draft, orders)
      buildPlayoffs(draft, previous)
    }
    if (pastPlayoffs) {
      draft.phase = 'placement'
      draft.matches = draft.matches.filter(function (entry) {
        return entry.phase !== 'placement'
      })
      buildPlacementRoots(draft)
      settle(draft, previous)
      for (const old of previous)
        if (
          old.phase === 'placement' &&
          old.status !== 'pending' &&
          !draft.matches.some(function (entry) {
            return entry.key === old.key
          })
        )
          throw new Error(
            'Correction impossible : un match dépendant a déjà été lancé ou terminé.'
          )
    }
  }
  settle(draft)
  Object.assign(state, draft)
}
interface ScheduleSeries {
  state: IntegralState
  earliest: string
}
interface Reservation {
  table: number
  start: number
  end: number
  identities: string[]
}
function matchIdentities(state: IntegralState, match: IntegralMatch): string[] {
  return [match.player1, match.player2].flatMap(function (id) {
    return id === null ? [] : entrantById(state, id).identities
  })
}
/** Greedy planning across all series uses physical player identities, including partners. */
export function planSchedule(
  series: ScheduleSeries[],
  tables: number,
  duration = 30,
  rest = 10,
  now = Date.now()
): void {
  if (
    !Number.isInteger(tables) ||
    tables < 1 ||
    !Number.isInteger(duration) ||
    duration < 1 ||
    !Number.isInteger(rest) ||
    rest < 0
  )
    throw new Error('Paramètres du planning invalides.')
  const reservations: Reservation[] = []
  for (const item of series)
    for (const match of item.state.matches) {
      if (match.status === 'pending' || match.status === 'forfeit') continue
      const start = new Date(
        match.startedAt ?? match.scheduledAt ?? now
      ).getTime()
      const end =
        match.status === 'finished'
          ? new Date(match.finishedAt ?? start + duration * 60000).getTime()
          : Math.max(start + duration * 60000, now + duration * 60000)
      reservations.push({
        table: match.table ?? 1,
        start,
        end,
        identities: matchIdentities(item.state, match)
      })
    }
  for (const item of series) {
    item.state.planning = { duration, rest }
    for (const match of item.state.matches) {
      if (
        match.status !== 'pending' ||
        match.player1 === null ||
        match.player2 === null
      )
        continue
      const identities = matchIdentities(item.state, match)
      let bestStart = Infinity,
        bestTable = 1
      for (let table = 1; table <= tables; table++) {
        let start = new Date(item.earliest).getTime()
        if (!Number.isFinite(start))
          throw new Error('Date de planning invalide.')
        let conflict = true
        while (conflict) {
          conflict = false
          for (const reservation of reservations) {
            const shared = identities.some(function (identity) {
              return reservation.identities.includes(identity)
            })
            const gap = shared ? rest * 60000 : 0
            if (
              (shared || table === reservation.table) &&
              start < reservation.end + gap &&
              start + duration * 60000 > reservation.start - gap
            ) {
              start = reservation.end + gap
              conflict = true
            }
          }
        }
        if (start < bestStart) {
          bestStart = start
          bestTable = table
        }
      }
      match.table = bestTable
      match.scheduledAt = new Date(bestStart).toISOString()
      reservations.push({
        table: bestTable,
        start: bestStart,
        end: bestStart + duration * 60000,
        identities
      })
    }
  }
}

/** Series dates are club-local dates, independent of the server timezone. */
export function seriesEarliest(
  date: string,
  time: string | null,
  requested: string
): string {
  const wall = new Date(`${date}T${time ?? '00:00'}:00Z`).getTime()
  if (!Number.isFinite(wall)) throw new Error('Date de série invalide.')
  let instant = wall
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  })
  for (let pass = 0; pass < 2; pass++) {
    const local = formatter.format(new Date(instant)).replace(' ', 'T')
    instant += wall - new Date(`${local}Z`).getTime()
  }
  return new Date(
    Math.max(instant, new Date(requested).getTime())
  ).toISOString()
}
