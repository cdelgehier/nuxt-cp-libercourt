import { defineTournamentHandler } from '~~/server/utils/tournament-handler'
import { openRegistrations } from '~~/server/domains/tournament/service'

export default defineTournamentHandler(async event => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'ID invalide' })
  await openRegistrations(id)
  return { success: true }
})
