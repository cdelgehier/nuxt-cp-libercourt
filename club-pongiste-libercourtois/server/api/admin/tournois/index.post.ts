import { defineTournamentHandler } from '~~/server/utils/tournament-handler'
import { createTournament } from '~~/server/domains/tournament/service'

export default defineTournamentHandler(async event => {
  const body = await readBody(event)
  return createTournament(body)
})
