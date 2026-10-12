import type {
  ForecastBlock,
  ForecastConfig
} from '../../shared/tournament-forecast'

/** Calendar labels always use the club timezone. */
export function forecastWall(iso: string): { date: string; minutes: number } {
  const value = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Paris',
    dateStyle: 'short',
    timeStyle: 'short',
    hourCycle: 'h23'
  }).format(new Date(iso))
  return {
    date: value.slice(0, 10),
    minutes: Number(value.slice(11, 13)) * 60 + Number(value.slice(14, 16))
  }
}
export function forecastTime(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso))
}
export function forecastDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso))
}
export function forecastColor(key: string): string {
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return [
    '#1d4ed8',
    '#0f766e',
    '#7e22ce',
    '#be123c',
    '#0369a1',
    '#4338ca',
    '#a21caf',
    '#047857'
  ][hash % 8]!
}

/** Keep the point grabbed by the mouse when moving a block, snapped to 15 minutes. */
export function forecastDropTime(
  openingMinute: number,
  pointerOffset: number,
  grabbedOffset: number
): string {
  const value = Math.max(
    0,
    Math.min(
      1425,
      Math.round((openingMinute + pointerOffset - grabbedOffset) / 15) * 15
    )
  )
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}
export interface AgendaItem {
  block: ForecastBlock
  top: number
  height: number
  lane: number
  lanes: number
}

/** Split long series at midnight and give overlapping blocks separate columns. */
export function forecastDayItems(
  blocks: ForecastBlock[],
  date: string,
  openingMinute: number
): AgendaItem[] {
  const items: AgendaItem[] = []
  for (const block of blocks) {
    if (!block.start || !block.end) continue
    const start = forecastWall(block.start),
      end = forecastWall(block.end)
    if (
      start.date > date ||
      end.date < date ||
      (end.date === date && end.minutes === 0)
    )
      continue
    const first = start.date < date ? 0 : start.minutes,
      last = end.date > date ? 1440 : end.minutes
    if (last <= Math.max(first, openingMinute)) continue
    items.push({
      block,
      top: Math.max(first - openingMinute, 0),
      height: last - Math.max(first, openingMinute),
      lane: 0,
      lanes: 1
    })
  }
  items.sort(function (a, b) {
    return a.top - b.top || b.height - a.height
  })
  let group: AgendaItem[] = [],
    ends: number[] = [],
    groupEnd = -1
  for (const item of items) {
    if (item.top >= groupEnd) {
      for (const previous of group) previous.lanes = ends.length
      group = []
      ends = []
      groupEnd = -1
    }
    let lane = ends.findIndex(function (end) {
      return end <= item.top
    })
    if (lane < 0) lane = ends.length
    ends[lane] = item.top + item.height
    item.lane = lane
    group.push(item)
    groupEnd = Math.max(groupEnd, item.top + item.height)
  }
  for (const item of group) item.lanes = ends.length
  return items
}

/** Add a date without involving the browser timezone. */
export function nextForecastDate(date: string): string {
  return new Date(new Date(`${date}T12:00:00Z`).getTime() + 86_400_000)
    .toISOString()
    .slice(0, 10)
}

/** Keep dates in the form valid when a day is removed. */
export function removeForecastDay(config: ForecastConfig, index: number): void {
  const removed = config.days[index]!
  config.days.splice(index, 1)
  for (const series of config.series)
    if (series.date === removed.date) series.date = config.days[0]!.date
}
