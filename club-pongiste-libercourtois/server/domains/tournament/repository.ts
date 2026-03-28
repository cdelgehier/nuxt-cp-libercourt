import { and, asc, count, eq, inArray, ne } from "drizzle-orm";
import { db } from "../../db/client";
import {
  bracketMatches,
  matchSets,
  seriesRegistrations,
  tournamentJaAccess,
  tournamentSeries,
  tournaments,
} from "./schema";
import type {
  BracketMatchWithPlayers,
  InsertBracketMatch,
  InsertJaAccess,
  InsertMatchSet,
  InsertSeriesRegistration,
  InsertTournament,
  InsertTournamentSeries,
} from "./types";

// ---------------------------------------------------------------------------
// Tournaments
// ---------------------------------------------------------------------------

export async function getAllTournaments() {
  return db.select().from(tournaments).orderBy(asc(tournaments.date));
}

export async function getPublishedTournaments() {
  return db
    .select()
    .from(tournaments)
    .where(eq(tournaments.isPublished, true))
    .orderBy(asc(tournaments.date));
}

export async function getTournamentBySlug(slug: string) {
  const rows = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.slug, slug));
  return rows[0] ?? null;
}

export async function getTournamentById(id: number) {
  const rows = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, id));
  return rows[0] ?? null;
}

export async function insertTournament(data: InsertTournament) {
  const [created] = await db.insert(tournaments).values(data).returning();
  return created!;
}

export async function updateTournament(
  id: number,
  data: Partial<InsertTournament>,
) {
  const [updated] = await db
    .update(tournaments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tournaments.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteTournament(id: number) {
  await db.delete(tournaments).where(eq(tournaments.id, id));
}

export async function slugExists(slug: string, excludeId?: number) {
  const rows = await db
    .select({ id: tournaments.id })
    .from(tournaments)
    .where(eq(tournaments.slug, slug));
  if (rows.length === 0) return false;
  if (excludeId !== undefined) return rows[0]!.id !== excludeId;
  return true;
}

// ---------------------------------------------------------------------------
// JA Access
// ---------------------------------------------------------------------------

export async function getJaAccessByTournament(tournamentId: number) {
  return db
    .select()
    .from(tournamentJaAccess)
    .where(eq(tournamentJaAccess.tournamentId, tournamentId))
    .orderBy(asc(tournamentJaAccess.createdAt));
}

export async function getJaAccessById(id: number) {
  const rows = await db
    .select()
    .from(tournamentJaAccess)
    .where(eq(tournamentJaAccess.id, id));
  return rows[0] ?? null;
}

export async function insertJaAccess(data: InsertJaAccess) {
  const [created] = await db
    .insert(tournamentJaAccess)
    .values(data)
    .returning();
  return created!;
}

export async function updateJaAccess(
  id: number,
  data: Partial<InsertJaAccess>,
) {
  const [updated] = await db
    .update(tournamentJaAccess)
    .set(data)
    .where(eq(tournamentJaAccess.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteJaAccess(id: number) {
  await db.delete(tournamentJaAccess).where(eq(tournamentJaAccess.id, id));
}

export async function touchJaAccessLastUsed(id: number) {
  await db
    .update(tournamentJaAccess)
    .set({ lastUsedAt: new Date() })
    .where(eq(tournamentJaAccess.id, id));
}

// ---------------------------------------------------------------------------
// Series
// ---------------------------------------------------------------------------

export async function getSeriesByTournament(tournamentId: number) {
  return db
    .select()
    .from(tournamentSeries)
    .where(eq(tournamentSeries.tournamentId, tournamentId))
    .orderBy(asc(tournamentSeries.sortOrder), asc(tournamentSeries.name));
}

export async function getSeriesById(id: number) {
  const rows = await db
    .select()
    .from(tournamentSeries)
    .where(eq(tournamentSeries.id, id));
  return rows[0] ?? null;
}

export async function insertSeries(data: InsertTournamentSeries) {
  const [created] = await db.insert(tournamentSeries).values(data).returning();
  return created!;
}

export async function updateSeries(
  id: number,
  data: Partial<InsertTournamentSeries>,
) {
  const [updated] = await db
    .update(tournamentSeries)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tournamentSeries.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteSeries(id: number) {
  await db.delete(tournamentSeries).where(eq(tournamentSeries.id, id));
}

export async function updateSeriesStatus(
  id: number,
  status: InsertTournamentSeries["status"],
) {
  await db
    .update(tournamentSeries)
    .set({ status, updatedAt: new Date() })
    .where(eq(tournamentSeries.id, id));
}

export async function countSeriesByTournament(tournamentId: number) {
  const [row] = await db
    .select({ count: count() })
    .from(tournamentSeries)
    .where(eq(tournamentSeries.tournamentId, tournamentId));
  return row?.count ?? 0;
}

export async function countSeriesGroupedByTournament(
  tournamentIds: number[],
): Promise<Map<number, number>> {
  if (tournamentIds.length === 0) return new Map();
  const rows = await db
    .select({ tournamentId: tournamentSeries.tournamentId, count: count() })
    .from(tournamentSeries)
    .where(inArray(tournamentSeries.tournamentId, tournamentIds))
    .groupBy(tournamentSeries.tournamentId);
  return new Map(rows.map((r) => [r.tournamentId, r.count]));
}

// ---------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------

export async function getRegistrationsBySeries(seriesId: number) {
  return db
    .select()
    .from(seriesRegistrations)
    .where(eq(seriesRegistrations.seriesId, seriesId))
    .orderBy(asc(seriesRegistrations.registeredAt));
}

export async function getActiveRegistrations(seriesId: number) {
  // Active = présent + non forfait → éligibles pour le bracket
  return db
    .select()
    .from(seriesRegistrations)
    .where(
      and(
        eq(seriesRegistrations.seriesId, seriesId),
        eq(seriesRegistrations.isForfeit, false),
        eq(seriesRegistrations.attendanceStatus, "present"),
      ),
    )
    .orderBy(asc(seriesRegistrations.registeredAt));
}

export async function getRegistrationById(id: number) {
  const rows = await db
    .select()
    .from(seriesRegistrations)
    .where(eq(seriesRegistrations.id, id));
  return rows[0] ?? null;
}

export async function insertRegistration(data: InsertSeriesRegistration) {
  const [created] = await db
    .insert(seriesRegistrations)
    .values(data)
    .returning();
  return created!;
}

export async function updateRegistration(
  id: number,
  data: Partial<InsertSeriesRegistration>,
) {
  const [updated] = await db
    .update(seriesRegistrations)
    .set(data)
    .where(eq(seriesRegistrations.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteRegistration(id: number) {
  await db.delete(seriesRegistrations).where(eq(seriesRegistrations.id, id));
}

/**
 * Update all sibling registrations for the same player across all series of the same tournament.
 * Identification: licenceNumber if available, otherwise firstName+lastName.
 */
export async function syncSiblingRegistrations(
  reg: {
    id: number;
    seriesId: number;
    licenceNumber: string | null;
    firstName: string;
    lastName: string;
  },
  data: Partial<InsertSeriesRegistration>,
) {
  const [series] = await db
    .select({ tournamentId: tournamentSeries.tournamentId })
    .from(tournamentSeries)
    .where(eq(tournamentSeries.id, reg.seriesId));
  if (!series) return;

  const allSeries = await db
    .select({ id: tournamentSeries.id })
    .from(tournamentSeries)
    .where(eq(tournamentSeries.tournamentId, series.tournamentId));

  const otherSeriesIds = allSeries
    .map((s) => s.id)
    .filter((id) => id !== reg.seriesId);
  if (otherSeriesIds.length === 0) return;

  const playerCondition = reg.licenceNumber
    ? eq(seriesRegistrations.licenceNumber, reg.licenceNumber)
    : and(
        eq(seriesRegistrations.firstName, reg.firstName),
        eq(seriesRegistrations.lastName, reg.lastName),
      );

  await db
    .update(seriesRegistrations)
    .set(data)
    .where(
      and(
        inArray(seriesRegistrations.seriesId, otherSeriesIds),
        playerCondition,
        ne(seriesRegistrations.id, reg.id),
      ),
    );
}

export async function countRegistrations(seriesId: number) {
  const [row] = await db
    .select({ count: count() })
    .from(seriesRegistrations)
    .where(eq(seriesRegistrations.seriesId, seriesId));
  return row?.count ?? 0;
}

export async function countRegistrationsGroupedBySeries(
  seriesIds: number[],
): Promise<Map<number, number>> {
  if (seriesIds.length === 0) return new Map();
  const rows = await db
    .select({ seriesId: seriesRegistrations.seriesId, count: count() })
    .from(seriesRegistrations)
    .where(inArray(seriesRegistrations.seriesId, seriesIds))
    .groupBy(seriesRegistrations.seriesId);
  return new Map(rows.map((r) => [r.seriesId, r.count]));
}

export async function countRegistrationsGroupedByTournament(
  tournamentIds: number[],
): Promise<Map<number, number>> {
  if (tournamentIds.length === 0) return new Map();
  const rows = await db
    .select({ tournamentId: tournamentSeries.tournamentId, count: count() })
    .from(seriesRegistrations)
    .innerJoin(
      tournamentSeries,
      eq(seriesRegistrations.seriesId, tournamentSeries.id),
    )
    .where(inArray(tournamentSeries.tournamentId, tournamentIds))
    .groupBy(tournamentSeries.tournamentId);
  return new Map(rows.map((r) => [r.tournamentId, r.count]));
}

// ---------------------------------------------------------------------------
// Bracket matches
// ---------------------------------------------------------------------------

/**
 * Returns all matches for a series, enriched with player and set data.
 * Uses multiple queries assembled in JS to avoid complex Drizzle join syntax.
 */
export async function getMatchesBySeries(
  seriesId: number,
): Promise<BracketMatchWithPlayers[]> {
  const [matches, registrations, allSets] = await Promise.all([
    db
      .select()
      .from(bracketMatches)
      .where(eq(bracketMatches.seriesId, seriesId))
      .orderBy(asc(bracketMatches.round), asc(bracketMatches.matchNumber)),
    db
      .select()
      .from(seriesRegistrations)
      .where(eq(seriesRegistrations.seriesId, seriesId)),
    db
      .select()
      .from(matchSets)
      .orderBy(asc(matchSets.matchId), asc(matchSets.setNumber)),
  ]);

  const regMap = new Map(registrations.map((r) => [r.id, r]));
  const setsByMatch = new Map<number, typeof allSets>();
  for (const s of allSets) {
    if (!setsByMatch.has(s.matchId)) setsByMatch.set(s.matchId, []);
    setsByMatch.get(s.matchId)!.push(s);
  }

  return matches.map((m) => ({
    ...m,
    player1: m.player1Id ? (regMap.get(m.player1Id) ?? null) : null,
    player2: m.player2Id ? (regMap.get(m.player2Id) ?? null) : null,
    winner: m.winnerId ? (regMap.get(m.winnerId) ?? null) : null,
    sets: setsByMatch.get(m.id) ?? [],
  }));
}

export async function getMatchById(id: number) {
  const rows = await db
    .select()
    .from(bracketMatches)
    .where(eq(bracketMatches.id, id));
  return rows[0] ?? null;
}

export async function insertMatches(data: InsertBracketMatch[]) {
  if (data.length === 0) return [];
  return db.insert(bracketMatches).values(data).returning();
}

export async function updateMatch(
  id: number,
  data: Partial<InsertBracketMatch>,
) {
  const [updated] = await db
    .update(bracketMatches)
    .set(data)
    .where(eq(bracketMatches.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteMatchesBySeries(seriesId: number) {
  await db.delete(bracketMatches).where(eq(bracketMatches.seriesId, seriesId));
}

// ---------------------------------------------------------------------------
// Sets
// ---------------------------------------------------------------------------

export async function getSetsByMatch(matchId: number) {
  return db
    .select()
    .from(matchSets)
    .where(eq(matchSets.matchId, matchId))
    .orderBy(asc(matchSets.setNumber));
}

export async function insertSets(data: InsertMatchSet[]) {
  if (data.length === 0) return [];
  return db.insert(matchSets).values(data).returning();
}

export async function deleteSetsByMatch(matchId: number) {
  await db.delete(matchSets).where(eq(matchSets.matchId, matchId));
}
