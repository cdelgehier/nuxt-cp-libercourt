import { z } from "zod";
import type { SeriesRegistration } from "./types";

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

/**
 * Generates a URL-friendly slug from a tournament name.
 * e.g. "Open Libercourtois 2025" → "open-libercourtois-2025"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ---------------------------------------------------------------------------
// Score parsing
// ---------------------------------------------------------------------------

/**
 * Parses a score string like "11-4 11-5 11-13 11-8" into an array of set scores.
 * Throws a ZodError with a readable message if the format is invalid.
 */
export function parseScoreString(
  input: string,
): { score1: number; score2: number }[] {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["score"],
        message: "La saisie des scores ne peut pas être vide",
      },
    ]);
  }

  const tokens = trimmed.split(/\s+/);
  const sets: { score1: number; score2: number }[] = [];

  for (const token of tokens) {
    const parts = token.split("-");
    if (parts.length !== 2) {
      throw new z.ZodError([
        {
          code: "custom",
          path: ["score"],
          message: `Format invalide "${token}" — attendu : "11-4"`,
        },
      ]);
    }
    const score1 = parseInt(parts[0]!, 10);
    const score2 = parseInt(parts[1]!, 10);
    if (isNaN(score1) || isNaN(score2)) {
      throw new z.ZodError([
        {
          code: "custom",
          path: ["score"],
          message: `Scores non numériques dans "${token}"`,
        },
      ]);
    }
    sets.push({ score1, score2 });
  }

  return sets;
}

// ---------------------------------------------------------------------------
// Set validation
// ---------------------------------------------------------------------------

/**
 * Validates a single ping-pong set according to table tennis rules.
 * - Standard: first to 11 points, must lead by 2 (deuce possible above 10-10)
 * - Speedy: first to 3 points, must lead by 2
 */
export function validateSet(
  score1: number,
  score2: number,
  pointsPerSet: number,
): boolean {
  if (score1 < 0 || score2 < 0) return false;

  const maxScore = Math.max(score1, score2);
  const minScore = Math.min(score1, score2);
  const diff = maxScore - minScore;

  // Winner must have at least pointsPerSet points
  if (maxScore < pointsPerSet) return false;

  // Must win by at least 2
  if (diff < 2) return false;

  // If both players are at or above pointsPerSet-1 (deuce territory),
  // there is no upper cap — any score with a 2-point lead is valid.
  // If no deuce: winner must have exactly pointsPerSet (not more)
  if (minScore < pointsPerSet - 1 && maxScore > pointsPerSet) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Match winner computation
// ---------------------------------------------------------------------------

/**
 * Determines the winner of a match from the set scores.
 * Returns 1 (player 1 wins), 2 (player 2 wins), or null (match not finished).
 */
export function computeMatchWinner(
  sets: { score1: number; score2: number }[],
  setsToWin: number,
): 1 | 2 | null {
  let wins1 = 0;
  let wins2 = 0;

  for (const set of sets) {
    if (set.score1 > set.score2) wins1++;
    else if (set.score2 > set.score1) wins2++;
  }

  if (wins1 >= setsToWin) return 1;
  if (wins2 >= setsToWin) return 2;
  return null;
}

// ---------------------------------------------------------------------------
// Bracket building
// ---------------------------------------------------------------------------

export interface BracketSlot {
  round: number; // 1 = final, N = first round
  matchNumber: number; // 1-based position within the round
  nextMatchIndex: number; // index in the returned array (-1 for the final)
  nextMatchSlot: 1 | 2; // which slot the winner fills in the next match
}

/**
 * Builds the bracket structure for a single-elimination tournament.
 * Returns an ordered list of bracket slots (first round first, final last).
 * The caller is responsible for assigning players and persisting to DB.
 *
 * Algorithm:
 *  1. Compute bracket size = next power of 2 >= playerCount
 *  2. Distribute byes to top-seeded slots (first round only)
 *  3. Link each match to its parent via nextMatchIndex/nextMatchSlot
 */
export function buildBracket(playerCount: number): BracketSlot[] {
  if (playerCount < 2) {
    throw new Error("Il faut au moins 2 joueurs pour générer un tableau");
  }

  // Next power of 2
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(playerCount)));
  const roundCount = Math.log2(bracketSize);

  // Pass 1: create all slots without nextMatchIndex (set to -1 as placeholder)
  const slots: BracketSlot[] = [];
  // Build from first round (highest round number) down to final (round 1)
  for (let r = roundCount; r >= 1; r--) {
    const matchesInRound = bracketSize / Math.pow(2, roundCount - r + 1);
    for (let m = 1; m <= matchesInRound; m++) {
      slots.push({
        round: r,
        matchNumber: m,
        nextMatchIndex: -1, // filled in pass 2
        nextMatchSlot: 1, // filled in pass 2
      });
    }
  }

  // Pass 2: link each non-final match to its parent
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]!;
    if (slot.round === 1) continue; // final has no parent

    const parentMatchNumber = Math.ceil(slot.matchNumber / 2);
    const parentRound = slot.round - 1;

    const parentIndex = slots.findIndex(
      (s) => s.round === parentRound && s.matchNumber === parentMatchNumber,
    );

    slot.nextMatchIndex = parentIndex;
    slot.nextMatchSlot = slot.matchNumber % 2 === 1 ? 1 : 2;
  }

  return slots;
}

// ---------------------------------------------------------------------------
// Player seeding
// ---------------------------------------------------------------------------

/**
 * Sorts registrations for standard tournament seeding.
 * Best-ranked player (highest ranking points) = seed 1.
 * Uses the classic bracket seeding pattern so seeds 1 and 2 meet in the final,
 * seeds 1/4 and 2/3 meet in the semis, etc.
 */
export function seedPlayers(
  registrations: SeriesRegistration[],
): SeriesRegistration[] {
  // Sort by ranking descending (unranked players go last)
  const sorted = [...registrations].sort((a, b) => {
    if (a.ranking === null && b.ranking === null) return 0;
    if (a.ranking === null) return 1;
    if (b.ranking === null) return -1;
    return b.ranking - a.ranking;
  });

  return sorted;
}

/**
 * Creates the ordered player-or-null slot array for first-round assignment.
 *
 * BYEs are given to the TOP seeds (standard convention: best players are
 * rewarded for their seeding by skipping the first round).
 *
 * Example — 30 players, bracketSize 32, byeCount 2:
 *   [seed1, null, seed2, null, seed3, seed4, seed5, seed6, ..., seed29, seed30]
 *   → seed1 vs BYE, seed2 vs BYE, seed3 vs seed4, ..., seed29 vs seed30
 */
export function createFirstRoundSlots(
  seeded: SeriesRegistration[],
  bracketSize: number,
): (SeriesRegistration | null)[] {
  const byeCount = bracketSize - seeded.length;
  const slots: (SeriesRegistration | null)[] = [];

  // Top `byeCount` seeds each get a BYE (they advance automatically)
  for (let i = 0; i < byeCount; i++) {
    slots.push(seeded[i] ?? null); // the seeded player
    slots.push(null); // their BYE opponent
  }

  // Remaining players fill consecutive pairs
  for (let i = byeCount; i < seeded.length; i++) {
    slots.push(seeded[i] ?? null);
  }

  return slots;
}

// ---------------------------------------------------------------------------
// Round label helper
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable label for a bracket round.
 * round=1 → "Finale", round=2 → "Demi-finales", etc.
 */
export function getRoundLabel(round: number, totalRounds: number): string {
  if (round === 1) return "Finale";
  if (round === 2) return "Demi-finales";
  if (round === 3) return "Quarts de finale";
  return `${totalRounds - round + 1}e tour`;
}
