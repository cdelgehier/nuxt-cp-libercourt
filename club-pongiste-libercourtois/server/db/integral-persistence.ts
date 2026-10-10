import { eq } from 'drizzle-orm'
import type { tournamentDb } from './tournament-client'
import type { IntegralState } from '../domains/tournament/integral'
import { integralRows } from '../domains/tournament/integral-storage'
import {
  integralPools,
  integralPoolMembers,
  integralPhases,
  integralRanges,
  integralMatches,
  integralSets,
  integralPlacements
} from '../domains/tournament/schema'

type Transaction = Parameters<Parameters<typeof tournamentDb.transaction>[0]>[0]

/** Keep sporting tables and the replay snapshot in the caller's locked transaction. */
export async function persistIntegralRows(
  tx: Transaction,
  seriesId: number,
  state: IntegralState | null
): Promise<void> {
  const rows = integralRows(seriesId, state)
  await tx.delete(integralMatches).where(eq(integralMatches.seriesId, seriesId))
  await tx.delete(integralPools).where(eq(integralPools.seriesId, seriesId))
  await tx.delete(integralPhases).where(eq(integralPhases.seriesId, seriesId))
  await tx.delete(integralRanges).where(eq(integralRanges.seriesId, seriesId))
  await tx
    .delete(integralPlacements)
    .where(eq(integralPlacements.seriesId, seriesId))
  if (rows.phases.length) await tx.insert(integralPhases).values(rows.phases)
  if (rows.pools.length) await tx.insert(integralPools).values(rows.pools)
  if (rows.members.length)
    await tx.insert(integralPoolMembers).values(rows.members)
  if (rows.ranges.length) await tx.insert(integralRanges).values(rows.ranges)
  if (rows.matches.length) await tx.insert(integralMatches).values(rows.matches)
  if (rows.sets.length) await tx.insert(integralSets).values(rows.sets)
  if (rows.placements.length)
    await tx.insert(integralPlacements).values(rows.placements)
}
