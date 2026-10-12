import { eq } from 'drizzle-orm'
import { tournamentDb } from '../../db/tournament-client'
import { seriesRegistrations, tournamentSeries } from './schema'
import { buildRegistrationOverview } from './registration-overview'

/** Read all tournament registrations in two queries, regardless of series count. */
export async function getRegistrationOverview(tournamentId: number) {
  const [series, rows] = await Promise.all([
    tournamentDb
      .select()
      .from(tournamentSeries)
      .where(eq(tournamentSeries.tournamentId, tournamentId))
      .orderBy(tournamentSeries.sortOrder, tournamentSeries.id),
    tournamentDb
      .select({ registration: seriesRegistrations })
      .from(seriesRegistrations)
      .innerJoin(
        tournamentSeries,
        eq(seriesRegistrations.seriesId, tournamentSeries.id)
      )
      .where(eq(tournamentSeries.tournamentId, tournamentId))
      .orderBy(seriesRegistrations.registeredAt, seriesRegistrations.id)
  ])
  return buildRegistrationOverview(
    series,
    rows.map(function (row) {
      return row.registration
    })
  )
}
