import bcrypt from "bcryptjs";
import * as repo from "./repository";
import {
  buildBracket,
  computeMatchWinner,
  createFirstRoundSlots,
  generateSlug,
  getRoundLabel,
  seedPlayers,
  validateSet,
} from "./helpers";
import {
  createJaAccessInputSchema,
  createSeriesInputSchema,
  createTournamentInputSchema,
  enterScoreInputSchema,
  jaPinAuthInputSchema,
  patchRegistrationInputSchema,
  swapPlayersInputSchema,
  updateSeriesInputSchema,
  updateTournamentInputSchema,
  upsertRegistrationInputSchema,
} from "./types";
import type {
  BracketRound,
  InsertBracketMatch,
  SeriesWithBracket,
  TournamentWithSeries,
} from "./types";

// ---------------------------------------------------------------------------
// Tournaments
// ---------------------------------------------------------------------------

async function enrichTournaments<T extends { id: number }>(tournaments: T[]) {
  const ids = tournaments.map((t) => t.id);
  const [seriesCounts, regCounts] = await Promise.all([
    repo.countSeriesGroupedByTournament(ids),
    repo.countRegistrationsGroupedByTournament(ids),
  ]);
  return tournaments.map((t) => ({
    ...t,
    seriesCount: seriesCounts.get(t.id) ?? 0,
    totalRegistrants: regCounts.get(t.id) ?? 0,
  }));
}

export async function getAllTournamentsForAdmin() {
  return enrichTournaments(await repo.getAllTournaments());
}

export async function getPublishedTournamentsForPublic() {
  return enrichTournaments(await repo.getPublishedTournaments());
}

async function getTournamentWithSeries(
  slug: string,
  requirePublished: boolean,
): Promise<TournamentWithSeries> {
  const tournament = await repo.getTournamentBySlug(slug);
  if (!tournament || (requirePublished && !tournament.isPublished)) {
    throw createError({ statusCode: 404, message: "Tournoi introuvable" });
  }
  const series = await repo.getSeriesByTournament(tournament.id);
  const counts = await repo.countRegistrationsGroupedBySeries(
    series.map((s) => s.id),
  );
  return {
    ...tournament,
    series: series.map((s) => ({
      ...s,
      registrationCount: counts.get(s.id) ?? 0,
    })),
  };
}

export function getTournamentWithSeriesForPublic(
  slug: string,
): Promise<TournamentWithSeries> {
  return getTournamentWithSeries(slug, true);
}

export function getTournamentWithSeriesForAdmin(
  slug: string,
): Promise<TournamentWithSeries> {
  return getTournamentWithSeries(slug, false);
}

async function ensureUniqueSlug(
  name: string,
  excludeId?: number,
): Promise<string> {
  let slug = generateSlug(name);
  let suffix = 0;
  while (await repo.slugExists(slug, excludeId)) {
    suffix++;
    slug = `${generateSlug(name)}-${suffix}`;
  }
  return slug;
}

export async function createTournament(input: unknown) {
  const data = createTournamentInputSchema.parse(input);
  const slug = await ensureUniqueSlug(data.name);
  return repo.insertTournament({ ...data, slug });
}

export async function updateTournament(id: number, input: unknown) {
  const data = updateTournamentInputSchema.parse(input);

  if (data.name) {
    (data as typeof data & { slug?: string }).slug = await ensureUniqueSlug(
      data.name,
      id,
    );
  }

  const updated = await repo.updateTournament(id, data);
  if (!updated) {
    throw createError({ statusCode: 404, message: "Tournoi introuvable" });
  }
  return updated;
}

export async function deleteTournament(id: number) {
  const existing = await repo.getTournamentById(id);
  if (!existing) {
    throw createError({ statusCode: 404, message: "Tournoi introuvable" });
  }
  await repo.deleteTournament(id);
}

// ---------------------------------------------------------------------------
// JA Access
// ---------------------------------------------------------------------------

export async function getJaAccess(tournamentId: number) {
  return repo.getJaAccessByTournament(tournamentId);
}

export async function createJaAccess(tournamentId: number, input: unknown) {
  const data = createJaAccessInputSchema.parse(input);
  const tournament = await repo.getTournamentById(tournamentId);
  if (!tournament) {
    throw createError({ statusCode: 404, message: "Tournoi introuvable" });
  }
  const hashedPin = await bcrypt.hash(data.pin, 10);
  return repo.insertJaAccess({
    tournamentId,
    name: data.name,
    pin: hashedPin,
  });
}

export async function updateJaAccess(
  id: number,
  data: { name?: string; isActive?: boolean },
) {
  const existing = await repo.getJaAccessById(id);
  if (!existing) {
    throw createError({ statusCode: 404, message: "Accès JA introuvable" });
  }
  const updated = await repo.updateJaAccess(id, data);
  return updated!;
}

export async function deleteJaAccess(id: number) {
  const existing = await repo.getJaAccessById(id);
  if (!existing) {
    throw createError({ statusCode: 404, message: "Accès JA introuvable" });
  }
  await repo.deleteJaAccess(id);
}

/**
 * Verifies a JA PIN and returns the access record on success.
 * Also validates the access belongs to the expected tournament.
 */
export async function verifyJaPin(
  input: unknown,
  expectedTournamentId?: number,
) {
  const data = jaPinAuthInputSchema.parse(input);
  const access = await repo.getJaAccessById(data.jaAccessId);

  if (!access || !access.isActive) {
    throw createError({
      statusCode: 401,
      message: "Code d'accès invalide ou désactivé",
    });
  }
  if (expectedTournamentId && access.tournamentId !== expectedTournamentId) {
    throw createError({ statusCode: 403, message: "Accès non autorisé" });
  }

  const valid = await bcrypt.compare(data.pin, access.pin);
  if (!valid) {
    throw createError({
      statusCode: 401,
      message: "Code d'accès invalide",
    });
  }

  await repo.touchJaAccessLastUsed(access.id);
  return access;
}

// ---------------------------------------------------------------------------
// Series
// ---------------------------------------------------------------------------

export async function getSeriesWithBracket(
  seriesId: number,
): Promise<SeriesWithBracket> {
  const series = await repo.getSeriesById(seriesId);
  if (!series) {
    throw createError({ statusCode: 404, message: "Série introuvable" });
  }
  const [registrations, matches] = await Promise.all([
    repo.getRegistrationsBySeries(seriesId),
    repo.getMatchesBySeries(seriesId),
  ]);

  // Group matches into rounds with labels
  const roundNumbers = [...new Set(matches.map((m) => m.round))].sort(
    (a, b) => b - a,
  ); // descending: first round first
  const totalRounds = roundNumbers.length > 0 ? Math.max(...roundNumbers) : 0;

  const rounds: BracketRound[] = roundNumbers.map((r) => ({
    round: r,
    label: getRoundLabel(r, totalRounds),
    matches: matches.filter((m) => m.round === r),
  }));

  return { ...series, registrations, rounds };
}

export async function createSeries(tournamentId: number, input: unknown) {
  const tournament = await repo.getTournamentById(tournamentId);
  if (!tournament) {
    throw createError({ statusCode: 404, message: "Tournoi introuvable" });
  }
  const data = createSeriesInputSchema.parse(input);
  return repo.insertSeries({ ...data, tournamentId });
}

export async function updateSeries(id: number, input: unknown) {
  const series = await repo.getSeriesById(id);
  if (!series) {
    throw createError({ statusCode: 404, message: "Série introuvable" });
  }
  if (series.status === "in_progress" || series.status === "finished") {
    throw createError({
      statusCode: 400,
      message: "Impossible de modifier une série en cours ou terminée",
    });
  }
  const data = updateSeriesInputSchema.parse(input);
  const updated = await repo.updateSeries(id, data);
  return updated!;
}

export async function deleteSeries(id: number) {
  const series = await repo.getSeriesById(id);
  if (!series) {
    throw createError({ statusCode: 404, message: "Série introuvable" });
  }
  if (series.status !== "draft" && series.status !== "registration") {
    throw createError({
      statusCode: 400,
      message: "Impossible de supprimer une série dont le tableau est généré",
    });
  }
  await repo.deleteSeries(id);
}

export async function openRegistrations(seriesId: number) {
  const series = await repo.getSeriesById(seriesId);
  if (!series) {
    throw createError({ statusCode: 404, message: "Série introuvable" });
  }
  if (series.status !== "draft") {
    throw createError({
      statusCode: 400,
      message:
        "Les inscriptions ne peuvent être ouvertes que depuis 'brouillon'",
    });
  }
  await repo.updateSeriesStatus(seriesId, "registration");
}

// ---------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------

export async function addRegistration(seriesId: number, input: unknown) {
  const series = await repo.getSeriesById(seriesId);
  if (!series) {
    throw createError({ statusCode: 404, message: "Série introuvable" });
  }
  if (series.status === "finished") {
    throw createError({
      statusCode: 400,
      message: "Les inscriptions sont fermées pour une série terminée",
    });
  }

  const data = upsertRegistrationInputSchema.parse(input);

  // Check player limit
  if (series.maxPlayers !== null) {
    const count = await repo.countRegistrations(seriesId);
    if (count >= series.maxPlayers) {
      throw createError({
        statusCode: 400,
        message: `La série est complète (${series.maxPlayers} joueurs max)`,
      });
    }
  }

  // Doubles require partner info
  if (series.seriesFormat === "doubles") {
    if (!data.partnerFirstName || !data.partnerLastName) {
      throw createError({
        statusCode: 400,
        message: "Le prénom et nom du partenaire sont requis pour un double",
      });
    }
  }

  // Female-only check — hard block for known male players
  if (series.femalesOnly && data.playerGender === "M") {
    throw createError({
      statusCode: 400,
      message: "Cette série est réservée aux joueuses féminines",
    });
  }

  // Points limit check — for doubles, compare the pair's combined ranking
  if (series.seriesType === "points_limit" && data.ranking !== undefined) {
    const effectiveRanking =
      series.seriesFormat === "doubles" && data.partnerRanking !== undefined
        ? data.ranking + data.partnerRanking
        : data.ranking;

    if (
      series.pointsLimitMin !== null &&
      effectiveRanking < series.pointsLimitMin
    ) {
      const label =
        series.seriesFormat === "doubles"
          ? "Somme des classements"
          : "Classement";
      throw createError({
        statusCode: 400,
        message: `${label} insuffisant (minimum ${series.pointsLimitMin} pts)`,
      });
    }
    if (
      series.pointsLimitMax !== null &&
      effectiveRanking > series.pointsLimitMax
    ) {
      const label =
        series.seriesFormat === "doubles"
          ? "Somme des classements"
          : "Classement";
      throw createError({
        statusCode: 400,
        message: `${label} trop élevé (maximum ${series.pointsLimitMax} pts)`,
      });
    }
  }

  const registration = await repo.insertRegistration({ ...data, seriesId });

  // Soft age-category check — warning only, never a hard block
  let categoryWarning: string | null = null;
  if (
    series.ageCategories.length > 0 &&
    data.playerCategory &&
    !series.ageCategories.includes(data.playerCategory)
  ) {
    const { AGE_CATEGORY_LABELS } = await import("./types");
    const playerLabel =
      AGE_CATEGORY_LABELS[data.playerCategory] ?? data.playerCategory;
    const allowedLabels = series.ageCategories
      .map(
        (c) => AGE_CATEGORY_LABELS[c as keyof typeof AGE_CATEGORY_LABELS] ?? c,
      )
      .join(", ");
    categoryWarning = `Attention : ${playerLabel} inscrit dans une série réservée aux ${allowedLabels}`;
  }

  return { registration, warning: categoryWarning };
}

export async function updateRegistration(id: number, input: unknown) {
  const existing = await repo.getRegistrationById(id);
  if (!existing) {
    throw createError({ statusCode: 404, message: "Inscription introuvable" });
  }
  const data = patchRegistrationInputSchema.parse(input);
  const updated = await repo.updateRegistration(id, data);

  // Sync player-level fields across all series in the same tournament
  // isForfeit is NOT synced from doubles registrations: a pair forfeit (e.g. partner
  // injured) must not forfeit the other player's individual matches
  const syncFields: Parameters<typeof repo.syncSiblingRegistrations>[1] = {};
  if (data.attendanceStatus !== undefined)
    syncFields.attendanceStatus = data.attendanceStatus;
  if (data.paymentStatus !== undefined)
    syncFields.paymentStatus = data.paymentStatus;
  if (data.isForfeit !== undefined) {
    const series = await repo.getSeriesById(existing.seriesId);
    if (series?.seriesFormat !== "doubles") {
      syncFields.isForfeit = data.isForfeit;
    }
  }
  if (Object.keys(syncFields).length > 0) {
    await repo.syncSiblingRegistrations(existing, syncFields);
  }

  return updated!;
}

export async function removeRegistration(id: number) {
  const existing = await repo.getRegistrationById(id);
  if (!existing) {
    throw createError({ statusCode: 404, message: "Inscription introuvable" });
  }
  await repo.deleteRegistration(id);
}

// ---------------------------------------------------------------------------
// Bracket
// ---------------------------------------------------------------------------

export async function generateBracket(seriesId: number) {
  const series = await repo.getSeriesById(seriesId);
  if (!series) {
    throw createError({ statusCode: 404, message: "Série introuvable" });
  }
  if (series.status !== "registration" && series.status !== "draft") {
    throw createError({
      statusCode: 400,
      message:
        "Le tableau ne peut être généré que depuis 'brouillon' ou 'inscriptions'",
    });
  }
  // Auto-transition draft → registration before generating
  if (series.status === "draft") {
    await repo.updateSeriesStatus(seriesId, "registration");
  }

  const activePlayers = await repo.getActiveRegistrations(seriesId);
  if (activePlayers.length < 2) {
    throw createError({
      statusCode: 400,
      message: "Il faut au moins 2 joueurs présents pour générer le tableau",
    });
  }

  const seeded = seedPlayers(activePlayers);
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(seeded.length)));
  const slots = buildBracket(seeded.length);
  const firstRoundSlots = createFirstRoundSlots(seeded, bracketSize);

  // Delete any existing matches (safety)
  await repo.deleteMatchesBySeries(seriesId);

  // Pass 1: insert all matches without nextMatchId
  const matchData: InsertBracketMatch[] = slots.map((slot) => ({
    seriesId,
    round: slot.round,
    matchNumber: slot.matchNumber,
    status: "pending" as const,
  }));
  const inserted = await repo.insertMatches(matchData);

  // Pass 2: update nextMatchId using the slot links
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]!;
    if (slot.nextMatchIndex === -1) continue; // final
    const parent = inserted[slot.nextMatchIndex];
    if (!parent) continue;
    await repo.updateMatch(inserted[i]!.id, {
      nextMatchId: parent.id,
      nextMatchSlot: slot.nextMatchSlot,
    });
  }

  // Assign players to first round
  const maxRound = Math.max(...slots.map((x) => x.round));
  const firstRound = slots
    .map((s, i) => ({ ...s, dbId: inserted[i]!.id }))
    .filter((s) => s.round === maxRound);

  for (let i = 0; i < firstRound.length; i++) {
    const slot = firstRound[i]!;
    const p1 = firstRoundSlots[i * 2] ?? null;
    const p2 = firstRoundSlots[i * 2 + 1] ?? null;

    await repo.updateMatch(slot.dbId, {
      player1Id: p1?.id ?? null,
      player2Id: p2?.id ?? null,
    });
  }

  // Auto-advance BYE slots (player2 is null → player1 wins immediately)
  for (let i = 0; i < firstRound.length; i++) {
    const slot = firstRound[i]!;
    const p1 = firstRoundSlots[i * 2] ?? null;
    const p2 = firstRoundSlots[i * 2 + 1] ?? null;
    if (p2 === null && p1 !== null) {
      await repo.updateMatch(slot.dbId, {
        status: "finished",
        winnerId: p1.id,
        finishedAt: new Date(),
      });
      // Propagate to parent
      if (slot.nextMatchIndex !== -1) {
        const parentId = inserted[slot.nextMatchIndex]!.id;
        const playerKey = slot.nextMatchSlot === 1 ? "player1Id" : "player2Id";
        await repo.updateMatch(parentId, { [playerKey]: p1.id });
      }
    }
  }

  // Transition to bracket_generated
  await repo.updateSeriesStatus(seriesId, "bracket_generated");

  return repo.getMatchesBySeries(seriesId);
}

export async function dropBracket(seriesId: number) {
  const series = await repo.getSeriesById(seriesId);
  if (!series) {
    throw createError({ statusCode: 404, message: "Série introuvable" });
  }
  if (series.status !== "bracket_generated") {
    throw createError({
      statusCode: 400,
      message:
        "Le tableau ne peut être supprimé que depuis le statut 'tableau prêt'",
    });
  }
  await repo.deleteMatchesBySeries(seriesId);
  await repo.updateSeriesStatus(seriesId, "registration");
}

export async function regenerateBracket(seriesId: number) {
  const series = await repo.getSeriesById(seriesId);
  if (!series) {
    throw createError({ statusCode: 404, message: "Série introuvable" });
  }
  if (series.status !== "bracket_generated") {
    throw createError({
      statusCode: 400,
      message:
        "La régénération n'est possible que depuis le statut 'tableau prêt'",
    });
  }
  // Step back to registration to allow generateBracket guard to pass
  await repo.updateSeriesStatus(seriesId, "registration");
  return generateBracket(seriesId);
}

export async function swapPlayersInBracket(seriesId: number, input: unknown) {
  const series = await repo.getSeriesById(seriesId);
  if (!series) {
    throw createError({ statusCode: 404, message: "Série introuvable" });
  }
  if (series.status !== "bracket_generated") {
    throw createError({
      statusCode: 400,
      message: "L'échange n'est possible que sur un tableau non démarré",
    });
  }

  const { registrationId1, registrationId2 } =
    swapPlayersInputSchema.parse(input);

  const matches = await repo.getMatchesBySeries(seriesId);
  const maxRound = Math.max(...matches.map((m) => m.round));
  const firstRoundMatches = matches.filter((m) => m.round === maxRound);

  // Find which match/slot each registration occupies
  type Slot = { matchId: number; slot: 1 | 2 };
  let slotA: Slot | null = null;
  let slotB: Slot | null = null;

  for (const m of firstRoundMatches) {
    if (m.player1Id === registrationId1) slotA = { matchId: m.id, slot: 1 };
    if (m.player2Id === registrationId1) slotA = { matchId: m.id, slot: 2 };
    if (m.player1Id === registrationId2) slotB = { matchId: m.id, slot: 1 };
    if (m.player2Id === registrationId2) slotB = { matchId: m.id, slot: 2 };
  }

  if (!slotA || !slotB) {
    throw createError({
      statusCode: 400,
      message: "Un ou plusieurs joueurs introuvables dans le premier tour",
    });
  }

  // Perform the swap
  const keyA = slotA.slot === 1 ? "player1Id" : "player2Id";
  const keyB = slotB.slot === 1 ? "player1Id" : "player2Id";

  await repo.updateMatch(slotA.matchId, { [keyA]: registrationId2 });
  await repo.updateMatch(slotB.matchId, { [keyB]: registrationId1 });

  // Re-apply BYE logic for affected matches.
  // In bracket_generated status, any finished first-round match is a BYE auto-advance.
  // After a swap: a match that gained a real opponent must be reset to pending;
  // a match that lost its opponent (now has a BYE) must auto-advance the remaining player.
  const updatedMatches = await repo.getMatchesBySeries(seriesId);
  const affectedIds = [slotA.matchId, slotB.matchId];

  for (const matchId of affectedIds) {
    const match = updatedMatches.find((m) => m.id === matchId);
    if (!match) continue;

    const isByeMatch =
      (match.player1Id !== null && match.player2Id === null) ||
      (match.player1Id === null && match.player2Id !== null);

    const wasAutoAdvanced =
      match.player1Id !== null &&
      match.player2Id !== null &&
      match.status === "finished" &&
      (match.sets?.length ?? 0) === 0;

    if (isByeMatch) {
      // Auto-advance the remaining player
      const winnerId = (match.player1Id ?? match.player2Id)!;
      await repo.updateMatch(matchId, {
        status: "finished",
        winnerId,
        finishedAt: new Date(),
      });
      if (match.nextMatchId) {
        const playerKey = match.nextMatchSlot === 1 ? "player1Id" : "player2Id";
        await repo.updateMatch(match.nextMatchId, { [playerKey]: winnerId });
      }
    } else if (wasAutoAdvanced) {
      // Was a BYE, now has two real players — reset to pending and clear parent slot
      await repo.updateMatch(matchId, {
        status: "pending",
        winnerId: null,
        finishedAt: null,
      });
      if (match.nextMatchId) {
        const playerKey = match.nextMatchSlot === 1 ? "player1Id" : "player2Id";
        await repo.updateMatch(match.nextMatchId, { [playerKey]: null });
      }
    }
  }
}

export async function startSeries(seriesId: number) {
  const series = await repo.getSeriesById(seriesId);
  if (!series) {
    throw createError({ statusCode: 404, message: "Série introuvable" });
  }
  if (series.status !== "bracket_generated") {
    throw createError({
      statusCode: 400,
      message: "La série doit être au statut 'tableau prêt' pour démarrer",
    });
  }
  await repo.updateSeriesStatus(seriesId, "in_progress");
}

// ---------------------------------------------------------------------------
// Score entry (JA)
// ---------------------------------------------------------------------------

export async function enterMatchScore(
  matchId: number,
  input: unknown,
  jaAccessId: number | null,
) {
  const match = await repo.getMatchById(matchId);
  if (!match) {
    throw createError({ statusCode: 404, message: "Match introuvable" });
  }

  const isCorrection =
    match.status === "finished" || match.status === "forfeit";
  if (isCorrection) {
    // Allow correction only if the next match hasn't been played yet
    if (match.nextMatchId) {
      const nextMatch = await repo.getMatchById(match.nextMatchId);
      if (
        nextMatch &&
        (nextMatch.status === "finished" || nextMatch.status === "forfeit")
      ) {
        throw createError({
          statusCode: 400,
          message: "Correction impossible : le match suivant a déjà été joué",
        });
      }
      // Clear the winner slot in the next match so it waits for the corrected result
      const playerKey = match.nextMatchSlot === 1 ? "player1Id" : "player2Id";
      await repo.updateMatch(match.nextMatchId, { [playerKey]: null });
    }
    // Reset current match to pending so the rest of the flow works normally
    await repo.updateMatch(matchId, {
      status: "pending",
      winnerId: null,
      finishedAt: null,
    });
  }

  const series = await repo.getSeriesById(match.seriesId);
  if (!series || series.status !== "in_progress") {
    throw createError({
      statusCode: 400,
      message: "La série n'est pas en cours",
    });
  }

  const { sets } = enterScoreInputSchema.parse(input);

  // Validate each set
  for (const [i, set] of sets.entries()) {
    if (!validateSet(set.score1, set.score2, series.pointsPerSet)) {
      throw createError({
        statusCode: 400,
        message: `Set ${i + 1} invalide (${set.score1}-${set.score2}) — vérifiez les règles ping-pong`,
      });
    }
  }

  const winner = computeMatchWinner(sets, series.setsToWin);
  if (!winner) {
    throw createError({
      statusCode: 400,
      message: "Le score ne désigne pas encore de vainqueur",
    });
  }

  const winnerId = winner === 1 ? match.player1Id : match.player2Id;
  if (!winnerId) {
    throw createError({ statusCode: 400, message: "Joueur introuvable" });
  }

  // Delete previous sets (in case of correction)
  await repo.deleteSetsByMatch(matchId);

  // Insert sets
  await repo.insertSets(
    sets.map((s, i) => ({
      matchId,
      setNumber: i + 1,
      score1: s.score1,
      score2: s.score2,
    })),
  );

  // Update match
  await repo.updateMatch(matchId, {
    status: "finished",
    winnerId,
    enteredByJaId: jaAccessId ?? undefined,
    finishedAt: new Date(),
  });

  // Propagate winner to next match
  await propagateWinner(matchId, winnerId);
  await checkSeriesCompletion(match.seriesId);

  return repo.getMatchesBySeries(match.seriesId);
}

export async function enterForfeit(
  matchId: number,
  winnerId: number,
  jaAccessId: number | null,
) {
  const match = await repo.getMatchById(matchId);
  if (!match) {
    throw createError({ statusCode: 404, message: "Match introuvable" });
  }
  if (match.status === "finished" || match.status === "forfeit") {
    throw createError({
      statusCode: 400,
      message: "Ce match est déjà terminé",
    });
  }

  const series = await repo.getSeriesById(match.seriesId);
  if (!series || series.status !== "in_progress") {
    throw createError({
      statusCode: 400,
      message: "La série n'est pas en cours",
    });
  }

  if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
    throw createError({
      statusCode: 400,
      message: "Le vainqueur doit être l'un des deux joueurs du match",
    });
  }

  await repo.updateMatch(matchId, {
    status: "forfeit",
    winnerId,
    enteredByJaId: jaAccessId ?? undefined,
    finishedAt: new Date(),
  });

  // Mark the forfeiting player's registration as isForfeit = true
  // Do NOT sync to sibling series for doubles: one player injured doesn't forfeit
  // the other player's individual matches
  const forfeiterId =
    winnerId === match.player1Id ? match.player2Id : match.player1Id;
  if (forfeiterId) {
    await repo.updateRegistration(forfeiterId, { isForfeit: true });
    if (series.seriesFormat !== "doubles") {
      const forfeiterReg = await repo.getRegistrationById(forfeiterId);
      if (forfeiterReg) {
        await repo.syncSiblingRegistrations(forfeiterReg, { isForfeit: true });
      }
    }
  }

  await propagateWinner(matchId, winnerId);
  await checkSeriesCompletion(match.seriesId);
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

async function propagateWinner(matchId: number, winnerId: number) {
  const match = await repo.getMatchById(matchId);
  if (!match?.nextMatchId) return;

  const playerKey = match.nextMatchSlot === 1 ? "player1Id" : "player2Id";
  await repo.updateMatch(match.nextMatchId, { [playerKey]: winnerId });
}

async function checkSeriesCompletion(seriesId: number) {
  const matches = await repo.getMatchesBySeries(seriesId);
  // Ignore placeholder matches where both slots are still empty (bracket not yet fully populated)
  const playable = matches.filter(
    (m) => m.player1Id !== null || m.player2Id !== null,
  );
  if (playable.length === 0) return;
  const allDone = playable.every(
    (m) => m.status === "finished" || m.status === "forfeit",
  );
  if (allDone) {
    await repo.updateSeriesStatus(seriesId, "finished");
  }
}
