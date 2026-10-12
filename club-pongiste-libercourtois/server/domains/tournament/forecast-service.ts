import { eq } from 'drizzle-orm'
import {
  tournamentDb,
  tournamentStore,
  withTournamentWrite
} from '../../db/tournament-client'
import {
  tournaments,
  tournamentSeries,
  seriesRegistrations,
  tournamentForecasts
} from './schema'
import {
  DEFAULT_FORECAST_ENTRANTS,
  forecastConfigSchema,
  forecastSaveSchema
} from '../../../shared/tournament-forecast'
import type {
  ForecastConfig,
  ForecastDocument
} from '../../../shared/tournament-forecast'
import {
  forecastRoster,
  simulateForecast,
  validateForecastAssumptions
} from './forecast'

/** Read only the tournament roster, without exposing any player data in the API. */
async function forecastContext(tournamentId: number) {
  const [tournament] = await tournamentStore
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
  if (!tournament)
    throw createError({ statusCode: 404, message: 'Tournoi introuvable' })
  const series = await tournamentStore
    .select()
    .from(tournamentSeries)
    .where(eq(tournamentSeries.tournamentId, tournamentId))
    .orderBy(tournamentSeries.sortOrder, tournamentSeries.id)
  const rows = await tournamentStore
    .select({ registration: seriesRegistrations })
    .from(seriesRegistrations)
    .innerJoin(
      tournamentSeries,
      eq(seriesRegistrations.seriesId, tournamentSeries.id)
    )
    .where(eq(tournamentSeries.tournamentId, tournamentId))
  const registrations = rows.map(function (row) {
    return row.registration
  })
  return { tournament, series, registrations }
}
type Context = Awaited<ReturnType<typeof forecastContext>>

/** Restrict every real reference to the authorized tournament. */
export function validateForecastReferences(
  config: ForecastConfig,
  series: Context['series']
): void {
  for (const entry of config.series) {
    if (entry.seriesId === null) continue
    const real = series.find(function (row) {
      return row.id === entry.seriesId
    })
    if (!real)
      throw createError({
        statusCode: 400,
        message:
          'Une série référencée n’appartient pas à ce tournoi. Retirez-la de la prévision.'
      })
    if (entry.format !== real.seriesFormat)
      throw createError({
        statusCode: 400,
        message:
          'Le format de la série réelle a changé. Actualisez la prévision.'
      })
  }
}

/** Copy dates and capacity once; later edits never change the announced programme. */
function initialConfig(context: Context): ForecastConfig {
  const dates = new Set([
    context.tournament.date,
    ...context.series.map(function (series) {
      return series.seriesDate
    })
  ])
  const start = new Date(`${context.tournament.date}T12:00:00Z`),
    end = new Date(
      `${context.tournament.dateEnd ?? context.tournament.date}T12:00:00Z`
    )
  for (let date = start.getTime(); date <= end.getTime(); date += 86_400_000)
    dates.add(new Date(date).toISOString().slice(0, 10))
  return forecastConfigSchema.parse({
    days: [...dates].sort().map(function (date) {
      return { date, opening: '09:00', closing: '20:00' }
    }),
    tableCount: context.tournament.tableCount,
    growthPercent: 15,
    durationMarginPercent: 15,
    restMinutes: 10,
    series: context.series.map(function (series) {
      const count = forecastRoster(context.registrations, series.id).length
      return {
        key: `series-${series.id}`,
        seriesId: series.id,
        name: series.name,
        format: series.seriesFormat,
        type:
          series.seriesType === 'speedy'
            ? 'speedy'
            : series.seriesType === 'handicap'
              ? 'handicap'
              : 'standard',
        mode: count ? 'registrations' : 'estimated',
        estimatedEntrants: count || DEFAULT_FORECAST_ENTRANTS,
        date: series.seriesDate,
        startTime: series.startTime,
        matchMinutes: series.seriesType === 'speedy' ? 10 : 30,
        tableCap: null
      }
    })
  })
}

/** Return saved hypotheses and current registration counts, never simulated results. */
export async function getForecast(
  tournamentId: number
): Promise<ForecastDocument> {
  const context = await forecastContext(tournamentId)
  const [saved] = await tournamentDb
    .select()
    .from(tournamentForecasts)
    .where(eq(tournamentForecasts.tournamentId, tournamentId))
  return {
    config: saved?.config ?? initialConfig(context),
    version: saved?.version ?? 0,
    updatedAt: saved?.updatedAt.toISOString() ?? null,
    availableSeries: context.series.map(function (series) {
      return {
        id: series.id,
        name: series.name,
        format: series.seriesFormat,
        type:
          series.seriesType === 'speedy'
            ? 'speedy'
            : series.seriesType === 'handicap'
              ? 'handicap'
              : 'standard',
        registrations: forecastRoster(context.registrations, series.id).length
      }
    })
  }
}

/** A stale browser must not overwrite a colleague's saved assumptions. */
export async function saveForecast(tournamentId: number, raw: unknown) {
  const parsed = forecastSaveSchema.safeParse(raw)
  if (!parsed.success)
    throw createError({
      statusCode: 400,
      message: parsed.error.issues
        .map(function (issue) {
          return issue.message
        })
        .join(', ')
    })
  return withTournamentWrite(tournamentId, async function () {
    const context = await forecastContext(tournamentId)
    validateForecastReferences(parsed.data.config, context.series)
    // Check projected limits using current registrations before persisting.
    try {
      validateForecastAssumptions(parsed.data.config, context.registrations)
    } catch (error) {
      throw createError({
        statusCode: 400,
        message:
          error instanceof Error ? error.message : 'Hypothèses invalides.'
      })
    }
    const [saved] = await tournamentStore
      .select()
      .from(tournamentForecasts)
      .where(eq(tournamentForecasts.tournamentId, tournamentId))
    if (parsed.data.version !== (saved?.version ?? 0))
      throw createError({
        statusCode: 409,
        message:
          'La prévision a été modifiée. Rechargez-la avant d’enregistrer. Vos saisies sont conservées.'
      })
    const updatedAt = new Date(),
      version = (saved?.version ?? 0) + 1
    await tournamentStore
      .insert(tournamentForecasts)
      .values({ tournamentId, config: parsed.data.config, version, updatedAt })
      .onConflictDoUpdate({
        target: tournamentForecasts.tournamentId,
        set: { config: parsed.data.config, version, updatedAt }
      })
    return { version, updatedAt: updatedAt.toISOString() }
  })
}

/** POST is read-only: all matches and resource calendars stay in memory. */
export async function runForecast(tournamentId: number, raw: unknown) {
  const parsed = forecastConfigSchema.safeParse(raw)
  if (!parsed.success)
    throw createError({
      statusCode: 400,
      message: parsed.error.issues
        .map(function (issue) {
          return issue.message
        })
        .join(', ')
    })
  const context = await forecastContext(tournamentId)
  validateForecastReferences(parsed.data, context.series)
  try {
    return simulateForecast(parsed.data, context.registrations)
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Calcul impossible.'
    })
  }
}
