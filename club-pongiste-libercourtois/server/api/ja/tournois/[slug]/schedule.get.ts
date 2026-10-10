import { getTournamentSchedule } from '~~/server/domains/tournament/integral-service'
export default defineEventHandler(async function (event) {
  return getTournamentSchedule(event.context.scopedTournamentId)
})
