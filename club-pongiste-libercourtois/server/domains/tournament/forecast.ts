import { forecastConfigSchema } from '../../../shared/tournament-forecast'
import type {
  ForecastBlock,
  ForecastConfig,
  ForecastResult,
  ForecastSeries
} from '../../../shared/tournament-forecast'
import { projectIntegral, seriesEarliest } from './integral'
import type { IntegralMatch, IntegralState } from './integral'
import type { SeriesRegistration } from './types'
import { registrationEntrant } from './registration-entrant'

interface Interval {
  start: number
  end: number
}
interface Task {
  key: string
  matches: IntegralMatch[]
  dependencies: number[]
  poolSize: number | null
}
interface SeriesWork {
  config: ForecastSeries
  block: ForecastBlock
  tasks: Task[]
  players: Map<number, string[]>
  done: Map<number, number>
  requested: number
  cap: number
}
interface Scheduled {
  match: IntegralMatch
  table: number
  start: number
  end: number
}
interface Candidate {
  series: SeriesWork
  task: Task
  slots: Scheduled[]
  reservations: { table: number; start: number; end: number }[]
  start: number
  end: number
  tableDelay: number
  playerDelay: number
}
const MINUTE = 60_000
const topologies = new Map<number, IntegralState>()

/** Convert a Paris wall time without depending on the machine timezone. */
export function forecastInstant(date: string, time: string): number {
  const iso = seriesEarliest(date, time, '1970-01-01T00:00:00Z')
  const instant = new Date(iso).getTime()
  const wall = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Paris',
    dateStyle: 'short',
    timeStyle: 'short',
    hourCycle: 'h23'
  }).format(instant)
  if (wall !== `${date} ${time}`)
    throw new Error('Cette heure n’existe pas en Europe/Paris.')
  return instant
}

/** Cache only anonymous sporting topology, never registration data. */
function topology(count: number): IntegralState {
  const cached = topologies.get(count)
  if (cached) return cached
  const state = projectIntegral(count)
  if (topologies.size >= 16) topologies.delete(topologies.keys().next().value!)
  topologies.set(count, state)
  return state
}

/** Child ranges wait for all results of their parent, including exempt players. */
function tasksFor(state: IntegralState): Task[] {
  const tasks: Task[] = []
  const pools = state.matches.filter(function (match) {
    return match.phase === 'pools'
  })
  const playoffs = state.matches.filter(function (match) {
    return match.phase === 'playoffs'
  })
  for (const pool of state.pools)
    tasks.push({
      key: `pool:${pool.id}`,
      matches: pools.filter(function (match) {
        return match.poolId === pool.id
      }),
      dependencies: [],
      poolSize: pool.players.length
    })
  for (const match of state.matches) {
    if (match.phase === 'pools') continue
    let parents =
      match.phase === 'playoffs' ? pools : playoffs.length ? playoffs : pools
    if (match.phase === 'placement') {
      const ancestors = state.matches
        .filter(function (other) {
          return (
            other.phase === 'placement' &&
            other.rangeStart! <= match.rangeStart! &&
            other.rangeEnd! >= match.rangeEnd! &&
            other.rangeEnd! - other.rangeStart! >
              match.rangeEnd! - match.rangeStart!
          )
        })
        .sort(function (a, b) {
          return a.rangeEnd! - a.rangeStart! - (b.rangeEnd! - b.rangeStart!)
        })
      const parent = ancestors[0]
      if (parent)
        parents = ancestors.filter(function (other) {
          return (
            other.rangeStart === parent.rangeStart &&
            other.rangeEnd === parent.rangeEnd
          )
        })
    }
    tasks.push({
      key: `match:${match.id}`,
      matches: [match],
      dependencies: parents.map(function (parent) {
        return parent.id
      }),
      poolSize: null
    })
  }
  return tasks
}

/** Unknown attendance counts; absences and forfeits do not. A doubles row is one pair. */
export function forecastRoster(
  rows: SeriesRegistration[],
  seriesId: number
): SeriesRegistration[] {
  return rows.filter(function (row) {
    return (
      row.seriesId === seriesId &&
      row.attendanceStatus !== 'absent' &&
      !row.isForfeit
    )
  })
}

/** Validate saved assumptions without running the scheduler under the write lock. */
export function validateForecastAssumptions(
  config: ForecastConfig,
  registrations: SeriesRegistration[]
): void {
  for (const day of config.days) {
    forecastInstant(day.date, day.opening)
    forecastInstant(day.date, day.closing)
  }
  for (const series of config.series) {
    forecastInstant(series.date, series.startTime)
    const base =
      series.mode === 'registrations'
        ? forecastRoster(registrations, series.seriesId!).length
        : series.estimatedEntrants
    const count = Math.ceil((base * (100 + config.growthPercent)) / 100)
    if (count > 512)
      throw new Error(
        `${series.name} : ${count} participants projetés, la limite est de 512.`
      )
  }
}

/** Keep known identities in memory and give each added participant a distinct identity. */
function prepareSeries(
  config: ForecastConfig,
  series: ForecastSeries,
  registrations: SeriesRegistration[]
): SeriesWork {
  const roster =
    series.mode === 'registrations'
      ? forecastRoster(registrations, series.seriesId!)
      : []
  const base =
    series.mode === 'registrations' ? roster.length : series.estimatedEntrants
  const count = Math.ceil((base * (100 + config.growthPercent)) / 100)
  if (count > 512)
    throw new Error(
      `${series.name} : ${count} participants projetés, la limite est de 512.`
    )
  const day = config.days.find(function (entry) {
    return entry.date === series.date
  })!
  const requested = Math.max(
    forecastInstant(series.date, series.startTime),
    forecastInstant(day.date, day.opening)
  )
  const duration = Math.ceil(
    (series.matchMinutes * (100 + config.durationMarginPercent)) / 100
  )
  const block: ForecastBlock = {
    key: series.key,
    name: series.name,
    baseEntrants: base,
    projectedEntrants: count,
    effectiveMatchMinutes: duration,
    poolCount: 0,
    matchCount: 0,
    requestedStart: new Date(
      forecastInstant(series.date, series.startTime)
    ).toISOString(),
    start: null,
    end: null,
    delayMinutes: 0,
    tableDelayMinutes: 0,
    playerDelayMinutes: 0,
    overrunMinutes: 0,
    status: count < 2 ? 'insufficient' : 'scheduled',
    phases: []
  }
  const players = new Map<number, string[]>()
  const ranked = roster.map(registrationEntrant).sort(function (a, b) {
    return (b.ranking ?? -1) - (a.ranking ?? -1) || a.id - b.id
  })
  for (let index = 0; index < count; index++)
    players.set(
      index + 1,
      ranked[index]?.identities ??
        Array.from(
          { length: series.format === 'doubles' ? 2 : 1 },
          function (_, partner) {
            return `forecast:${series.key}:${index}:${partner}`
          }
        )
    )
  const state = count >= 2 ? topology(count) : null
  if (state) {
    block.poolCount = state.pools.length
    block.matchCount = state.matches.length
    for (const name of ['pools', 'playoffs', 'placement'] as const)
      block.phases.push({
        name,
        matches: state.matches.filter(function (match) {
          return match.phase === name
        }).length,
        start: null,
        end: null
      })
  }
  return {
    config: series,
    block,
    tasks: state ? tasksFor(state) : [],
    players,
    done: new Map(),
    requested,
    cap: Math.min(series.tableCap ?? config.tableCount, config.tableCount)
  }
}

/** Keep each resource calendar ordered so a search can skip past bookings. */
function insertInterval(calendar: Interval[], interval: Interval): void {
  let low = 0,
    high = calendar.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (calendar[middle]!.start < interval.start) low = middle + 1
    else high = middle
  }
  calendar.splice(low, 0, interval)
}

/** Find a gap in one ordered resource calendar. */
function calendarGap(
  start: number,
  duration: number,
  calendar: Interval[]
): number {
  let low = 0,
    high = calendar.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (calendar[middle]!.end <= start) low = middle + 1
    else high = middle
  }
  let instant = start
  for (let index = low; index < calendar.length; index++) {
    const busy = calendar[index]!
    if (busy.start >= instant + duration) break
    instant = Math.max(instant, busy.end)
  }
  return instant
}

/** Find the first gap large enough in every resource calendar. */
function firstGap(
  start: number,
  duration: number,
  calendars: Interval[][]
): number {
  let instant = start
  while (true) {
    const previous = instant
    for (const calendar of calendars)
      instant = calendarGap(instant, duration, calendar)
    if (instant === previous) return instant
  }
}

/** Search a match slot while applying rest before and after known player bookings. */
function matchSlot(
  work: SeriesWork,
  match: IntegralMatch,
  tables: number[],
  earliest: number,
  tableCalendars: Interval[][],
  playerCalendars: Map<string, Interval[]>,
  rest: number,
  seriesCalendar: { table: number; start: number; end: number }[]
): Scheduled {
  const duration = work.block.effectiveMatchMinutes * MINUTE
  const identities = [
    ...work.players.get(match.player1!)!,
    ...work.players.get(match.player2!)!
  ]
  const calendars = identities.map(function (identity) {
    return (playerCalendars.get(identity) ?? []).map(function (busy) {
      return { start: busy.start - rest, end: busy.end + rest }
    })
  })
  let chosen: Scheduled | null = null
  for (const table of tables) {
    let start = firstGap(earliest, duration, [
      tableCalendars[table - 1]!,
      ...calendars
    ])
    // A per-series cap includes reservations held by its pools.
    while (work.cap < tableCalendars.length) {
      const overlap = seriesCalendar.filter(function (busy) {
        return busy.start < start + duration && busy.end > start
      })
      const events = [
        start,
        ...overlap.map(function (busy) {
          return Math.max(start, busy.start)
        })
      ]
      const full = events.find(function (at) {
        return (
          overlap.filter(function (busy) {
            return busy.start <= at && busy.end > at
          }).length >= work.cap
        )
      })
      if (full === undefined) break
      const release = Math.min(
        ...overlap
          .filter(function (busy) {
            return busy.start <= full && busy.end > full
          })
          .map(function (busy) {
            return busy.end
          })
      )
      start = firstGap(release, duration, [
        tableCalendars[table - 1]!,
        ...calendars
      ])
    }
    if (!chosen || start < chosen.start)
      chosen = { match, table, start, end: start + duration }
  }
  return chosen!
}

/** Add simulated resources only to these private in-memory calendars. */
function reservePlayers(
  work: SeriesWork,
  slot: Scheduled,
  calendar: Map<string, Interval[]>
): void {
  for (const identity of [
    ...work.players.get(slot.match.player1!)!,
    ...work.players.get(slot.match.player2!)!
  ]) {
    const busy = calendar.get(identity) ?? []
    insertInterval(busy, { start: slot.start, end: slot.end })
    calendar.set(identity, busy)
  }
}

/** Plan a whole pool on one or two tables and hold those tables through its finish. */
function candidate(
  work: SeriesWork,
  task: Task,
  tables: Interval[][],
  players: Map<string, Interval[]>,
  seriesCalendar: { table: number; start: number; end: number }[],
  rest: number
): Candidate {
  const earliest = Math.max(
    work.requested,
    ...task.dependencies.map(function (id) {
      return work.done.get(id)!
    })
  )
  const all = Array.from({ length: tables.length }, function (_, index) {
    return index + 1
  })
  if (task.poolSize === null) {
    const slot = matchSlot(
      work,
      task.matches[0]!,
      all,
      earliest,
      tables,
      players,
      rest,
      seriesCalendar
    )
    const tableOnly = matchSlot(
      work,
      task.matches[0]!,
      all,
      earliest,
      tables,
      new Map(),
      0,
      seriesCalendar
    ).start
    return {
      series: work,
      task,
      slots: [slot],
      reservations: [{ table: slot.table, start: slot.start, end: slot.end }],
      start: slot.start,
      end: slot.end,
      tableDelay: tableOnly - earliest,
      playerDelay: slot.start - tableOnly
    }
  }
  let start = earliest
  const duration = work.block.effectiveMatchMinutes * MINUTE
  while (true) {
    const available = all
      .map(function (table) {
        return { table, at: firstGap(start, duration, [tables[table - 1]!]) }
      })
      .sort(function (a, b) {
        return a.at - b.at || a.table - b.table
      })
    start = Math.max(start, available[0]!.at)
    const occupied = seriesCalendar.filter(function (busy) {
      return busy.start <= start && busy.end > start
    }).length
    if (occupied >= work.cap) {
      start = Math.min(
        ...seriesCalendar
          .filter(function (busy) {
            return busy.start <= start && busy.end > start
          })
          .map(function (busy) {
            return busy.end
          })
      )
      continue
    }
    const count = Math.min(
      task.poolSize === 4 ? 2 : 1,
      work.cap - occupied,
      available.filter(function (entry) {
        return entry.at <= start
      }).length
    )
    const selected = available.slice(0, count).map(function (entry) {
      return entry.table
    })
    const localTables = tables.map(function (busy) {
      return [...busy]
    })
    const localPlayers = new Map<string, Interval[]>()
    for (const match of task.matches)
      for (const identity of [
        ...work.players.get(match.player1!)!,
        ...work.players.get(match.player2!)!
      ])
        localPlayers.set(identity, [...(players.get(identity) ?? [])])
    const slots: Scheduled[] = []
    const remaining = [...task.matches]
    while (remaining.length) {
      let chosen: Scheduled | null = null
      for (const match of remaining) {
        const slot = matchSlot(
          work,
          match,
          selected,
          start,
          localTables,
          localPlayers,
          rest,
          []
        )
        if (!chosen || slot.start < chosen.start) chosen = slot
      }
      const slot = chosen!
      slots.push(slot)
      insertInterval(localTables[slot.table - 1]!, {
        start: slot.start,
        end: slot.end
      })
      reservePlayers(work, slot, localPlayers)
      remaining.splice(remaining.indexOf(slot.match), 1)
    }
    const end = Math.max(
      ...slots.map(function (slot) {
        return slot.end
      })
    )
    const conflicts = selected.flatMap(function (table) {
      return tables[table - 1]!.filter(function (busy) {
        return busy.start < end && busy.end > start
      })
    })
    // Check caps over the whole reservation, including future bookings.
    const boundaries = seriesCalendar
      .filter(function (busy) {
        return busy.start < end && busy.end > start
      })
      .map(function (busy) {
        return Math.max(start, busy.start)
      })
    const capConflict = boundaries.find(function (at) {
      return (
        seriesCalendar.filter(function (busy) {
          return busy.start <= at && busy.end > at
        }).length +
          count >
        work.cap
      )
    })
    if (conflicts.length || capConflict !== undefined) {
      start = Math.max(
        start + MINUTE,
        ...conflicts.map(function (busy) {
          return busy.end
        }),
        ...(capConflict === undefined
          ? []
          : seriesCalendar
              .filter(function (busy) {
                return busy.start <= capConflict && busy.end > capConflict
              })
              .map(function (busy) {
                return busy.end
              }))
      )
      continue
    }
    const actualStart = Math.min(
      ...slots.map(function (slot) {
        return slot.start
      })
    )
    return {
      series: work,
      task,
      slots,
      reservations: selected.map(function (table) {
        return { table, start, end }
      }),
      start: actualStart,
      end,
      tableDelay: start - earliest,
      playerDelay: actualStart - start
    }
  }
}

/** Simulate full phases with common resources; live sporting data is never modified. */
export function simulateForecast(
  raw: ForecastConfig,
  registrations: SeriesRegistration[]
): ForecastResult {
  const config = forecastConfigSchema.parse(raw)
  validateForecastAssumptions(config, registrations)
  const works = config.series.map(function (series) {
    return prepareSeries(config, series, registrations)
  })
  const tables = Array.from({ length: config.tableCount }, function () {
    return [] as Interval[]
  })
  const players = new Map<string, Interval[]>()
  const reservations = new Map<
    string,
    { table: number; start: number; end: number }[]
  >()
  const result: ForecastResult = {
    series: works.map(function (work) {
      return work.block
    }),
    matches: [],
    occupancy: [],
    lastEnd: null
  }
  let turn = 0,
    epoch = 0
  const ready: { option: Candidate; index: number; epoch: number }[] = []
  while (true) {
    // Recompute only the earliest candidate after resource bookings change.
    // Adding reservations can delay a candidate, never make it start earlier.
    for (const [index, work] of works.entries()) {
      for (const task of [...work.tasks]) {
        if (
          !task.dependencies.every(function (id) {
            return work.done.has(id)
          })
        )
          continue
        ready.push({
          option: candidate(
            work,
            task,
            tables,
            players,
            reservations.get(work.config.key) ?? [],
            config.restMinutes * MINUTE
          ),
          index,
          epoch
        })
        work.tasks.splice(work.tasks.indexOf(task), 1)
      }
    }
    if (!ready.length) {
      if (
        works.some(function (work) {
          return work.tasks.length
        })
      )
        throw new Error('Dépendances de la prévision invalides.')
      break
    }
    let selected = 0
    for (let index = 1; index < ready.length; index++) {
      const entry = ready[index]!,
        best = ready[selected]!
      if (
        entry.option.start < best.option.start ||
        (entry.option.start === best.option.start &&
          (entry.index - turn + works.length) % works.length <
            (best.index - turn + works.length) % works.length)
      )
        selected = index
    }
    const entry = ready[selected]!
    if (entry.epoch !== epoch) {
      entry.option = candidate(
        entry.option.series,
        entry.option.task,
        tables,
        players,
        reservations.get(entry.option.series.config.key) ?? [],
        config.restMinutes * MINUTE
      )
      entry.epoch = epoch
      continue
    }
    ready.splice(selected, 1)
    const best = entry.option,
      bestIndex = entry.index
    const work = best.series,
      block = work.block
    for (const reservation of best.reservations)
      insertInterval(tables[reservation.table - 1]!, reservation)
    const seriesReservations = reservations.get(work.config.key) ?? []
    seriesReservations.push(...best.reservations)
    reservations.set(work.config.key, seriesReservations)
    for (const slot of best.slots) {
      reservePlayers(work, slot, players)
      work.done.set(slot.match.id, slot.end)
      const start = new Date(slot.start).toISOString(),
        end = new Date(slot.end).toISOString()
      result.matches.push({
        seriesKey: work.config.key,
        id: slot.match.id,
        phase: slot.match.phase,
        poolId: slot.match.poolId,
        table: slot.table,
        start,
        end
      })
      const phase = block.phases.find(function (entry) {
        return entry.name === slot.match.phase
      })!
      if (!phase.start || start < phase.start) phase.start = start
      if (!phase.end || end > phase.end) phase.end = end
      if (!block.start || start < block.start) {
        block.start = start
        block.tableDelayMinutes = best.tableDelay / MINUTE
        block.playerDelayMinutes = best.playerDelay / MINUTE
      }
      if (!block.end || end > block.end) block.end = end
    }
    epoch++
    turn = (bestIndex + 1) % works.length
  }
  for (const work of works) {
    const block = work.block
    if (!block.end) continue
    const day = config.days.find(function (entry) {
      return entry.date === work.config.date
    })!
    block.delayMinutes =
      (new Date(block.start!).getTime() -
        new Date(block.requestedStart).getTime()) /
      MINUTE
    block.overrunMinutes = Math.max(
      0,
      (new Date(block.end).getTime() - forecastInstant(day.date, day.closing)) /
        MINUTE
    )
    if (!result.lastEnd || block.end > result.lastEnd)
      result.lastEnd = block.end
  }
  // The agenda shows configured days. Quantify longer overruns with lastEnd,
  // without creating years of empty half-hour slices for extreme assumptions.
  const sliceStarts: number[] = []
  for (const day of config.days) {
    const opening = forecastInstant(day.date, day.opening)
    const closing = forecastInstant(day.date, day.closing)
    const midnight = forecastInstant(
      new Date(new Date(`${day.date}T12:00:00Z`).getTime() + 86_400_000)
        .toISOString()
        .slice(0, 10),
      '00:00'
    )
    const tail = Math.min(
      midnight,
      result.lastEnd ? new Date(result.lastEnd).getTime() : closing
    )
    for (
      let instant = opening;
      instant < Math.max(closing, tail);
      instant += 30 * MINUTE
    )
      sliceStarts.push(instant)
  }
  for (const instant of sliceStarts) {
    const bySeries: Record<string, number> = Object.create(null)
    let total = 0
    // Peak occupancy in the slice includes pools held between their matches.
    const intervals = [...reservations.entries()].flatMap(function ([
      key,
      busy
    ]) {
      return busy
        .filter(function (entry) {
          return entry.start < instant + 30 * MINUTE && entry.end > instant
        })
        .map(function (entry) {
          return { ...entry, key }
        })
    })
    const boundaries = [
      instant,
      ...intervals.map(function (entry) {
        return Math.max(instant, entry.start)
      })
    ]
    for (const at of boundaries) {
      const active = intervals.filter(function (entry) {
        return entry.start <= at && entry.end > at
      })
      total = Math.max(total, active.length)
      for (const work of works)
        bySeries[work.config.key] = Math.max(
          bySeries[work.config.key] ?? 0,
          active.filter(function (entry) {
            return entry.key === work.config.key
          }).length
        )
    }
    result.occupancy.push({
      start: new Date(instant).toISOString(),
      end: new Date(instant + 30 * MINUTE).toISOString(),
      tables: total,
      bySeries
    })
  }
  return result
}
