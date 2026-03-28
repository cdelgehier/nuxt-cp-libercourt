import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock du repository
const mockGetSeriesById = vi.fn();
const mockDeleteMatchesBySeries = vi.fn();
const mockUpdateSeriesStatus = vi.fn();

vi.mock("../../../server/domains/tournament/repository", () => ({
  getSeriesById: (...args: unknown[]) => mockGetSeriesById(...args),
  deleteMatchesBySeries: (...args: unknown[]) =>
    mockDeleteMatchesBySeries(...args),
  updateSeriesStatus: (...args: unknown[]) => mockUpdateSeriesStatus(...args),
  // autres méthodes du repo utilisées dans d'autres fonctions du service
  getAllTournaments: vi.fn(),
  getPublishedTournaments: vi.fn(),
  countSeriesByTournament: vi.fn(),
  getTournamentBySlug: vi.fn(),
  getTournamentById: vi.fn(),
  getSeriesByTournamentId: vi.fn(),
  getMatchesBySeries: vi.fn(),
  getMatchById: vi.fn(),
  getPendingMatchesBySeries: vi.fn(),
  insertMatches: vi.fn(),
  updateMatch: vi.fn(),
  insertMatchSets: vi.fn(),
  getMatchSetsByMatch: vi.fn(),
  getRegistrationsBySeries: vi.fn(),
  getRegistrationById: vi.fn(),
  insertRegistration: vi.fn(),
  updateRegistration: vi.fn(),
  deleteRegistration: vi.fn(),
  syncSiblingRegistrations: vi.fn(),
  getJaAccessById: vi.fn(),
  getJaAccessByTournamentId: vi.fn(),
  insertJaAccess: vi.fn(),
  updateJaAccess: vi.fn(),
  deleteJaAccess: vi.fn(),
  insertTournament: vi.fn(),
  updateTournament: vi.fn(),
  deleteTournament: vi.fn(),
}));

vi.stubGlobal(
  "createError",
  ({ statusCode, message }: { statusCode: number; message: string }) => {
    const err = new Error(message) as Error & { statusCode: number };
    err.statusCode = statusCode;
    return err;
  },
);

const { dropBracket } =
  await import("../../../server/domains/tournament/service");

describe("dropBracket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supprime les matchs et repasse en 'registration' depuis 'bracket_generated'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "bracket_generated" });
    mockDeleteMatchesBySeries.mockResolvedValue(undefined);
    mockUpdateSeriesStatus.mockResolvedValue(undefined);

    await dropBracket(1);

    expect(mockDeleteMatchesBySeries).toHaveBeenCalledWith(1);
    expect(mockUpdateSeriesStatus).toHaveBeenCalledWith(1, "registration");
  });

  it("lève une erreur 404 si la série n'existe pas", async () => {
    mockGetSeriesById.mockResolvedValue(null);

    await expect(dropBracket(99)).rejects.toMatchObject({
      statusCode: 404,
      message: "Série introuvable",
    });

    expect(mockDeleteMatchesBySeries).not.toHaveBeenCalled();
  });

  it("lève une erreur 400 depuis le statut 'draft'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "draft" });

    await expect(dropBracket(1)).rejects.toMatchObject({ statusCode: 400 });
    expect(mockDeleteMatchesBySeries).not.toHaveBeenCalled();
  });

  it("lève une erreur 400 depuis le statut 'registration'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "registration" });

    await expect(dropBracket(1)).rejects.toMatchObject({ statusCode: 400 });
    expect(mockDeleteMatchesBySeries).not.toHaveBeenCalled();
  });

  it("lève une erreur 400 depuis le statut 'in_progress'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "in_progress" });

    await expect(dropBracket(1)).rejects.toMatchObject({ statusCode: 400 });
    expect(mockDeleteMatchesBySeries).not.toHaveBeenCalled();
  });

  it("lève une erreur 400 depuis le statut 'finished'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "finished" });

    await expect(dropBracket(1)).rejects.toMatchObject({ statusCode: 400 });
    expect(mockDeleteMatchesBySeries).not.toHaveBeenCalled();
  });
});
