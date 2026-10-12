import type { IntegralMatch, IntegralState } from './integral'

/** Display a match table or the shared tables of its pool without assigning one. */
export function matchTableNumbers(
  state: IntegralState,
  match: IntegralMatch
): number[] {
  if (match.table !== null) return [match.table]
  if (match.phase !== 'pools') return []
  const pool = state.pools.find(function (entry) {
    return entry.id === match.poolId
  })
  return [...(pool?.tables ?? [])]
}

export interface PoolTableReservation {
  poolId: number
  tables: number[]
  status: 'reserved' | 'in_progress'
  completed: number
  total: number
}

/** Read table assignments and progress for unfinished pools. */
export function poolTableAssignments(
  state: IntegralState
): PoolTableReservation[] {
  const reservations: PoolTableReservation[] = []
  for (const pool of state.pools) {
    const matches = state.matches.filter(function (match) {
      return match.phase === 'pools' && match.poolId === pool.id
    })
    const remaining = matches.filter(function (match) {
      return match.status === 'pending' || match.status === 'in_progress'
    })
    if (!remaining.length) continue
    reservations.push({
      poolId: pool.id,
      tables: [...(pool.tables ?? [])],
      status: matches.some(function (match) {
        return match.status !== 'pending'
      })
        ? 'in_progress'
        : 'reserved',
      completed: matches.length - remaining.length,
      total: matches.length
    })
  }
  return reservations
}

/** Read the physical tables still held by unfinished pools. */
export function poolTableReservations(
  state: IntegralState
): PoolTableReservation[] {
  return poolTableAssignments(state).filter(function (pool) {
    return pool.tables.length > 0
  })
}

/** Reserve at most two physical tables for one pool. */
export function reservePoolTables(
  state: IntegralState,
  poolId: number,
  tables: number[],
  tableCount: number,
  tournament: IntegralState[]
): void {
  const pool = state.pools.find(function (entry) {
    return entry.id === poolId
  })
  if (
    !pool ||
    !['ready', 'pools'].includes(state.phase) ||
    !state.matches.some(function (match) {
      return (
        match.phase === 'pools' &&
        match.poolId === poolId &&
        (match.status === 'pending' || match.status === 'in_progress')
      )
    })
  )
    throw new Error('Poule indisponible.')
  if (
    tables.length > 2 ||
    new Set(tables).size !== tables.length ||
    tables.some(function (table) {
      return !Number.isInteger(table) || table < 1 || table > tableCount
    })
  )
    throw new Error(
      'Choisissez une ou deux tables distinctes du tournoi, ou aucune pour libérer la poule.'
    )
  if (
    state.matches.some(function (match) {
      return (
        match.phase === 'pools' &&
        match.poolId === poolId &&
        match.status !== 'pending'
      )
    }) &&
    pool.tables?.some(function (table) {
      return !tables.includes(table)
    })
  )
    throw new Error(
      'Les tables sont conservées jusqu’à la fin de toutes les rencontres de la poule.'
    )
  for (const other of tournament) {
    for (const reservation of poolTableReservations(other)) {
      if (other === state && reservation.poolId === poolId) continue
      if (
        reservation.tables.some(function (table) {
          return tables.includes(table)
        })
      )
        throw new Error('Une table est déjà réservée à une autre poule.')
    }
    for (const match of other.matches) {
      if (other === state && match.phase === 'pools' && match.poolId === poolId)
        continue
      if (
        match.status === 'in_progress' &&
        match.table !== null &&
        tables.includes(match.table)
      )
        throw new Error('Une table est déjà occupée par un match.')
    }
  }
  pool.tables = [...tables].sort(function (first, second) {
    return first - second
  })
}
