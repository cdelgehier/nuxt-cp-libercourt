import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetRegistrationById = vi.fn();
const mockUpdateRegistration = vi.fn();
const mockGetSeriesById = vi.fn();
const mockSyncSiblingRegistrations = vi.fn();

vi.mock("../../../server/domains/tournament/repository", () => ({
  getRegistrationById: (...args: unknown[]) => mockGetRegistrationById(...args),
  updateRegistration: (...args: unknown[]) => mockUpdateRegistration(...args),
  getSeriesById: (...args: unknown[]) => mockGetSeriesById(...args),
  syncSiblingRegistrations: (...args: unknown[]) =>
    mockSyncSiblingRegistrations(...args),
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
  countRegistrations: vi.fn(),
  insertRegistration: vi.fn(),
  deleteRegistration: vi.fn(),
  getMatchById: vi.fn(),
  updateMatch: vi.fn(),
  deleteSetsByMatch: vi.fn(),
  insertSets: vi.fn(),
  getMatchesBySeries: vi.fn(),
  updateSeriesStatus: vi.fn(),
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

const { updateRegistration } =
  await import("../../../server/domains/tournament/service");

const baseReg = {
  id: 5,
  seriesId: 1,
  licenceNumber: "LIC001",
  firstName: "Jean",
  lastName: "DUPONT",
};

const singlesSeries = { id: 1, seriesFormat: "singles" };
const doublesSeries = { id: 1, seriesFormat: "doubles" };

beforeEach(() => {
  vi.clearAllMocks();
  mockGetRegistrationById.mockResolvedValue(baseReg);
  mockUpdateRegistration.mockResolvedValue({ ...baseReg });
  mockGetSeriesById.mockResolvedValue(singlesSeries);
  mockSyncSiblingRegistrations.mockResolvedValue(undefined);
});

describe("updateRegistration — sync isForfeit", () => {
  it("propage isForfeit=true aux séries sœurs pour une série singles", async () => {
    await updateRegistration(5, { isForfeit: true });

    expect(mockGetSeriesById).toHaveBeenCalledWith(1);
    expect(mockSyncSiblingRegistrations).toHaveBeenCalledWith(
      baseReg,
      expect.objectContaining({ isForfeit: true }),
    );
  });

  it("ne propage PAS isForfeit pour une série doubles", async () => {
    mockGetSeriesById.mockResolvedValue(doublesSeries);

    await updateRegistration(5, { isForfeit: true });

    expect(mockSyncSiblingRegistrations).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ isForfeit: expect.anything() }),
    );
  });

  it("propage attendanceStatus et paymentStatus sans consulter getSeriesById", async () => {
    await updateRegistration(5, {
      attendanceStatus: "present",
      paymentStatus: "paid",
    });

    expect(mockGetSeriesById).not.toHaveBeenCalled();
    expect(mockSyncSiblingRegistrations).toHaveBeenCalledWith(baseReg, {
      attendanceStatus: "present",
      paymentStatus: "paid",
    });
  });

  it("lève 404 si l'inscription n'existe pas", async () => {
    mockGetRegistrationById.mockResolvedValue(null);

    await expect(
      updateRegistration(99, { isForfeit: true }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(mockUpdateRegistration).not.toHaveBeenCalled();
  });
});
