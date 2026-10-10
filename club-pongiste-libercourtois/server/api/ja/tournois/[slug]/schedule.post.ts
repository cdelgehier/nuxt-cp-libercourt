import { scheduleTournament } from '~~/server/domains/tournament/integral-service'
export default defineEventHandler(async function (event) {
  return scheduleTournament(
    event.context.scopedTournamentId,
    await readBody(event)
  )
})
