import { getForecast } from '~~/server/domains/tournament/forecast-service'
export default defineEventHandler(async function (event) {
  return getForecast(event.context.scopedTournamentId)
})
