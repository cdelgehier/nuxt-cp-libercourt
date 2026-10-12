import { defineTournamentHandler } from '~~/server/utils/tournament-handler'
import { fillDemoSeries } from '~~/server/domains/tournament/demo-service'

export default defineTournamentHandler(async function (event) {
  return fillDemoSeries(
    Number(getRouterParam(event, 'id')),
    await readBody(event)
  )
})
