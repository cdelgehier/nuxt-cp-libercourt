import type { H3Event } from 'h3'
import { withTournamentWrite } from '../db/tournament-client'

/** Serialize roster and settings edits with sporting progression in the same tournament. */
export function defineTournamentHandler<T>(
  handler: (_event: H3Event) => Promise<T>
) {
  return defineEventHandler(async function (event) {
    if (event.method === 'GET') return handler(event)
    return withTournamentWrite(
      Number(event.context.scopedTournamentId ?? 0),
      function () {
        return handler(event)
      }
    )
  })
}
