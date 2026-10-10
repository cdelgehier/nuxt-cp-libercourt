export default defineEventHandler(function () {
  throw createError({
    statusCode: 409,
    message: 'Utilisez le poste du tournoi intégral et actualisez cette page.'
  })
})
