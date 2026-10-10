export default defineEventHandler(function () {
  throw createError({
    statusCode: 409,
    message:
      'Utilisez le poste du tournoi intégral (poules, barrages, classement).'
  })
})
