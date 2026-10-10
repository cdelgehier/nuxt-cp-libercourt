import { defineTournamentHandler } from '~~/server/utils/tournament-handler'
import { getAllTournamentsForAdmin } from '~~/server/domains/tournament/service'

export default defineTournamentHandler(async () => {
  return getAllTournamentsForAdmin()
})
