import { z } from "zod";
import type { BracketSide, SeriesRegistration } from "./types";

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

/**
 * Returns a human-readable label for a Losers Bracket round.
 * The losers bracket is displayed in natural order (LB R1 first, LB Final last).
 * `roundIndex` is 0-based (0 = first LB round, totalLBRounds-1 = LB Final).
 */
export function getLBRoundLabel(
  roundIndex: number,
  totalLBRounds: number,
): string {
  const remaining = totalLBRounds - roundIndex;
  if (remaining === 1) return "Finale LB";
  if (remaining === 2) return "Demi-finale LB";
  if (remaining === 3) return "Quarts LB";
  return `Tour ${roundIndex + 1} LB`;
}

// ---------------------------------------------------------------------------
// Double Elimination bracket building
// ---------------------------------------------------------------------------

/**
 * Extended bracket slot for double elimination.
 * In addition to the winner path (nextMatchIndex), tracks where the loser goes.
 */
export interface DEBracketSlot {
  side: BracketSide;
  round: number; // 1-based, 1 = finale de ce bracket
  matchNumber: number; // 1-based within the round
  /** Index in the global DEBracketSlot[] array. -1 = no next match (winner is champion). */
  nextMatchIndex: number;
  nextMatchSlot: 1 | 2;
  /** Index in the global DEBracketSlot[] array for the loser. -1 = eliminated (LB/GF match). */
  loserNextMatchIndex: number;
  loserNextMatchSlot: 1 | 2;
}

export interface DEBracketResult {
  /** All slots in insertion order: WB first, then LB, then GF. */
  slots: DEBracketSlot[];
  /** Indices into `slots` for Winners Bracket slots, ordered WB R1 → WB Final. */
  wbIndices: number[];
  /** Indices into `slots` for Losers Bracket slots, ordered LB R1 → LB Final. */
  lbIndices: number[];
  /** Index into `slots` for the Grand Final slot. */
  gfIndex: number;
}

/**
 * Builds the complete double-elimination bracket structure.
 *
 * Structure for bracketSize = 2^k:
 *   - Winners Bracket (WB): k rounds, identical to single-elimination.
 *   - Losers Bracket (LB): 2*(k-1) rounds.
 *       Odd  LB rounds (1, 3, 5…): receive losers injected from WB.
 *       Even LB rounds (2, 4, 6…): pure LB matches (no WB injection).
 *   - Grand Final (GF): 1 match.
 *
 * BYE rule: WB BYE matches (player2=null) do NOT generate a loser entry
 * (loserNextMatchIndex=-1). The caller must enforce this during player assignment.
 */
export function buildDoubleEliminationBracket(
  playerCount: number,
): DEBracketResult {
  if (playerCount < 2) {
    throw new Error("Il faut au moins 2 joueurs pour générer un tableau");
  }

  const bracketSize = Math.pow(2, Math.ceil(Math.log2(playerCount)));
  const k = Math.log2(bracketSize); // WB rounds count
  const lbRoundsCount = 2 * (k - 1); // total LB rounds

  const slots: DEBracketSlot[] = [];
  const wbIndices: number[] = [];
  const lbIndices: number[] = [];

  // -------------------------------------------------------------------------
  // Phase 1 — Build Winners Bracket (WB)
  // WB rounds go from round=k (first round) down to round=1 (WB Final).
  // Displayed in order: WB R(k) first, WB Final last → we push them that way.
  // -------------------------------------------------------------------------
  for (let r = k; r >= 1; r--) {
    const matchesInRound = bracketSize / Math.pow(2, k - r + 1);
    for (let m = 1; m <= matchesInRound; m++) {
      wbIndices.push(slots.length);
      slots.push({
        side: "winners",
        round: r,
        matchNumber: m,
        nextMatchIndex: -1, // filled in Phase 3
        nextMatchSlot: 1,
        loserNextMatchIndex: -1, // filled in Phase 4
        loserNextMatchSlot: 1,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Phase 2 — Build Losers Bracket (LB)
  // LB rounds are numbered 1..lbRoundsCount where 1 = LB Final, lbRoundsCount = LB R1.
  // For display, we push them in natural order: LB R1 first (index 0 in lbIndices).
  // -------------------------------------------------------------------------
  // Compute match counts per LB round (index 0 = LB R1, last = LB Final).
  // LB round i (0-based) has bracketSize / (4 * 2^floor(i/2)) matches.
  const lbMatchCounts: number[] = [];
  for (let i = 0; i < lbRoundsCount; i++) {
    lbMatchCounts.push(bracketSize / (4 * Math.pow(2, Math.floor(i / 2))));
  }

  // Push LB slots in display order: LB R1 (i=0) → LB Final (i=lbRoundsCount-1)
  for (let i = 0; i < lbRoundsCount; i++) {
    const lbRoundNumber = lbRoundsCount - i; // round=lbRoundsCount → first round, round=1 → final
    const matchCount = lbMatchCounts[i]!;
    for (let m = 1; m <= matchCount; m++) {
      lbIndices.push(slots.length);
      slots.push({
        side: "losers",
        round: lbRoundNumber,
        matchNumber: m,
        nextMatchIndex: -1,
        nextMatchSlot: 1,
        loserNextMatchIndex: -1, // losers in LB are eliminated
        loserNextMatchSlot: 1,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Phase 3 — Grand Final slot
  // -------------------------------------------------------------------------
  const gfIndex = slots.length;
  slots.push({
    side: "grand_final",
    round: 1,
    matchNumber: 1,
    nextMatchIndex: -1,
    nextMatchSlot: 1,
    loserNextMatchIndex: -1,
    loserNextMatchSlot: 1,
  });

  // -------------------------------------------------------------------------
  // Phase 4 — Link WB internal progression (winner → next WB match)
  // -------------------------------------------------------------------------
  for (const idx of wbIndices) {
    const slot = slots[idx]!;
    if (slot.round === 1) {
      // WB Final winner → Grand Final slot 1
      slot.nextMatchIndex = gfIndex;
      slot.nextMatchSlot = 1;
    } else {
      const parentMatchNumber = Math.ceil(slot.matchNumber / 2);
      const parentRound = slot.round - 1;
      const parentIdx = wbIndices.find(
        (i) =>
          slots[i]!.round === parentRound &&
          slots[i]!.matchNumber === parentMatchNumber,
      );
      if (parentIdx !== undefined) {
        slot.nextMatchIndex = parentIdx;
        slot.nextMatchSlot = slot.matchNumber % 2 === 1 ? 1 : 2;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Phase 5 — Link LB internal progression (winner → next LB match or GF)
  // -------------------------------------------------------------------------
  for (let i = 0; i < lbIndices.length; i++) {
    const idx = lbIndices[i]!;
    const slot = slots[idx]!;

    if (slot.round === 1) {
      // LB Final winner → Grand Final slot 2
      slot.nextMatchIndex = gfIndex;
      slot.nextMatchSlot = 2;
    } else {
      // Find the next LB round slot (one step closer to LB Final)
      const nextLBRound = slot.round - 1;

      if (nextLBRound % 2 === 0) {
        // Next round is a pure-LB round (even round number): winners within same match pair
        const nextMatchNumber = Math.ceil(slot.matchNumber / 2);
        const nextIdx = lbIndices.find(
          (j) =>
            slots[j]!.round === nextLBRound &&
            slots[j]!.matchNumber === nextMatchNumber,
        );
        if (nextIdx !== undefined) {
          slot.nextMatchIndex = nextIdx;
          slot.nextMatchSlot = slot.matchNumber % 2 === 1 ? 1 : 2;
        }
      } else {
        // Next round is an injection round (odd round number): LB winner is slot 1
        const nextIdx = lbIndices.find(
          (j) =>
            slots[j]!.round === nextLBRound &&
            slots[j]!.matchNumber === slot.matchNumber,
        );
        if (nextIdx !== undefined) {
          slot.nextMatchIndex = nextIdx;
          slot.nextMatchSlot = 1; // slot 2 will be filled by WB loser injection
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Phase 6 — Cross-link WB → LB (loserNextMatchIndex)
  //
  // Structure A (standard DE): WB round r injects into LB at displayIndex (k - r).
  //   - WB R{k} (first round) → LB displayIndex 0: BOTH slots filled by WB losers (ratio=2)
  //   - WB R{k-1}..R{2}      → LB displayIndex 1..k-2: slot 1 from LB winner, slot 2 from WB loser (ratio=1)
  //   - WB Final (r=1)        → LB Final (displayIndex = lbRoundsCount - 1), slot 2
  //
  // lbMatchNumber:
  //   - First WB round (wbRound === k, ratio=2): ceil(matchNumber / 2)
  //   - All others (ratio=1): matchNumber (1:1)
  //
  // loserNextMatchSlot:
  //   - targetLBRoundIndex === 0 (LB R1, both slots from WB): mirror — odd WB match → slot 2, even → slot 1
  //   - targetLBRoundIndex > 0 (LB winner in slot 1): always slot 2
  // -------------------------------------------------------------------------
  for (const idx of wbIndices) {
    const slot = slots[idx]!;
    const wbRound = slot.round; // r=k is first WB round, r=1 is WB Final

    let targetLBRoundIndex: number;
    if (wbRound === 1) {
      // WB Final loser → LB Final
      targetLBRoundIndex = lbRoundsCount - 1;
    } else {
      // WB round r injects into LB at displayIndex (k - r)
      targetLBRoundIndex = k - wbRound;
    }

    // LB match number:
    // First WB round has twice as many matches as LB R1 → pair them (ratio 2:1)
    // All other WB rounds pair 1:1 with their target LB round
    const lbMatchNumber =
      wbRound === k ? Math.ceil(slot.matchNumber / 2) : slot.matchNumber;

    // Slot within LB match:
    // - LB R1 (targetLBRoundIndex === 0): both slots from WB losers → mirror placement
    // - Other injection rounds: slot 1 reserved for LB winner → WB loser takes slot 2
    const lbSlotNumber =
      targetLBRoundIndex === 0
        ? slot.matchNumber % 2 === 1
          ? 2
          : 1 // mirror: odd → 2, even → 1
        : 2;

    const lbTargetIdx = lbIndices.find((j) => {
      const lbSlot = slots[j]!;
      // Convert round number to displayIndex: round=lbRoundsCount → displayIndex=0
      const displayIndex = lbRoundsCount - lbSlot.round;
      return (
        displayIndex === targetLBRoundIndex &&
        lbSlot.matchNumber === lbMatchNumber
      );
    });

    if (lbTargetIdx !== undefined) {
      slot.loserNextMatchIndex = lbTargetIdx;
      slot.loserNextMatchSlot = lbSlotNumber;
    }
  }

  return { slots, wbIndices, lbIndices, gfIndex };
}
