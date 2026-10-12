import { z } from 'zod'
import { addRegistration } from './service'
import {
  getSeriesById,
  getTournamentById,
  getRegistrationsBySeries
} from './repository'
import { buildDemoRegistrations, canFillDemoSeries } from './demo-series'

const demoInput = z.object({
  count: z.number().int().min(2).max(32).default(24)
})

/** Add fictitious entrants inside the handler's tournament transaction. */
export async function fillDemoSeries(seriesId: number, raw: unknown) {
  const series = await getSeriesById(seriesId)
  if (!series)
    throw createError({ statusCode: 404, message: 'Série introuvable' })
  const tournament = await getTournamentById(series.tournamentId)
  if (!tournament || !canFillDemoSeries(tournament.isDemo))
    throw createError({
      statusCode: 403,
      message:
        'Activez le mode Démonstration du tournoi pour utiliser cette action.'
    })
  const input = demoInput.safeParse(raw)
  if (!input.success)
    throw createError({
      statusCode: 400,
      message: 'Choisissez entre 2 et 32 participants.'
    })
  if (
    series.seriesType === 'points_limit' &&
    series.pointsLimitMin !== null &&
    series.pointsLimitMax !== null &&
    series.pointsLimitMin > series.pointsLimitMax
  )
    throw createError({
      statusCode: 400,
      message: 'Les bornes de points de la série sont incohérentes.'
    })
  const registrations = await getRegistrationsBySeries(seriesId)
  const offset = registrations.reduce(function (highest, registration) {
    const match = /^DEMO-(\d+)$/.exec(registration.licenceNumber ?? '')
    return Math.max(highest, match ? Number(match[1]) : 0)
  }, 0)
  for (const entry of buildDemoRegistrations(series, offset, input.data.count))
    await addRegistration(seriesId, entry)
  return { inserted: input.data.count }
}
