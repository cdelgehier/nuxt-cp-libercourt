import { describe, expect, it } from 'vitest'
import { forecastConfigSchema } from '../../../shared/tournament-forecast'
import { projectIntegral } from '../../../server/domains/tournament/integral'
import {
  simulateForecast,
  forecastInstant
} from '../../../server/domains/tournament/forecast'
import type { ForecastConfig } from '../../../shared/tournament-forecast'
import type { SeriesRegistration } from '../../../server/domains/tournament/types'
import {
  forecastDayItems,
  forecastDropTime
} from '../../../app/utils/forecast-agenda'

function config(count = 24): ForecastConfig {
  return {
    days: [{ date: '2026-10-14', opening: '09:00', closing: '20:00' }],
    tableCount: 8,
    growthPercent: 0,
    durationMarginPercent: 0,
    restMinutes: 10,
    series: [
      {
        key: 'one',
        seriesId: null,
        name: 'Simple',
        format: 'singles',
        type: 'standard',
        mode: 'estimated',
        estimatedEntrants: count,
        date: '2026-10-14',
        startTime: '09:00',
        matchMinutes: 30,
        tableCap: null
      }
    ]
  }
}

describe('complete sporting forecast', function () {
  it('does not add a phantom participant or minute at an exact percentage boundary', function () {
    const input = config(100)
    input.growthPercent = 10
    input.durationMarginPercent = 10
    input.series[0]!.matchMinutes = 100
    expect(simulateForecast(input, []).series[0]).toMatchObject({
      projectedEntrants: 110,
      effectiveMatchMinutes: 110
    })
  })
  it('keeps the grabbed point of a dragged block and snaps to fifteen minutes', function () {
    expect(forecastDropTime(540, 267, 27)).toBe('13:00')
    expect(forecastDropTime(540, 270, 27)).toBe('13:00')
    expect(forecastDropTime(0, -100, 10)).toBe('00:00')
    expect(forecastDropTime(0, 1500, 0)).toBe('23:45')
  })
  it('records occupancy for keys that also exist on Object.prototype', function () {
    const input = config(2)
    input.series[0]!.key = 'constructor'
    const result = simulateForecast(input, [])
    expect(result.occupancy[0]!.bySeries.constructor).toBe(1)
  })

  it('splits a night overrun without showing finished blocks after opening', function () {
    const input = config(3)
    input.series[0]!.startTime = '23:00'
    const result = simulateForecast(input, [])
    expect(forecastDayItems(result.series, '2026-10-15', 540)).toEqual([])
    expect(
      forecastDayItems(result.series, '2026-10-15', 0)[0]!.height
    ).toBeGreaterThan(0)
  })
  it('uses two tables efficiently for four and gives each player ten minutes rest', function () {
    const input = config(4)
    input.tableCount = 2
    const result = simulateForecast(input, [])
    const pool = result.series[0]!.phases[0]!
    expect(
      new Date(pool.end!).getTime() - new Date(pool.start!).getTime()
    ).toBe(110 * 60_000)
    const graph = projectIntegral(4)
    for (let player = 1; player <= 4; player++) {
      const ids = graph.matches
        .filter(function (match) {
          return match.player1 === player || match.player2 === player
        })
        .map(function (match) {
          return match.id
        })
      const played = result.matches
        .filter(function (match) {
          return ids.includes(match.id)
        })
        .sort(function (a, b) {
          return a.start.localeCompare(b.start)
        })
      for (let index = 1; index < played.length; index++)
        expect(
          new Date(played[index]!.start).getTime() -
            new Date(played[index - 1]!.end).getTime()
        ).toBeGreaterThanOrEqual(10 * 60_000)
    }
  })
  it('recognizes the same licensed player in singles and doubles and preserves input', function () {
    const input = config(2)
    input.tableCount = 2
    input.series[0]!.seriesId = 1
    input.series[0]!.mode = 'registrations'
    input.series.push({
      ...input.series[0]!,
      key: 'double',
      seriesId: 2,
      format: 'doubles',
      name: 'Double'
    })
    const rows = [
      {
        id: 1,
        seriesId: 1,
        ranking: 1000,
        licenceNumber: '123',
        attendanceStatus: 'unknown',
        isForfeit: false
      },
      {
        id: 2,
        seriesId: 1,
        ranking: 500,
        licenceNumber: '456',
        attendanceStatus: 'present',
        isForfeit: false
      },
      {
        id: 3,
        seriesId: 2,
        ranking: 1000,
        licenceNumber: '123',
        partnerRanking: 600,
        partnerLastName: 'Partner',
        partnerLicenceNumber: '789',
        attendanceStatus: 'unknown',
        isForfeit: false
      },
      {
        id: 4,
        seriesId: 2,
        ranking: 500,
        licenceNumber: '101',
        partnerRanking: 400,
        partnerLastName: 'Other',
        partnerLicenceNumber: '102',
        attendanceStatus: 'present',
        isForfeit: false
      },
      { id: 5, seriesId: 1, attendanceStatus: 'absent', isForfeit: false },
      { id: 6, seriesId: 1, attendanceStatus: 'unknown', isForfeit: true }
    ] as SeriesRegistration[]
    const original = structuredClone(rows)
    const result = simulateForecast(input, rows)
    expect(
      result.series.map(function (series) {
        return series.baseEntrants
      })
    ).toEqual([2, 2])
    expect(
      new Date(result.series[1]!.start!).getTime() -
        new Date(result.series[0]!.end!).getTime()
    ).toBe(10 * 60_000)
    expect(rows).toEqual(original)
    expect(JSON.stringify(result)).not.toContain('licence:')
  })

  it('uses Paris winter and summer time and rejects missing DST hours', function () {
    expect(new Date(forecastInstant('2026-07-01', '09:00')).toISOString()).toBe(
      '2026-07-01T07:00:00.000Z'
    )
    expect(new Date(forecastInstant('2026-12-01', '09:00')).toISOString()).toBe(
      '2026-12-01T08:00:00.000Z'
    )
    expect(function () {
      forecastInstant('2026-03-29', '02:30')
    }).toThrow(/n’existe pas/)
  })

  it('shares equal starts in displayed order and reserves pools through rest gaps', function () {
    const input = config(6)
    input.tableCount = 1
    input.series.push({ ...input.series[0]!, key: 'two', name: 'Second' })
    const result = simulateForecast(input, [])
    const pools = result.matches.filter(function (match) {
      return match.phase === 'pools'
    })
    const ordered = [...pools].sort(function (a, b) {
      return a.start.localeCompare(b.start)
    })
    expect(
      ordered.slice(0, 3).every(function (match) {
        return match.seriesKey === 'one'
      })
    ).toBe(true)
    expect(
      ordered.slice(3, 6).every(function (match) {
        return match.seriesKey === 'two'
      })
    ).toBe(true)
    expect(
      ordered.slice(6, 9).every(function (match) {
        return match.seriesKey === 'one'
      })
    ).toBe(true)
    expect(
      result.occupancy.some(function (slot) {
        return (
          slot.tables === 1 &&
          !result.matches.some(function (match) {
            return match.start <= slot.start && match.end > slot.start
          })
        )
      })
    ).toBe(true)
  })

  it('assigns separate visual lanes to overlapping series', function () {
    const input = config(2)
    input.series.push({ ...input.series[0]!, key: 'two', name: 'Second' })
    const result = simulateForecast(input, [])
    const items = forecastDayItems(result.series, '2026-10-14', 540)
    expect(
      items.map(function (item) {
        return item.lane
      })
    ).toEqual([0, 1])
    expect(
      items.map(function (item) {
        return item.lanes
      })
    ).toEqual([2, 2])
  })
  it.each(
    Array.from({ length: 31 }, function (_, index) {
      return index + 2
    })
  )('assigns every place for %i entrants', function (count) {
    const state = projectIntegral(count)
    expect(
      Object.values(state.placements).sort(function (a, b) {
        return a - b
      })
    ).toEqual(
      Array.from({ length: count }, function (_, index) {
        return index + 1
      })
    )
    expect(state.phase).toBe('finished')
    const scheduled = simulateForecast(config(count), [])
    expect(scheduled.matches).toHaveLength(state.matches.length)
    expect(
      new Set(
        scheduled.matches.map(function (match) {
          return match.id
        })
      ).size
    ).toBe(state.matches.length)
  })

  it('includes 76 matches, eight pools and eight playoffs for 24', function () {
    const result = simulateForecast(config(), [])
    expect(result.series[0]).toMatchObject({
      baseEntrants: 24,
      projectedEntrants: 24,
      poolCount: 8,
      matchCount: 76
    })
    expect(
      result.series[0]!.phases.map(function (phase) {
        return phase.matches
      })
    ).toEqual([24, 8, 44])
    expect(result.matches).toHaveLength(76)
  })

  it('keeps tables, players, rest and phase dependencies exclusive', function () {
    const input = config(10)
    input.tableCount = 3
    input.series.push({
      ...input.series[0]!,
      key: 'two',
      name: 'Speedy',
      type: 'speedy',
      matchMinutes: 10,
      tableCap: 1
    })
    const result = simulateForecast(input, [])
    for (const match of result.matches) {
      for (const other of result.matches) {
        if (match === other) continue
        const overlap = match.start < other.end && other.start < match.end
        if (overlap) expect(match.table).not.toBe(other.table)
      }
    }
    expect(result.series[1]!.effectiveMatchMinutes).toBe(10)
    for (const slot of result.occupancy)
      expect(slot.tables).toBeLessThanOrEqual(3)
    for (const slot of result.occupancy)
      expect(slot.bySeries.two ?? 0).toBeLessThanOrEqual(1)
    const phases = result.series[0]!.phases
    expect(phases[1]!.start! >= phases[0]!.end!).toBe(true)
    expect(phases[2]!.start! >= phases[1]!.end!).toBe(true)
  })

  it('applies the two margins separately and counts insufficient entrants', function () {
    const input = config(10)
    input.growthPercent = 15
    input.durationMarginPercent = 15
    expect(simulateForecast(input, []).series[0]).toMatchObject({
      baseEntrants: 10,
      projectedEntrants: 12,
      effectiveMatchMinutes: 35
    })
    expect(simulateForecast(config(0), []).series[0]!.status).toBe(
      'insufficient'
    )
    expect(simulateForecast(config(1), []).series[0]!.status).toBe(
      'insufficient'
    )
  })

  it('reports overruns and does not carry unfinished series into the next opening', function () {
    const input = config(3)
    input.days[0]!.closing = '10:00'
    input.days.push({ date: '2026-10-15', opening: '09:00', closing: '20:00' })
    const result = simulateForecast(input, [])
    expect(result.series[0]!.overrunMinutes).toBeGreaterThan(0)
    expect(result.series[0]!.end!.startsWith('2026-10-14')).toBe(true)
  })

  it('rejects invalid dates, duplicate keys, foreign days and projection over 512', function () {
    const input = config()
    input.days[0]!.date = '2026-02-30'
    expect(forecastConfigSchema.safeParse(input).success).toBe(false)
    const duplicate = config()
    duplicate.series.push(duplicate.series[0]!)
    expect(forecastConfigSchema.safeParse(duplicate).success).toBe(false)
    const huge = config(512)
    huge.growthPercent = 15
    expect(function () {
      simulateForecast(huge, [])
    }).toThrow(/512/)
  })
})
