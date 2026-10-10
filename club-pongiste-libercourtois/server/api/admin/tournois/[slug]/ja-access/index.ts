import { defineTournamentHandler } from '~~/server/utils/tournament-handler'
import {
  createJaAccess,
  getJaAccess
} from '~~/server/domains/tournament/service'
import * as repo from '~~/server/domains/tournament/repository'

export default defineTournamentHandler(async event => {
  const slug = getRouterParam(event, 'slug')!
  const tournament = await repo.getTournamentBySlug(slug)
  if (!tournament) {
    throw createError({ statusCode: 404, message: 'Tournoi introuvable' })
  }

  if (event.method === 'GET') {
    return getJaAccess(tournament.id)
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    return createJaAccess(tournament.id, body)
  }
})
