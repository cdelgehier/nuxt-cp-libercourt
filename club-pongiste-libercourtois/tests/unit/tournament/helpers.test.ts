import { ZodError } from "zod";
import { describe, expect, it } from "vitest";
import {
  buildBracket,
  buildDoubleEliminationBracket,
  computeMatchWinner,
  generateSlug,
  getLBRoundLabel,
  getRoundLabel,
  parseScoreString,
  seedPlayers,
  validateSet,
} from "../../../server/domains/tournament/helpers";
import type { SeriesRegistration } from "../../../server/domains/tournament/types";

// ---------------------------------------------------------------------------
// generateSlug
// ---------------------------------------------------------------------------

describe("generateSlug", () => {
  it("converts spaces to hyphens", () => {
    expect(generateSlug("Open Libercourt 2025")).toBe("open-libercourt-2025");
  });

  it("lowercases the string", () => {
    expect(generateSlug("OPEN LIBERCOURT")).toBe("open-libercourt");
  });

  it("strips diacritics", () => {
    expect(generateSlug("Tournoi Été Île-de-France")).toBe(
      "tournoi-ete-ile-de-france",
    );
  });

  it("removes special characters", () => {
    expect(generateSlug("Open (2025) !")).toBe("open-2025");
  });

  it("collapses multiple hyphens", () => {
    expect(generateSlug("Open  --  2025")).toBe("open-2025");
  });

  it("trims leading/trailing whitespace", () => {
    expect(generateSlug("  open  ")).toBe("open");
  });
});

// ---------------------------------------------------------------------------
// parseScoreString
// ---------------------------------------------------------------------------

describe("parseScoreString", () => {
  it("parses a standard 3-set match", () => {
    expect(parseScoreString("11-4 11-5 11-8")).toEqual([
      { score1: 11, score2: 4 },
      { score1: 11, score2: 5 },
      { score1: 11, score2: 8 },
    ]);
  });

  it("parses a 4-set match with a deuce set", () => {
    expect(parseScoreString("11-4 11-5 11-13 11-8")).toEqual([
      { score1: 11, score2: 4 },
      { score1: 11, score2: 5 },
      { score1: 11, score2: 13 },
      { score1: 11, score2: 8 },
    ]);
  });

  it("parses a speedy match (3-1)", () => {
    expect(parseScoreString("3-1")).toEqual([{ score1: 3, score2: 1 }]);
  });

  it("parses sets separated by multiple spaces", () => {
    expect(parseScoreString("11-4  11-5")).toEqual([
      { score1: 11, score2: 4 },
      { score1: 11, score2: 5 },
    ]);
  });

  it("throws ZodError for empty input", () => {
    expect(() => parseScoreString("")).toThrow(ZodError);
    expect(() => parseScoreString("   ")).toThrow(ZodError);
  });

  it("throws ZodError for malformed token", () => {
    expect(() => parseScoreString("11-4 abc")).toThrow(ZodError);
  });

  it("throws ZodError for token without hyphen", () => {
    expect(() => parseScoreString("114")).toThrow(ZodError);
  });

  it("throws ZodError for non-numeric score", () => {
    expect(() => parseScoreString("11-x")).toThrow(ZodError);
  });
});

// ---------------------------------------------------------------------------
// validateSet
// ---------------------------------------------------------------------------

describe("validateSet", () => {
  // Standard (pointsPerSet = 11)
  describe("standard (11 points)", () => {
    it("accepts a normal win 11-4", () => {
      expect(validateSet(11, 4, 11)).toBe(true);
    });

    it("accepts a close win 11-9", () => {
      expect(validateSet(11, 9, 11)).toBe(true);
    });

    it("accepts a deuce win 13-11", () => {
      expect(validateSet(13, 11, 11)).toBe(true);
    });

    it("accepts a long deuce 21-19", () => {
      expect(validateSet(21, 19, 11)).toBe(true);
    });

    it("rejects if winner has fewer than 11 points", () => {
      expect(validateSet(10, 4, 11)).toBe(false);
    });

    it("rejects a 1-point margin 11-10", () => {
      expect(validateSet(11, 10, 11)).toBe(false);
    });

    it("rejects unresolved deuce 12-11", () => {
      expect(validateSet(12, 11, 11)).toBe(false);
    });

    it("rejects 0-0", () => {
      expect(validateSet(0, 0, 11)).toBe(false);
    });

    it("rejects negative scores", () => {
      expect(validateSet(-1, 11, 11)).toBe(false);
    });

    it("rejects a winner with more than 11 when no deuce (12-4)", () => {
      expect(validateSet(12, 4, 11)).toBe(false);
    });
  });

  // Speedy (pointsPerSet = 3)
  describe("speedy (3 points)", () => {
    it("accepts 3-1", () => {
      expect(validateSet(3, 1, 3)).toBe(true);
    });

    it("accepts 3-0", () => {
      expect(validateSet(3, 0, 3)).toBe(true);
    });

    it("accepts deuce 4-2", () => {
      expect(validateSet(4, 2, 3)).toBe(true);
    });

    it("rejects 2-1 (winner < 3)", () => {
      expect(validateSet(2, 1, 3)).toBe(false);
    });

    it("rejects 3-2 (margin < 2)", () => {
      expect(validateSet(3, 2, 3)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// computeMatchWinner
// ---------------------------------------------------------------------------

describe("computeMatchWinner", () => {
  it("returns 1 when player 1 wins 3 sets (best-of-5)", () => {
    const sets = [
      { score1: 11, score2: 4 },
      { score1: 11, score2: 5 },
      { score1: 11, score2: 8 },
    ];
    expect(computeMatchWinner(sets, 3)).toBe(1);
  });

  it("returns 2 when player 2 wins 3 sets", () => {
    const sets = [
      { score1: 4, score2: 11 },
      { score1: 5, score2: 11 },
      { score1: 8, score2: 11 },
    ];
    expect(computeMatchWinner(sets, 3)).toBe(2);
  });

  it("returns 2 after a 3-2 comeback", () => {
    const sets = [
      { score1: 11, score2: 4 },
      { score1: 11, score2: 5 },
      { score1: 4, score2: 11 },
      { score1: 5, score2: 11 },
      { score1: 8, score2: 11 },
    ];
    expect(computeMatchWinner(sets, 3)).toBe(2);
  });

  it("returns null when match is not finished (1-1 after 2 sets)", () => {
    const sets = [
      { score1: 11, score2: 4 },
      { score1: 4, score2: 11 },
    ];
    expect(computeMatchWinner(sets, 3)).toBeNull();
  });

  it("returns null with empty sets", () => {
    expect(computeMatchWinner([], 3)).toBeNull();
  });

  it("returns 1 for speedy (best-of-1)", () => {
    expect(computeMatchWinner([{ score1: 3, score2: 1 }], 1)).toBe(1);
  });

  it("returns null for speedy with equal score", () => {
    expect(computeMatchWinner([{ score1: 2, score2: 2 }], 1)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// buildBracket
// ---------------------------------------------------------------------------

describe("buildBracket", () => {
  it("throws for fewer than 2 players", () => {
    expect(() => buildBracket(1)).toThrow();
    expect(() => buildBracket(0)).toThrow();
  });

  it("builds a 2-player bracket (1 match, no BYE)", () => {
    const slots = buildBracket(2);
    expect(slots).toHaveLength(1);
    expect(slots[0]!.round).toBe(1);
    expect(slots[0]!.nextMatchIndex).toBe(-1);
  });

  it("builds a 4-player bracket (3 matches, no BYEs)", () => {
    const slots = buildBracket(4);
    expect(slots).toHaveLength(3);
    const firstRound = slots.filter((s) => s.round === 2);
    const final = slots.filter((s) => s.round === 1);
    expect(firstRound).toHaveLength(2);
    expect(final).toHaveLength(1);
  });

  it("builds an 8-player bracket (7 matches, no BYEs)", () => {
    const slots = buildBracket(8);
    expect(slots).toHaveLength(7);
  });

  it("builds a 13-player bracket (15 matches for a size-16 bracket)", () => {
    // 13 players → bracket size 16 → 15 matches, 3 BYEs handled by createFirstRoundSlots
    const slots = buildBracket(13);
    expect(slots).toHaveLength(15);
  });

  it("links nextMatchIndex correctly for a 4-player bracket", () => {
    const slots = buildBracket(4);
    const finalIndex = slots.findIndex((s) => s.round === 1);
    const firstRound = slots.filter((s) => s.round === 2);
    // Both first-round matches should point to the final
    expect(firstRound[0]!.nextMatchIndex).toBe(finalIndex);
    expect(firstRound[1]!.nextMatchIndex).toBe(finalIndex);
    // Slots 1 and 2 of the final
    expect(firstRound[0]!.nextMatchSlot).toBe(1);
    expect(firstRound[1]!.nextMatchSlot).toBe(2);
  });

  it("final match always has nextMatchIndex = -1", () => {
    const slots = buildBracket(8);
    const final = slots.find((s) => s.round === 1);
    expect(final!.nextMatchIndex).toBe(-1);
  });
});

// ---------------------------------------------------------------------------
// seedPlayers
// ---------------------------------------------------------------------------

describe("seedPlayers", () => {
  const makeReg = (id: number, ranking: number | null): SeriesRegistration =>
    ({
      id,
      seriesId: 1,
      licenceNumber: null,
      firstName: `Player${id}`,
      lastName: "Test",
      club: null,
      ranking,
      handicapPoints: 0,
      paymentStatus: "unpaid",
      attendanceStatus: "unknown",
      isForfeit: false,
      seedPosition: null,
      partnerLicenceNumber: null,
      partnerFirstName: null,
      partnerLastName: null,
      partnerClub: null,
      partnerRanking: null,
      notes: null,
      registeredAt: new Date(),
    }) as SeriesRegistration;

  it("sorts players by ranking descending", () => {
    const players = [makeReg(1, 500), makeReg(2, 1200), makeReg(3, 800)];
    const seeded = seedPlayers(players);
    expect(seeded[0]!.ranking).toBe(1200);
    expect(seeded[1]!.ranking).toBe(800);
    expect(seeded[2]!.ranking).toBe(500);
  });

  it("places unranked players last", () => {
    const players = [makeReg(1, null), makeReg(2, 1000), makeReg(3, null)];
    const seeded = seedPlayers(players);
    expect(seeded[0]!.ranking).toBe(1000);
    expect(seeded[1]!.ranking).toBeNull();
    expect(seeded[2]!.ranking).toBeNull();
  });

  it("handles all unranked players", () => {
    const players = [makeReg(1, null), makeReg(2, null)];
    expect(seedPlayers(players)).toHaveLength(2);
  });

  it("does not mutate the original array", () => {
    const players = [makeReg(1, 500), makeReg(2, 1200)];
    const original = [...players];
    seedPlayers(players);
    expect(players[0]!.id).toBe(original[0]!.id);
  });
});

// ---------------------------------------------------------------------------
// getRoundLabel
// ---------------------------------------------------------------------------

describe("getRoundLabel", () => {
  it("returns 'Finale' for round 1", () => {
    expect(getRoundLabel(1, 4)).toBe("Finale");
  });

  it("returns 'Demi-finales' for round 2", () => {
    expect(getRoundLabel(2, 4)).toBe("Demi-finales");
  });

  it("returns 'Quarts de finale' for round 3", () => {
    expect(getRoundLabel(3, 4)).toBe("Quarts de finale");
  });

  it("returns a generic label for earlier rounds", () => {
    expect(getRoundLabel(4, 4)).toBe("1e tour");
  });
});

// ---------------------------------------------------------------------------
// getLBRoundLabel
// ---------------------------------------------------------------------------

describe("getLBRoundLabel", () => {
  it("returns 'Finale LB' for the last round (index = total - 1)", () => {
    expect(getLBRoundLabel(5, 6)).toBe("Finale LB");
  });

  it("returns 'Demi-finale LB' for the second-to-last round", () => {
    expect(getLBRoundLabel(4, 6)).toBe("Demi-finale LB");
  });

  it("returns 'Quarts LB' for third-to-last round", () => {
    expect(getLBRoundLabel(3, 6)).toBe("Quarts LB");
  });

  it("returns 'Tour 1 LB' for the first round (index 0)", () => {
    expect(getLBRoundLabel(0, 6)).toBe("Tour 1 LB");
  });

  it("returns 'Tour 2 LB' for the second round (index 1)", () => {
    expect(getLBRoundLabel(1, 6)).toBe("Tour 2 LB");
  });
});

// ---------------------------------------------------------------------------
// buildDoubleEliminationBracket
// ---------------------------------------------------------------------------

describe("buildDoubleEliminationBracket", () => {
  it("throws for fewer than 2 players", () => {
    expect(() => buildDoubleEliminationBracket(1)).toThrow();
  });

  describe("4 players (bracketSize=4, k=2)", () => {
    // WB: 3 matches (R2×2 + R1×1)
    // LB: 2*(2-1) = 2 rounds → R2×1 (LB R1) + R1×1 (LB Final) = 2 matches
    // GF: 1 match
    // Total: 6 matches
    it("produces the correct total match count", () => {
      const { slots } = buildDoubleEliminationBracket(4);
      expect(slots).toHaveLength(6);
    });

    it("has 3 WB matches", () => {
      const { wbIndices } = buildDoubleEliminationBracket(4);
      expect(wbIndices).toHaveLength(3);
    });

    it("has 2 LB matches", () => {
      const { lbIndices } = buildDoubleEliminationBracket(4);
      expect(lbIndices).toHaveLength(2);
    });

    it("has exactly 1 GF match", () => {
      const { slots, gfIndex } = buildDoubleEliminationBracket(4);
      expect(slots[gfIndex]!.side).toBe("grand_final");
    });

    it("GF match has nextMatchIndex = -1 (no next match)", () => {
      const { slots, gfIndex } = buildDoubleEliminationBracket(4);
      expect(slots[gfIndex]!.nextMatchIndex).toBe(-1);
    });

    it("WB Final points to GF as nextMatch (slot 1)", () => {
      const { slots, wbIndices, gfIndex } = buildDoubleEliminationBracket(4);
      const wbFinal = wbIndices.find((i) => slots[i]!.round === 1);
      expect(wbFinal).toBeDefined();
      expect(slots[wbFinal!]!.nextMatchIndex).toBe(gfIndex);
      expect(slots[wbFinal!]!.nextMatchSlot).toBe(1);
    });

    it("LB Final points to GF as nextMatch (slot 2)", () => {
      const { slots, lbIndices, gfIndex } = buildDoubleEliminationBracket(4);
      const lbFinal = lbIndices.find((i) => slots[i]!.round === 1);
      expect(lbFinal).toBeDefined();
      expect(slots[lbFinal!]!.nextMatchIndex).toBe(gfIndex);
      expect(slots[lbFinal!]!.nextMatchSlot).toBe(2);
    });

    it("all WB first-round matches have a loserNextMatchIndex pointing to LB", () => {
      const { slots, wbIndices } = buildDoubleEliminationBracket(4);
      const maxWBRound = Math.max(...wbIndices.map((i) => slots[i]!.round));
      const wbFirstRound = wbIndices.filter(
        (i) => slots[i]!.round === maxWBRound,
      );
      for (const idx of wbFirstRound) {
        expect(slots[idx]!.loserNextMatchIndex).not.toBe(-1);
        expect(slots[slots[idx]!.loserNextMatchIndex]!.side).toBe("losers");
      }
    });

    it("WB Final loser goes to LB Final", () => {
      const { slots, wbIndices, lbIndices } = buildDoubleEliminationBracket(4);
      const wbFinal = wbIndices.find((i) => slots[i]!.round === 1)!;
      const lbFinal = lbIndices.find((i) => slots[i]!.round === 1)!;
      expect(slots[wbFinal]!.loserNextMatchIndex).toBe(lbFinal);
    });
  });

  describe("8 players (bracketSize=8, k=3)", () => {
    // WB: 7 matches | LB: 6 matches | GF: 1 → total 14
    it("produces 14 total matches", () => {
      const { slots } = buildDoubleEliminationBracket(8);
      expect(slots).toHaveLength(14);
    });

    it("has 7 WB matches", () => {
      const { wbIndices } = buildDoubleEliminationBracket(8);
      expect(wbIndices).toHaveLength(7);
    });

    it("has 6 LB matches", () => {
      const { lbIndices } = buildDoubleEliminationBracket(8);
      expect(lbIndices).toHaveLength(6);
    });

    it("all WB slots have correct side = 'winners'", () => {
      const { slots, wbIndices } = buildDoubleEliminationBracket(8);
      for (const idx of wbIndices) {
        expect(slots[idx]!.side).toBe("winners");
      }
    });

    it("all LB slots have correct side = 'losers'", () => {
      const { slots, lbIndices } = buildDoubleEliminationBracket(8);
      for (const idx of lbIndices) {
        expect(slots[idx]!.side).toBe("losers");
      }
    });

    it("no LB slot has a loserNextMatchIndex (losers are eliminated)", () => {
      const { slots, lbIndices } = buildDoubleEliminationBracket(8);
      for (const idx of lbIndices) {
        expect(slots[idx]!.loserNextMatchIndex).toBe(-1);
      }
    });

    it("all WB loser links point to a valid LB slot (no dangling refs)", () => {
      const { slots, wbIndices, lbIndices } = buildDoubleEliminationBracket(8);
      const lbSet = new Set(lbIndices);
      for (const idx of wbIndices) {
        const loserIdx = slots[idx]!.loserNextMatchIndex;
        if (loserIdx !== -1) {
          expect(lbSet.has(loserIdx)).toBe(true);
        }
      }
    });
  });

  describe("non-power-of-2 players (6 players → bracketSize=8)", () => {
    it("generates the same total match count as 8 players", () => {
      const { slots } = buildDoubleEliminationBracket(6);
      expect(slots).toHaveLength(14);
    });

    it("all matchNumbers within a round are 1-based and unique", () => {
      const { slots, wbIndices } = buildDoubleEliminationBracket(6);
      const byRound = new Map<number, number[]>();
      for (const idx of wbIndices) {
        const s = slots[idx]!;
        if (!byRound.has(s.round)) byRound.set(s.round, []);
        byRound.get(s.round)!.push(s.matchNumber);
      }
      for (const [, nums] of byRound) {
        const unique = new Set(nums);
        expect(unique.size).toBe(nums.length);
        expect(Math.min(...nums)).toBe(1);
      }
    });
  });
});
