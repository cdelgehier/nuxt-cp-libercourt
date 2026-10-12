import { saveForecast } from '~~/server/domains/tournament/forecast-service'
export default defineEventHandler(async function (event) {
  return saveForecast(event.context.scopedTournamentId, await readBody(event))
})
