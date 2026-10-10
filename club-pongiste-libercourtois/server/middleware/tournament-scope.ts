import { eq } from 'drizzle-orm'
import { tournamentDb } from '../db/tournament-client'
import {
  tournaments,
  tournamentSeries,
  seriesRegistrations,
  bracketMatches,
  tournamentJaAccess
} from '../domains/tournament/schema'
import { checkTournamentScope } from '../domains/tournament/access'

/** Resolve URL ownership for both existing and integral tournament endpoints. */
export default defineEventHandler(async function (event) {
  const path = event.path.split('?')[0]!
  const match =
    /^\/api\/(admin\/|ja\/)?tournois\/([^/]+)(?:\/series\/(\d+))?(?:\/(?:registrations\/(\d+)|matches\/(\d+)|ja-access\/(\d+)))?/.exec(
      path
    )
  if (!match) return
  const [tournament] = await tournamentDb
    .select()
    .from(tournaments)
    .where(eq(tournaments.slug, decodeURIComponent(match[2]!)))
  if (!tournament)
    throw createError({ statusCode: 404, message: 'Tournoi introuvable' })
  const publicRead = !match[1]
  if (publicRead && path.endsWith('/ja-accesses')) {
    event.context.scopedTournamentId = tournament.id
    return
  }
  const session = await useSession(event, {
    password: process.env.SESSION_SECRET ?? 'fallback-change-me-in-production'
  })
  const isAdmin = event.context.tournamentAdmin === true
  const jaTournamentId =
    typeof session.data.jaTournamentId === 'number'
      ? session.data.jaTournamentId
      : null
  const seriesId = match[3] ? Number(match[3]) : null
  const [series] = seriesId
    ? await tournamentDb
        .select()
        .from(tournamentSeries)
        .where(eq(tournamentSeries.id, seriesId))
    : []
  if (seriesId && !series)
    throw createError({ statusCode: 404, message: 'Série introuvable' })
  try {
    checkTournamentScope(
      tournament.id,
      series?.tournamentId ?? null,
      jaTournamentId,
      isAdmin,
      tournament.isPublished,
      publicRead
    )
  } catch (error) {
    throw createError({
      statusCode:
        publicRead || (series && series.tournamentId !== tournament.id)
          ? 404
          : 403,
      message: error instanceof Error ? error.message : 'Accès interdit'
    })
  }
  if (!publicRead && !isAdmin) {
    const [access] = await tournamentDb
      .select()
      .from(tournamentJaAccess)
      .where(eq(tournamentJaAccess.id, Number(session.data.jaAccessId)))
    if (!access?.isActive || access.tournamentId !== tournament.id)
      throw createError({ statusCode: 403, message: 'Accès JA désactivé' })
  }
  if (match[4]) {
    const [registration] = await tournamentDb
      .select()
      .from(seriesRegistrations)
      .where(eq(seriesRegistrations.id, Number(match[4])))
    if (!registration || registration.seriesId !== seriesId)
      throw createError({ statusCode: 404, message: 'Inscription introuvable' })
  }
  if (match[5] && !path.includes('/integral/')) {
    const [game] = await tournamentDb
      .select()
      .from(bracketMatches)
      .where(eq(bracketMatches.id, Number(match[5])))
    if (!game || game.seriesId !== seriesId)
      throw createError({ statusCode: 404, message: 'Match introuvable' })
  }
  if (match[6]) {
    const [access] = await tournamentDb
      .select()
      .from(tournamentJaAccess)
      .where(eq(tournamentJaAccess.id, Number(match[6])))
    if (!access || access.tournamentId !== tournament.id)
      throw createError({ statusCode: 404, message: 'Accès JA introuvable' })
  }
  event.context.scopedTournamentId = tournament.id
})
