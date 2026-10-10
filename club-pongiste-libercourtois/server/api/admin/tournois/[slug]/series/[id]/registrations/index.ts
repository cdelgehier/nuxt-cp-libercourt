import { defineTournamentHandler } from '~~/server/utils/tournament-handler'
import { addRegistration } from '~~/server/domains/tournament/service'
import * as repo from '~~/server/domains/tournament/repository'

export default defineTournamentHandler(async event => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'ID invalide' })

  if (event.method === 'GET') {
    return repo.getRegistrationsBySeries(id)
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    return addRegistration(id, body)
  }
})
