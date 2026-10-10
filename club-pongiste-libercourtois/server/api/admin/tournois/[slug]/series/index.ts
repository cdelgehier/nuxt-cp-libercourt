import { defineTournamentHandler } from '~~/server/utils/tournament-handler'
import { createSeries } from '~~/server/domains/tournament/service'
import * as repo from '~~/server/domains/tournament/repository'

export default defineTournamentHandler(async event => {
  const slug = getRouterParam(event, 'slug')!
  const tournament = await repo.getTournamentBySlug(slug)
  if (!tournament) {
    throw createError({ statusCode: 404, message: 'Tournoi introuvable' })
  }

  if (event.method === 'GET') {
    return repo.getSeriesByTournament(tournament.id)
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    return createSeries(tournament.id, body)
  }
})
