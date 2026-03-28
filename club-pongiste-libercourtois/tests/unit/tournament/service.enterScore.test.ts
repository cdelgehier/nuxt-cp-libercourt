import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetMatchById = vi.fn();
const mockGetSeriesById = vi.fn();
const mockUpdateMatch = vi.fn();
const mockDeleteSetsByMatch = vi.fn();
const mockInsertSets = vi.fn();
const mockGetMatchesBySeries = vi.fn();
const mockUpdateSeriesStatus = vi.fn();

vi.mock("../../../server/domains/tournament/repository", () => ({
  getMatchById: (...args: unknown[]) => mockGetMatchById(...args),
  getSeriesById: (...args: unknown[]) => mockGetSeriesById(...args),
  updateMatch: (...args: unknown[]) => mockUpdateMatch(...args),
  deleteSetsByMatch: (...args: unknown[]) => mockDeleteSetsByMatch(...args),
  insertSets: (...args: unknown[]) => mockInsertSets(...args),
  getMatchesBySeries: (...args: unknown[]) => mockGetMatchesBySeries(...args),
  updateSeriesStatus: (...args: unknown[]) => mockUpdateSeriesStatus(...args),
  // unused stubs
  getAllTournaments: vi.fn(),
  getPublishedTournaments: vi.fn(),
  countSeriesByTournament: vi.fn(),
  getTournamentBySlug: vi.fn(),
  getTournamentById: vi.fn(),
  getSeriesByTournamentId: vi.fn(),
  getPendingMatchesBySeries: vi.fn(),
  insertMatches: vi.fn(),
  insertMatchSets: vi.fn(),
  getMatchSetsByMatch: vi.fn(),
  getRegistrationsBySeries: vi.fn(),
  getRegistrationById: vi.fn(),
  insertRegistration: vi.fn(),
  deleteRegistration: vi.fn(),
  updateRegistration: vi.fn(),
  syncSiblingRegistrations: vi.fn(),
  getJaAccessById: vi.fn(),
  getJaAccessByTournamentId: vi.fn(),
  insertJaAccess: vi.fn(),
  updateJaAccess: vi.fn(),
  deleteJaAccess: vi.fn(),
  insertTournament: vi.fn(),
  updateTournament: vi.fn(),
  deleteTournament: vi.fn(),
  deleteMatchesBySeries: vi.fn(),
}));

vi.stubGlobal(
  "createError",
  ({ statusCode, message }: { statusCode: number; message: string }) => {
    const err = new Error(message) as Error & { statusCode: number };
    err.statusCode = statusCode;
    return err;
  },
);

const { enterMatchScore } =
  await import("../../../server/domains/tournament/service");

// A valid best-of-5 score where player1 wins 3-1
const validSets = [
  { score1: 11, score2: 5 },
  { score1: 11, score2: 7 },
  { score1: 8, score2: 11 },
  { score1: 11, score2: 9 },
];

const basePendingMatch = {
  id: 10,
  seriesId: 1,
  player1Id: 101,
  player2Id: 102,
  status: "pending",
  nextMatchId: null,
  nextMatchSlot: null,
  winnerId: null,
};

const baseFinishedMatch = {
  ...basePendingMatch,
  status: "finished",
  winnerId: 101,
  nextMatchId: 20,
  nextMatchSlot: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSeriesById.mockResolvedValue({
    id: 1,
    status: "in_progress",
    setsToWin: 3,
    pointsPerSet: 11,
  });
  mockUpdateMatch.mockResolvedValue(undefined);
  mockDeleteSetsByMatch.mockResolvedValue(undefined);
  mockInsertSets.mockResolvedValue(undefined);
  mockGetMatchesBySeries.mockResolvedValue([
    { ...basePendingMatch, status: "finished" },
  ]);
  mockUpdateSeriesStatus.mockResolvedValue(undefined);
});

describe("enterMatchScore — saisie normale", () => {
  it("enregistre le score et déclare le vainqueur", async () => {
    mockGetMatchById.mockResolvedValue(basePendingMatch);

    await enterMatchScore(10, { sets: validSets }, null);

    expect(mockUpdateMatch).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        status: "finished",
        winnerId: 101,
      }),
    );
  });

  it("insère les sets", async () => {
    mockGetMatchById.mockResolvedValue(basePendingMatch);

    await enterMatchScore(10, { sets: validSets }, null);

    expect(mockDeleteSetsByMatch).toHaveBeenCalledWith(10);
    expect(mockInsertSets).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ matchId: 10, setNumber: 1 }),
      ]),
    );
  });

  it("lève 404 si le match n'existe pas", async () => {
    mockGetMatchById.mockResolvedValue(null);

    await expect(
      enterMatchScore(99, { sets: validSets }, null),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("lève 400 si la série n'est pas en cours", async () => {
    mockGetMatchById.mockResolvedValue(basePendingMatch);
    mockGetSeriesById.mockResolvedValue({
      id: 1,
      status: "bracket_generated",
      setsToWin: 3,
      pointsPerSet: 11,
    });

    await expect(
      enterMatchScore(10, { sets: validSets }, null),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("lève 400 si le score ne désigne pas de vainqueur", async () => {
    mockGetMatchById.mockResolvedValue(basePendingMatch);
    // Only 1 set won by each — no winner in best-of-5
    const inconclusive = [
      { score1: 11, score2: 5 },
      { score1: 5, score2: 11 },
    ];

    await expect(
      enterMatchScore(10, { sets: inconclusive }, null),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("enterMatchScore — correction d'un match terminé", () => {
  it("remet le match en pending, vide le slot du match suivant, puis re-enregistre", async () => {
    const pendingNextMatch = {
      id: 20,
      status: "pending",
      player1Id: 101,
      player2Id: null,
    };
    mockGetMatchById
      .mockResolvedValueOnce(baseFinishedMatch) // fetch du match courant
      .mockResolvedValueOnce(pendingNextMatch) // fetch du match suivant
      .mockResolvedValueOnce(baseFinishedMatch); // fetch dans propagateWinner

    await enterMatchScore(10, { sets: validSets }, null);

    // Must clear the winner slot in the next match
    expect(mockUpdateMatch).toHaveBeenCalledWith(20, { player1Id: null });
    // Must reset current match to pending before re-entering
    expect(mockUpdateMatch).toHaveBeenCalledWith(10, {
      status: "pending",
      winnerId: null,
      finishedAt: null,
    });
    // Must then save the new result
    expect(mockUpdateMatch).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ status: "finished" }),
    );
  });

  it("lève 400 si le match suivant est déjà terminé", async () => {
    const finishedNextMatch = { id: 20, status: "finished" };
    mockGetMatchById
      .mockResolvedValueOnce(baseFinishedMatch)
      .mockResolvedValueOnce(finishedNextMatch);

    await expect(
      enterMatchScore(10, { sets: validSets }, null),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(mockUpdateMatch).not.toHaveBeenCalled();
  });

  it("permet la correction d'un match final (pas de match suivant)", async () => {
    const finalMatch = {
      ...baseFinishedMatch,
      nextMatchId: null,
      nextMatchSlot: null,
    };
    mockGetMatchById.mockResolvedValue(finalMatch);

    await enterMatchScore(10, { sets: validSets }, null);

    expect(mockUpdateMatch).toHaveBeenCalledWith(10, {
      status: "pending",
      winnerId: null,
      finishedAt: null,
    });
    expect(mockUpdateMatch).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ status: "finished" }),
    );
  });

  it("permet la correction d'un match forfait", async () => {
    const forfaitMatch = { ...baseFinishedMatch, status: "forfeit" };
    const pendingNextMatch = {
      id: 20,
      status: "pending",
      player1Id: 101,
      player2Id: null,
    };
    mockGetMatchById
      .mockResolvedValueOnce(forfaitMatch)
      .mockResolvedValueOnce(pendingNextMatch)
      .mockResolvedValueOnce(forfaitMatch);

    await enterMatchScore(10, { sets: validSets }, null);

    expect(mockUpdateMatch).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ status: "finished" }),
    );
  });
});
