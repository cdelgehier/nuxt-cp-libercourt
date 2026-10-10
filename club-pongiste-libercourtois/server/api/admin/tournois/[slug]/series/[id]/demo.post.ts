import { z } from 'zod'
import { defineTournamentHandler } from '~~/server/utils/tournament-handler'
import { addRegistration } from '~~/server/domains/tournament/service'
import {
  getSeriesById,
  getRegistrationsBySeries
} from '~~/server/domains/tournament/repository'
import {
  canFillDemoSeries,
  buildDemoRegistrations
} from '~~/server/domains/tournament/demo-series'

export default defineTournamentHandler(async function (event) {
  if (
    !canFillDemoSeries(
      import.meta.dev,
      process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL
    )
  ) {
    throw createError({
      statusCode: 404,
      message:
        'Remplissage disponible uniquement en développement sur une base locale.'
    })
  }
  const input = z
    .object({ count: z.number().int().min(2).max(32).default(24) })
    .safeParse(await readBody(event))
  if (!input.success)
    throw createError({
      statusCode: 400,
      message: 'Choisissez entre 2 et 32 participants.'
    })
  const { count } = input.data
  const id = Number(getRouterParam(event, 'id'))
  const series = await getSeriesById(id)
  if (!series)
    throw createError({ statusCode: 404, message: 'Série introuvable' })
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
  const registrations = await getRegistrationsBySeries(id)
  const offset = registrations.reduce(function (highest, registration) {
    const match = /^DEMO-(\d+)$/.exec(registration.licenceNumber ?? '')
    return Math.max(highest, match ? Number(match[1]) : 0)
  }, 0)
  for (const entry of buildDemoRegistrations(series, offset, count)) {
    await addRegistration(id, entry)
  }
  return { inserted: count }
})
