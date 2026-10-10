import { getSeriesById } from '~~/server/domains/tournament/repository'
export default defineEventHandler(async function (event) {
  return getSeriesById(Number(getRouterParam(event, 'id')))
})
