import { getRegistrationOverview } from '~~/server/domains/tournament/registration-overview-service'

export default defineEventHandler(async function (event) {
  return getRegistrationOverview(event.context.scopedTournamentId)
})
