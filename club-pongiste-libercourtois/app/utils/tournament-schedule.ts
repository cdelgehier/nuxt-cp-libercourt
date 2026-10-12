import type { getTournamentSchedule } from '../../server/domains/tournament/integral-service'

export type ScheduledMatch = Awaited<
  ReturnType<typeof getTournamentSchedule>
>['matches'][number]
export type ScheduledPool = Awaited<
  ReturnType<typeof getTournamentSchedule>
>['pools'][number]
export interface ScheduleFilters {
  seriesId?: number | null
  time?: string
  search?: string
  upcoming?: boolean
}
export interface ScheduleGroup {
  key: string
  dateLabel: string
  timeLabel: string
  matches: ScheduledMatch[]
}
interface Reservation {
  match: ScheduledMatch
  start: number
  end: number
}
export interface ScheduleCell {
  table: number | null
  entries: { match: ScheduledMatch; continuation: boolean }[]
  hiddenCount: number
  pools: ScheduledPool[]
  conflict: boolean
}
export interface ScheduleDay {
  key: string
  label: string
  rows: { key: string; timeLabel: string; cells: ScheduleCell[] }[]
}

const HALF_HOUR = 30 * 60000
const parisDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})
const dateLabel = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})
const shortDateLabel = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  day: '2-digit',
  month: '2-digit'
})
const timeLabel = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
})

/** Use the real launch when available, otherwise the forecast. */
function startTime(
  match: Pick<ScheduledMatch, 'scheduledAt' | 'startedAt'>
): number | null {
  const value = match.startedAt ?? match.scheduledAt
  const instant = value ? new Date(value).getTime() : NaN
  return Number.isFinite(instant) ? instant : null
}

/** Label the same time in match lists and planning, with its source. */
export function matchTimeLabel(
  match: Pick<ScheduledMatch, 'scheduledAt' | 'startedAt'>,
  withDate = false
): string {
  const start = startTime(match)
  if (start === null) return ''
  const source = match.startedAt ? 'Lancé' : 'Prévu'
  const date = withDate ? ` le ${shortDateLabel.format(start)}` : ''
  const label = `${source}${date} à ${timeLabel.format(start)}`
  const planned = match.scheduledAt ? Date.parse(match.scheduledAt) : NaN
  if (
    !match.startedAt ||
    !Number.isFinite(planned) ||
    Math.floor(start / 60000) === Math.floor(planned / 60000)
  )
    return label
  const plannedDate =
    parisDate.format(start) === parisDate.format(planned)
      ? ''
      : ` le ${shortDateLabel.format(planned)}`
  return `${label} (prévu${plannedDate} à ${timeLabel.format(planned)})`
}

/** Keep equivalent date formats in the same time group. */
function timeKey(match: ScheduledMatch): string {
  const start = startTime(match)
  return start === null ? 'unplanned' : new Date(start).toISOString()
}

function searchable(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Apply the same filters to both schedule views. Upcoming includes games in progress. */
export function filterSchedule(
  matches: ScheduledMatch[],
  filters: ScheduleFilters
): ScheduledMatch[] {
  const search = searchable(filters.search ?? '')
  return matches.filter(function (match) {
    return (
      (!filters.seriesId || match.seriesId === filters.seriesId) &&
      (!filters.time || timeKey(match) === filters.time) &&
      (!filters.upcoming ||
        match.status === 'pending' ||
        match.status === 'in_progress') &&
      (!search ||
        searchable(
          `${match.player1Name} ${match.player2Name} ${match.player1Club} ${match.player2Club} ${match.seriesName}`
        ).includes(search))
    )
  })
}

function compareMatches(first: ScheduledMatch, second: ScheduledMatch): number {
  return (
    (first.table ?? Infinity) - (second.table ?? Infinity) ||
    first.seriesId - second.seriesId ||
    first.id - second.id
  )
}

/** Group exact start times across series; keep games without a time at the end. */
export function groupSchedule(matches: ScheduledMatch[]): ScheduleGroup[] {
  const groups = new Map<string, ScheduleGroup>()
  for (const match of matches) {
    const key = timeKey(match)
    if (!groups.has(key)) {
      const start = startTime(match)
      groups.set(key, {
        key,
        dateLabel: start === null ? '' : dateLabel.format(start),
        timeLabel: start === null ? 'Sans horaire' : timeLabel.format(start),
        matches: []
      })
    }
    groups.get(key)!.matches.push(match)
  }
  for (const group of groups.values()) group.matches.sort(compareMatches)
  return [...groups.values()].sort(function (first, second) {
    return first.key.localeCompare(second.key)
  })
}

/** Filter displayed cards while keeping table reservations from every series. */
export function scheduleGrid(
  matches: ScheduledMatch[],
  tableCount: number,
  filters: ScheduleFilters = {},
  pools: ScheduledPool[] = []
): {
  tables: (number | null)[]
  days: ScheduleDay[]
  unplanned: ScheduledMatch[]
} {
  const visibleMatches = new Set(filterSchedule(matches, filters))
  const reservations: Reservation[] = []
  const unplanned: ScheduledMatch[] = []
  for (const match of matches) {
    const start = startTime(match)
    if (start === null) {
      if (visibleMatches.has(match)) unplanned.push(match)
    } else
      reservations.push({
        match,
        start,
        end: start + match.durationMinutes * 60000
      })
  }
  const tables: (number | null)[] = Array.from(
    { length: tableCount },
    function (_, index) {
      return index + 1
    }
  )
  for (const match of matches) {
    if (!tables.includes(match.table)) tables.push(match.table)
  }
  for (const pool of pools)
    for (const table of pool.tables)
      if (!tables.includes(table)) tables.push(table)
  tables.sort(function (first, second) {
    return (first ?? Infinity) - (second ?? Infinity)
  })
  reservations.sort(function (first, second) {
    return (
      first.start - second.start || compareMatches(first.match, second.match)
    )
  })
  const bounds = new Map<string, { start: number; end: number }>()
  const occupancy = new Map<number, Map<number | null, Reservation[]>>()
  for (const reservation of reservations) {
    for (
      let slot = Math.floor(reservation.start / HALF_HOUR) * HALF_HOUR;
      slot < reservation.end;
      slot += HALF_HOUR
    ) {
      const tablesForSlot = occupancy.get(slot) ?? new Map()
      const entries = tablesForSlot.get(reservation.match.table) ?? []
      entries.push(reservation)
      tablesForSlot.set(reservation.match.table, entries)
      occupancy.set(slot, tablesForSlot)
      if (visibleMatches.has(reservation.match)) {
        const key = parisDate.format(slot)
        const day = bounds.get(key)
        bounds.set(key, {
          start: Math.min(day?.start ?? slot, slot),
          end: Math.max(day?.end ?? slot, slot)
        })
      }
    }
  }
  const days: ScheduleDay[] = []
  for (const [key, boundsForDay] of [...bounds.entries()].sort()) {
    const day: ScheduleDay = {
      key,
      label: dateLabel.format(boundsForDay.start),
      rows: []
    }
    for (
      let slot = boundsForDay.start;
      slot <= boundsForDay.end;
      slot += HALF_HOUR
    ) {
      const cells = tables.map(function (table) {
        const reservationsForSlot = occupancy.get(slot)?.get(table) ?? []
        const occupied = reservationsForSlot.filter(function (entry) {
          return entry.match.status !== 'forfeit'
        })
        const displayed = reservationsForSlot.filter(function (entry) {
          return visibleMatches.has(entry.match)
        })
        const tablePools =
          table === null
            ? []
            : pools.filter(function (pool) {
                return pool.tables.includes(table)
              })
        const poolConflict =
          tablePools.length > 1 ||
          tablePools.some(function (pool) {
            return occupied.some(function (entry) {
              return (
                entry.match.phase !== 'pools' ||
                entry.match.seriesId !== pool.seriesId ||
                entry.match.poolId !== pool.poolId
              )
            })
          })
        // A reserved pool owns its tables once, even when several sheets share them.
        const separateMatches = occupied.filter(function (entry) {
          return !tablePools.some(function (pool) {
            return (
              entry.match.phase === 'pools' &&
              entry.match.seriesId === pool.seriesId &&
              entry.match.poolId === pool.poolId
            )
          })
        })
        const conflict =
          table !== null &&
          (poolConflict ||
            separateMatches.some(function (first, index) {
              return separateMatches.slice(index + 1).some(function (second) {
                return (
                  Math.max(first.start, second.start, slot) <
                  Math.min(first.end, second.end, slot + HALF_HOUR)
                )
              })
            }))
        return {
          table,
          conflict,
          pools: tablePools,
          hiddenCount: occupied.filter(function (entry) {
            return !visibleMatches.has(entry.match)
          }).length,
          entries: displayed.map(function (entry) {
            return { match: entry.match, continuation: entry.start < slot }
          })
        }
      })
      day.rows.push({
        key: new Date(slot).toISOString(),
        timeLabel: timeLabel.format(slot),
        cells
      })
    }
    days.push(day)
  }
  return { tables, days, unplanned }
}
