import { getIntegral } from '~~/server/domains/tournament/integral-service'
export default defineEventHandler(async function (event) {
  const snapshot = await getIntegral(Number(getRouterParam(event, 'id')))
  return (
    snapshot.state?.matches.filter(function (match) {
      return match.status === 'pending' || match.status === 'in_progress'
    }) ?? []
  )
})
