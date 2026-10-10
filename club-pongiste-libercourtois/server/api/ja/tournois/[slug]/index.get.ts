import { defineTournamentHandler } from '~~/server/utils/tournament-handler'
import { getTournamentWithSeriesForAdmin } from '~~/server/domains/tournament/service'

/**
 * JA endpoint: returns full tournament data regardless of isPublished status.
 * Accessible to authenticated JA and admin sessions.
 */
export default defineTournamentHandler(async event => {
  const slug = getRouterParam(event, 'slug')!
  return getTournamentWithSeriesForAdmin(slug)
})
