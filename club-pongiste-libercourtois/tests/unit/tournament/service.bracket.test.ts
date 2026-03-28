import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSeriesById = vi.fn();
const mockUpdateSeriesStatus = vi.fn();
const mockGetActiveRegistrations = vi.fn();
const mockDeleteMatchesBySeries = vi.fn();
const mockInsertMatches = vi.fn();
const mockUpdateMatch = vi.fn();
const mockGetMatchesBySeries = vi.fn();

vi.mock("../../../server/domains/tournament/repository", () => ({
  getSeriesById: (...args: unknown[]) => mockGetSeriesById(...args),
  updateSeriesStatus: (...args: unknown[]) => mockUpdateSeriesStatus(...args),
  getActiveRegistrations: (...args: unknown[]) =>
    mockGetActiveRegistrations(...args),
  deleteMatchesBySeries: (...args: unknown[]) =>
    mockDeleteMatchesBySeries(...args),
  insertMatches: (...args: unknown[]) => mockInsertMatches(...args),
  updateMatch: (...args: unknown[]) => mockUpdateMatch(...args),
  getMatchesBySeries: (...args: unknown[]) => mockGetMatchesBySeries(...args),
  // unused stubs
  getAllTournaments: vi.fn(),
  getPublishedTournaments: vi.fn(),
  countSeriesByTournament: vi.fn(),
  getTournamentBySlug: vi.fn(),
  getTournamentById: vi.fn(),
  getSeriesByTournamentId: vi.fn(),
  getSeriesByTournament: vi.fn(),
  countRegistrations: vi.fn(),
  getPendingMatchesBySeries: vi.fn(),
  insertMatchSets: vi.fn(),
  getMatchSetsByMatch: vi.fn(),
  getRegistrationsBySeries: vi.fn(),
  getRegistrationById: vi.fn(),
  insertRegistration: vi.fn(),
  deleteRegistration: vi.fn(),
  updateRegistration: vi.fn(),
  syncSiblingRegistrations: vi.fn(),
  getMatchById: vi.fn(),
  deleteSetsByMatch: vi.fn(),
  insertSets: vi.fn(),
  getJaAccessById: vi.fn(),
  getJaAccessByTournamentId: vi.fn(),
  getJaAccessByTournament: vi.fn(),
  insertJaAccess: vi.fn(),
  updateJaAccess: vi.fn(),
  deleteJaAccess: vi.fn(),
  insertTournament: vi.fn(),
  updateTournament: vi.fn(),
  deleteTournament: vi.fn(),
  slugExists: vi.fn(),
  touchJaAccessLastUsed: vi.fn(),
  insertSeries: vi.fn(),
  updateSeries: vi.fn(),
  deleteSeries: vi.fn(),
}));

vi.stubGlobal(
  "createError",
  ({ statusCode, message }: { statusCode: number; message: string }) => {
    const err = new Error(message) as Error & { statusCode: number };
    err.statusCode = statusCode;
    return err;
  },
);

const { generateBracket, swapPlayersInBracket } =
  await import("../../../server/domains/tournament/service");

// Helpers to build fake registrations and matches
function makeReg(id: number, ranking = 500) {
  return {
    id,
    firstName: `J${id}`,
    lastName: `P${id}`,
    ranking,
    seriesId: 1,
    attendanceStatus: "present",
    isForfeit: false,
  };
}

function makeInsertedMatches(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    seriesId: 1,
    round: 1,
    matchNumber: i + 1,
    status: "pending",
    player1Id: null,
    player2Id: null,
    nextMatchId: null,
    nextMatchSlot: null,
    winnerId: null,
  }));
}

const baseSeries = {
  id: 1,
  status: "registration",
  seriesFormat: "singles",
  seriesType: "standard",
  setsToWin: 3,
  pointsPerSet: 11,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateSeriesStatus.mockResolvedValue(undefined);
  mockDeleteMatchesBySeries.mockResolvedValue(undefined);
  mockUpdateMatch.mockResolvedValue(undefined);
  mockGetMatchesBySeries.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// generateBracket — guards
// ---------------------------------------------------------------------------

describe("generateBracket — guards", () => {
  it("lève 404 si la série n'existe pas", async () => {
    mockGetSeriesById.mockResolvedValue(null);

    await expect(generateBracket(99)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(mockInsertMatches).not.toHaveBeenCalled();
  });

  it("lève 400 depuis 'in_progress'", async () => {
    mockGetSeriesById.mockResolvedValue({
      ...baseSeries,
      status: "in_progress",
    });

    await expect(generateBracket(1)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("lève 400 depuis 'finished'", async () => {
    mockGetSeriesById.mockResolvedValue({ ...baseSeries, status: "finished" });

    await expect(generateBracket(1)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("lève 400 si moins de 2 joueurs présents", async () => {
    mockGetSeriesById.mockResolvedValue(baseSeries);
    mockGetActiveRegistrations.mockResolvedValue([makeReg(1)]);

    await expect(generateBracket(1)).rejects.toMatchObject({ statusCode: 400 });
    expect(mockInsertMatches).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// generateBracket — génération avec 2 joueurs
// ---------------------------------------------------------------------------

describe("generateBracket — génération 2 joueurs", () => {
  beforeEach(() => {
    mockGetSeriesById.mockResolvedValue(baseSeries);
    mockGetActiveRegistrations.mockResolvedValue([
      makeReg(1, 800),
      makeReg(2, 600),
    ]);
    mockInsertMatches.mockResolvedValue(makeInsertedMatches(1));
  });

  it("insère un seul match (finale directe)", async () => {
    await generateBracket(1);

    expect(mockInsertMatches).toHaveBeenCalledTimes(1);
    const [matchData] = mockInsertMatches.mock.calls[0]!;
    expect(matchData).toHaveLength(1);
  });

  it("passe la série en 'bracket_generated'", async () => {
    await generateBracket(1);

    expect(mockUpdateSeriesStatus).toHaveBeenCalledWith(1, "bracket_generated");
  });

  it("supprime les matchs existants avant de régénérer", async () => {
    await generateBracket(1);

    expect(mockDeleteMatchesBySeries).toHaveBeenCalledWith(1);
  });

  it("transite d'abord 'draft' → 'registration' avant de générer", async () => {
    mockGetSeriesById.mockResolvedValue({ ...baseSeries, status: "draft" });

    await generateBracket(1);

    expect(mockUpdateSeriesStatus).toHaveBeenCalledWith(1, "registration");
    expect(mockUpdateSeriesStatus).toHaveBeenCalledWith(1, "bracket_generated");
  });
});

// ---------------------------------------------------------------------------
// generateBracket — génération avec 4 joueurs
// ---------------------------------------------------------------------------

describe("generateBracket — génération 4 joueurs", () => {
  beforeEach(() => {
    mockGetSeriesById.mockResolvedValue(baseSeries);
    mockGetActiveRegistrations.mockResolvedValue([
      makeReg(1, 900),
      makeReg(2, 800),
      makeReg(3, 700),
      makeReg(4, 600),
    ]);
    // 4 players → 3 matches (2 demi-finales + 1 finale)
    mockInsertMatches.mockResolvedValue(makeInsertedMatches(3));
  });

  it("insère 3 matchs pour 4 joueurs", async () => {
    await generateBracket(1);

    const [matchData] = mockInsertMatches.mock.calls[0]!;
    expect(matchData).toHaveLength(3);
  });

  it("assigne les joueurs au premier tour", async () => {
    await generateBracket(1);

    // updateMatch is called to set players in first-round slots
    const playerAssignments = (
      mockUpdateMatch.mock.calls as [number, Record<string, unknown>][]
    ).filter(
      ([, data]) =>
        data.player1Id !== undefined || data.player2Id !== undefined,
    );
    expect(playerAssignments.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// generateBracket — BYE automatique
// ---------------------------------------------------------------------------

describe("generateBracket — BYE avec 3 joueurs", () => {
  beforeEach(() => {
    mockGetSeriesById.mockResolvedValue(baseSeries);
    mockGetActiveRegistrations.mockResolvedValue([
      makeReg(1, 900),
      makeReg(2, 700),
      makeReg(3, 500),
    ]);
    // 3 players → bracket of 4 = 3 matches (2 first-round + 1 final)
    mockInsertMatches.mockResolvedValue(makeInsertedMatches(3));
  });

  it("génère un tableau avec BYE et le finalise sans erreur", async () => {
    await expect(generateBracket(1)).resolves.toBeDefined();
    expect(mockUpdateSeriesStatus).toHaveBeenCalledWith(1, "bracket_generated");
  });
});

// ---------------------------------------------------------------------------
// swapPlayersInBracket — guards
// ---------------------------------------------------------------------------

describe("swapPlayersInBracket — guards", () => {
  it("lève 404 si la série n'existe pas", async () => {
    mockGetSeriesById.mockResolvedValue(null);

    await expect(
      swapPlayersInBracket(99, { registrationId1: 1, registrationId2: 2 }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("lève 400 si la série n'est pas en 'bracket_generated'", async () => {
    mockGetSeriesById.mockResolvedValue({
      ...baseSeries,
      status: "registration",
    });

    await expect(
      swapPlayersInBracket(1, { registrationId1: 1, registrationId2: 2 }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(mockUpdateMatch).not.toHaveBeenCalled();
  });

  it("lève 400 si un joueur est introuvable dans le premier tour", async () => {
    mockGetSeriesById.mockResolvedValue({
      ...baseSeries,
      status: "bracket_generated",
    });
    mockGetMatchesBySeries.mockResolvedValue([
      { id: 1, round: 2, matchNumber: 1, player1Id: 10, player2Id: 20 },
      { id: 2, round: 1, matchNumber: 1, player1Id: 1, player2Id: 2 },
    ]);

    await expect(
      swapPlayersInBracket(1, { registrationId1: 1, registrationId2: 99 }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(mockUpdateMatch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// swapPlayersInBracket — échange réussi
// ---------------------------------------------------------------------------

describe("swapPlayersInBracket — échange dans le premier tour", () => {
  it("échange deux joueurs dans des matchs différents", async () => {
    mockGetSeriesById.mockResolvedValue({
      ...baseSeries,
      status: "bracket_generated",
    });
    const matches = [
      {
        id: 10,
        round: 1,
        matchNumber: 1,
        player1Id: 1,
        player2Id: 2,
        status: "pending",
        winnerId: null,
        sets: [],
        nextMatchId: null,
        nextMatchSlot: null,
      },
      {
        id: 11,
        round: 1,
        matchNumber: 2,
        player1Id: 3,
        player2Id: 4,
        status: "pending",
        winnerId: null,
        sets: [],
        nextMatchId: null,
        nextMatchSlot: null,
      },
    ];
    mockGetMatchesBySeries.mockResolvedValue(matches);

    await swapPlayersInBracket(1, { registrationId1: 1, registrationId2: 3 });

    expect(mockUpdateMatch).toHaveBeenCalledWith(10, { player1Id: 3 });
    expect(mockUpdateMatch).toHaveBeenCalledWith(11, { player1Id: 1 });
    // No BYE re-application expected (both matches have two real players)
    expect(mockUpdateMatch).toHaveBeenCalledTimes(2);
  });

  it("échange deux joueurs dans le même match (positions inversées)", async () => {
    mockGetSeriesById.mockResolvedValue({
      ...baseSeries,
      status: "bracket_generated",
    });
    mockGetMatchesBySeries.mockResolvedValue([
      {
        id: 10,
        round: 1,
        matchNumber: 1,
        player1Id: 1,
        player2Id: 2,
        status: "pending",
        winnerId: null,
        sets: [],
        nextMatchId: null,
        nextMatchSlot: null,
      },
    ]);

    await swapPlayersInBracket(1, { registrationId1: 1, registrationId2: 2 });

    expect(mockUpdateMatch).toHaveBeenCalledWith(10, { player1Id: 2 });
    expect(mockUpdateMatch).toHaveBeenCalledWith(10, { player2Id: 1 });
  });
});

// ---------------------------------------------------------------------------
// swapPlayersInBracket — re-propagation BYE après échange
// ---------------------------------------------------------------------------

describe("swapPlayersInBracket — BYE suit le joueur après échange", () => {
  const seriesBracketGenerated = { ...baseSeries, status: "bracket_generated" };

  it("le BYE auto-avance le nouveau joueur et met à jour le match parent", async () => {
    // Scenario: joueur 1 avait un BYE (auto-avancé en R2), joueur 2 était dans un vrai match.
    // Après échange : joueur 2 doit hériter du BYE, joueur 1 doit jouer le vrai match.
    mockGetSeriesById.mockResolvedValue(seriesBracketGenerated);

    const byeMatch = {
      id: 10,
      round: 1,
      matchNumber: 1,
      player1Id: 1,
      player2Id: null, // BYE
      status: "finished",
      winnerId: 1,
      sets: [],
      nextMatchId: 20,
      nextMatchSlot: 1,
    };
    const fullMatch = {
      id: 11,
      round: 1,
      matchNumber: 2,
      player1Id: 2,
      player2Id: 3,
      status: "pending",
      winnerId: null,
      sets: [],
      nextMatchId: 20,
      nextMatchSlot: 2,
    };

    // First call: find slots; second call: état après le swap en DB
    mockGetMatchesBySeries
      .mockResolvedValueOnce([byeMatch, fullMatch])
      .mockResolvedValueOnce([
        { ...byeMatch, player1Id: 2, status: "finished", winnerId: 1 }, // stale, will be fixed
        { ...fullMatch, player1Id: 1 },
      ]);

    await swapPlayersInBracket(1, { registrationId1: 1, registrationId2: 2 });

    // Échange initial
    expect(mockUpdateMatch).toHaveBeenCalledWith(10, { player1Id: 2 });
    expect(mockUpdateMatch).toHaveBeenCalledWith(11, { player1Id: 1 });

    // BYE re-propagation : joueur 2 prend le BYE → auto-advance + mise à jour parent
    expect(mockUpdateMatch).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ status: "finished", winnerId: 2 }),
    );
    expect(mockUpdateMatch).toHaveBeenCalledWith(20, { player1Id: 2 });
  });

  it("quand le BYE arrive dans un match qui avait deux joueurs, le parent est vidé", async () => {
    // Scenario : joueur 3 avait un BYE (matchId=11), joueur 2 était dans match plein (matchId=10).
    // Échange joueur 2 ↔ joueur 3 : match 10 devient BYE pour joueur 3, match 11 a joueur 2+null.
    mockGetSeriesById.mockResolvedValue(seriesBracketGenerated);

    const fullMatch = {
      id: 10,
      round: 1,
      matchNumber: 1,
      player1Id: 1,
      player2Id: 2,
      status: "pending",
      winnerId: null,
      sets: [],
      nextMatchId: 20,
      nextMatchSlot: 1,
    };
    const byeMatch = {
      id: 11,
      round: 1,
      matchNumber: 2,
      player1Id: 3,
      player2Id: null,
      status: "finished",
      winnerId: 3,
      sets: [],
      nextMatchId: 20,
      nextMatchSlot: 2,
    };

    mockGetMatchesBySeries
      .mockResolvedValueOnce([fullMatch, byeMatch])
      .mockResolvedValueOnce([
        { ...fullMatch, player2Id: 3 }, // joueur 3 maintenant dans le match plein
        { ...byeMatch, player1Id: 2 }, // joueur 2 dans le BYE (winnerId still stale)
      ]);

    await swapPlayersInBracket(1, { registrationId1: 2, registrationId2: 3 });

    // BYE re-propagation : joueur 2 auto-avancé depuis match 11
    expect(mockUpdateMatch).toHaveBeenCalledWith(
      11,
      expect.objectContaining({ status: "finished", winnerId: 2 }),
    );
    expect(mockUpdateMatch).toHaveBeenCalledWith(20, { player2Id: 2 });
  });
});
