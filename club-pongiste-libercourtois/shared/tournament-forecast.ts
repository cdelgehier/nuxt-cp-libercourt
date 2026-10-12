import { z } from 'zod'

export const DEFAULT_FORECAST_ENTRANTS = 12

/** Forecasts store assumptions only, never sporting data or player identities. */
const dateSchema = z.iso.date()
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
export const forecastSeriesSchema = z.strictObject({
  key: z.string().min(1).max(80),
  seriesId: z.number().int().positive().nullable(),
  name: z.string().trim().min(1).max(150),
  format: z.enum(['singles', 'doubles']),
  type: z.enum(['standard', 'speedy', 'handicap']),
  mode: z.enum(['estimated', 'registrations']),
  estimatedEntrants: z.number().int().min(0).max(512),
  date: dateSchema,
  startTime: timeSchema,
  matchMinutes: z.number().int().min(1).max(240),
  tableCap: z.number().int().min(1).max(200).nullable()
})
export const forecastConfigSchema = z
  .strictObject({
    days: z
      .array(
        z.strictObject({
          date: dateSchema,
          opening: timeSchema,
          closing: timeSchema
        })
      )
      .min(1)
      .max(31),
    tableCount: z.number().int().min(1).max(200),
    growthPercent: z.number().min(0).max(100),
    durationMarginPercent: z.number().min(0).max(100),
    restMinutes: z.number().int().min(0).max(120),
    series: z.array(forecastSeriesSchema).max(64)
  })
  .superRefine(function (config, ctx) {
    const dates = new Set<string>()
    for (const [index, day] of config.days.entries()) {
      if (dates.has(day.date) || day.opening >= day.closing)
        ctx.addIssue({
          code: 'custom',
          path: ['days', index],
          message: 'Journée répétée ou fermeture avant l’ouverture.'
        })
      dates.add(day.date)
    }
    const keys = new Set<string>(),
      ids = new Set<number>()
    for (const [index, series] of config.series.entries()) {
      if (
        keys.has(series.key) ||
        (series.seriesId !== null && ids.has(series.seriesId))
      )
        ctx.addIssue({
          code: 'custom',
          path: ['series', index],
          message: 'Série répétée.'
        })
      keys.add(series.key)
      if (series.seriesId !== null) ids.add(series.seriesId)
      if (!dates.has(series.date))
        ctx.addIssue({
          code: 'custom',
          path: ['series', index, 'date'],
          message: 'Choisissez une journée de la prévision.'
        })
      if (series.mode === 'registrations' && series.seriesId === null)
        ctx.addIssue({
          code: 'custom',
          path: ['series', index, 'mode'],
          message: 'Une série hypothétique nécessite un effectif estimé.'
        })
    }
  })
export const forecastSaveSchema = z.strictObject({
  config: forecastConfigSchema,
  version: z.number().int().nonnegative()
})
export type ForecastConfig = z.infer<typeof forecastConfigSchema>
export type ForecastSeries = ForecastConfig['series'][number]
export interface ForecastPhase {
  name: 'pools' | 'playoffs' | 'placement'
  matches: number
  start: string | null
  end: string | null
}
export interface ForecastBlock {
  key: string
  name: string
  baseEntrants: number
  projectedEntrants: number
  effectiveMatchMinutes: number
  poolCount: number
  matchCount: number
  requestedStart: string
  start: string | null
  end: string | null
  delayMinutes: number
  tableDelayMinutes: number
  playerDelayMinutes: number
  overrunMinutes: number
  status: 'scheduled' | 'insufficient'
  phases: ForecastPhase[]
}
export interface ForecastMatch {
  seriesKey: string
  id: number
  phase: ForecastPhase['name']
  poolId: number | null
  table: number
  start: string
  end: string
}
export interface ForecastOccupancy {
  start: string
  end: string
  tables: number
  bySeries: Record<string, number>
}
export interface ForecastResult {
  series: ForecastBlock[]
  matches: ForecastMatch[]
  occupancy: ForecastOccupancy[]
  lastEnd: string | null
}
export interface ForecastDocument {
  config: ForecastConfig
  version: number
  updatedAt: string | null
  availableSeries: {
    id: number
    name: string
    format: 'singles' | 'doubles'
    type: 'standard' | 'speedy' | 'handicap'
    registrations: number
  }[]
}
