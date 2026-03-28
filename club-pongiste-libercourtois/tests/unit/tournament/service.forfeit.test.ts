import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetMatchById = vi.fn();
const mockGetSeriesById = vi.fn();
const mockUpdateMatch = vi.fn();
const mockUpdateRegistration = vi.fn();
const mockGetRegistrationById = vi.fn();
const mockSyncSiblingRegistrations = vi.fn();
const mockGetMatchesBySeries = vi.fn();
const mockUpdateSeriesStatus = vi.fn();

vi.mock("../../../server/domains/tournament/repository", () => ({
  getMatchById: (...args: unknown[]) => mockGetMatchById(...args),
  getSeriesById: (...args: unknown[]) => mockGetSeriesById(...args),
  updateMatch: (...args: unknown[]) => mockUpdateMatch(...args),
  updateRegistration: (...args: unknown[]) => mockUpdateRegistration(...args),
  getRegistrationById: (...args: unknown[]) => mockGetRegistrationById(...args),
  syncSiblingRegistrations: (...args: unknown[]) =>
    mockSyncSiblingRegistrations(...args),
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
  insertRegistration: vi.fn(),
  deleteRegistration: vi.fn(),
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

const { enterForfeit } =
  await import("../../../server/domains/tournament/service");

const baseMatch = {
  id: 10,
  seriesId: 1,
  player1Id: 101,
  player2Id: 102,
  status: "pending",
  nextMatchId: null,
  nextMatchSlot: null,
};

const forfeiterReg = {
  id: 101,
  seriesId: 1,
  licenceNumber: "ABC",
  firstName: "Kevin",
  lastName: "LEROY",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetMatchById.mockResolvedValue(baseMatch);
  mockGetSeriesById.mockResolvedValue({
    id: 1,
    status: "in_progress",
    seriesFormat: "singles",
  });
  mockUpdateMatch.mockResolvedValue(undefined);
  mockUpdateRegistration.mockResolvedValue(undefined);
  mockGetRegistrationById.mockResolvedValue(forfeiterReg);
  mockSyncSiblingRegistrations.mockResolvedValue(undefined);
  mockGetMatchesBySeries.mockResolvedValue([
    { ...baseMatch, status: "forfeit" },
  ]);
  mockUpdateSeriesStatus.mockResolvedValue(undefined);
});

describe("enterForfeit", () => {
  it("déclare player2 (102) gagnant quand player1 (101) forfait", async () => {
    await enterForfeit(10, 102, null);

    expect(mockUpdateMatch).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        status: "forfeit",
        winnerId: 102,
      }),
    );
  });

  it("marque isForfeit=true sur l'inscription du joueur forfait (player1 id=101)", async () => {
    await enterForfeit(10, 102, null); // winner = 102, forfeiter = 101

    expect(mockUpdateRegistration).toHaveBeenCalledWith(101, {
      isForfeit: true,
    });
  });

  it("marque isForfeit=true sur player2 (102) quand player1 (101) gagne", async () => {
    await enterForfeit(10, 101, null); // winner = 101, forfeiter = 102

    expect(mockUpdateRegistration).toHaveBeenCalledWith(102, {
      isForfeit: true,
    });
  });

  it("lève 404 si le match n'existe pas", async () => {
    mockGetMatchById.mockResolvedValue(null);
    await expect(enterForfeit(99, 101, null)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(mockUpdateMatch).not.toHaveBeenCalled();
  });

  it("lève 400 si le winnerId n'est pas un joueur du match", async () => {
    await expect(enterForfeit(10, 999, null)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(mockUpdateMatch).not.toHaveBeenCalled();
  });

  it("lève 400 si le match est déjà terminé", async () => {
    mockGetMatchById.mockResolvedValue({ ...baseMatch, status: "finished" });
    await expect(enterForfeit(10, 102, null)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("propage isForfeit aux séries sœurs via syncSiblingRegistrations (singles)", async () => {
    await enterForfeit(10, 102, null); // forfeiter = 101

    expect(mockGetRegistrationById).toHaveBeenCalledWith(101);
    expect(mockSyncSiblingRegistrations).toHaveBeenCalledWith(forfeiterReg, {
      isForfeit: true,
    });
  });

  it("ne propage PAS isForfeit pour une série doubles (joueur blessé ≠ forfait du partenaire)", async () => {
    mockGetSeriesById.mockResolvedValue({
      id: 1,
      status: "in_progress",
      seriesFormat: "doubles",
    });

    await enterForfeit(10, 102, null); // forfeiter = 101

    expect(mockUpdateRegistration).toHaveBeenCalledWith(101, {
      isForfeit: true,
    });
    expect(mockSyncSiblingRegistrations).not.toHaveBeenCalled();
  });
});
