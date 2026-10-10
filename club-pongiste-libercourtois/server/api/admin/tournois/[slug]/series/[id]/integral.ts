import {
  executeIntegral,
  getIntegral
} from '~~/server/domains/tournament/integral-service'
export default defineEventHandler(async function (event) {
  const id = Number(getRouterParam(event, 'id'))
  if (event.method === 'GET') return getIntegral(id)
  if (event.method === 'POST') return executeIntegral(id, await readBody(event))
  throw createError({ statusCode: 405, message: 'Méthode non autorisée' })
})
