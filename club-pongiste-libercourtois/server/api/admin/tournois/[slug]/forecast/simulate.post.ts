import { runForecast } from '~~/server/domains/tournament/forecast-service'
export default defineEventHandler(async function (event) {
  return runForecast(event.context.scopedTournamentId, await readBody(event))
})
