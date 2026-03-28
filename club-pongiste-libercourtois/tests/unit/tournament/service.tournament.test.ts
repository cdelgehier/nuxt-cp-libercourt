import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSeriesById = vi.fn();
const mockUpdateSeriesStatus = vi.fn();
const mockGetTournamentById = vi.fn();
const mockInsertSeries = vi.fn();
const mockUpdateSeries = vi.fn();
const mockDeleteSeries = vi.fn();

vi.mock("../../../server/domains/tournament/repository", () => ({
  getSeriesById: (...args: unknown[]) => mockGetSeriesById(...args),
  updateSeriesStatus: (...args: unknown[]) => mockUpdateSeriesStatus(...args),
  getTournamentById: (...args: unknown[]) => mockGetTournamentById(...args),
  insertSeries: (...args: unknown[]) => mockInsertSeries(...args),
  updateSeries: (...args: unknown[]) => mockUpdateSeries(...args),
  deleteSeries: (...args: unknown[]) => mockDeleteSeries(...args),
  // unused stubs
  getAllTournaments: vi.fn(),
  getPublishedTournaments: vi.fn(),
  countSeriesByTournament: vi.fn(),
  getTournamentBySlug: vi.fn(),
  getSeriesByTournamentId: vi.fn(),
  getSeriesByTournament: vi.fn(),
  countRegistrations: vi.fn(),
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
  getMatchesBySeries: vi.fn(),
  getMatchById: vi.fn(),
  updateMatch: vi.fn(),
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
  deleteMatchesBySeries: vi.fn(),
  getActiveRegistrations: vi.fn(),
  slugExists: vi.fn(),
  touchJaAccessLastUsed: vi.fn(),
}));

vi.stubGlobal(
  "createError",
  ({ statusCode, message }: { statusCode: number; message: string }) => {
    const err = new Error(message) as Error & { statusCode: number };
    err.statusCode = statusCode;
    return err;
  },
);

const { openRegistrations, updateSeries, deleteSeries, startSeries } =
  await import("../../../server/domains/tournament/service");

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateSeriesStatus.mockResolvedValue(undefined);
  mockUpdateSeries.mockResolvedValue({ id: 1 });
  mockDeleteSeries.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// openRegistrations — draft → registration
// ---------------------------------------------------------------------------

describe("openRegistrations", () => {
  it("passe de 'draft' à 'registration'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "draft" });

    await openRegistrations(1);

    expect(mockUpdateSeriesStatus).toHaveBeenCalledWith(1, "registration");
  });

  it("lève 404 si la série n'existe pas", async () => {
    mockGetSeriesById.mockResolvedValue(null);

    await expect(openRegistrations(99)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(mockUpdateSeriesStatus).not.toHaveBeenCalled();
  });

  it("lève 400 depuis le statut 'registration' (déjà ouvert)", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "registration" });

    await expect(openRegistrations(1)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(mockUpdateSeriesStatus).not.toHaveBeenCalled();
  });

  it("lève 400 depuis le statut 'bracket_generated'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "bracket_generated" });

    await expect(openRegistrations(1)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("lève 400 depuis le statut 'in_progress'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "in_progress" });

    await expect(openRegistrations(1)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("lève 400 depuis le statut 'finished'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "finished" });

    await expect(openRegistrations(1)).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

// ---------------------------------------------------------------------------
// updateSeries — guards de statut
// ---------------------------------------------------------------------------

describe("updateSeries — guards de statut", () => {
  it("autorise la mise à jour depuis 'draft'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "draft" });

    await expect(
      updateSeries(1, { name: "Nouveau nom" }),
    ).resolves.toBeDefined();
    expect(mockUpdateSeries).toHaveBeenCalled();
  });

  it("autorise la mise à jour depuis 'registration'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "registration" });

    await expect(
      updateSeries(1, { name: "Nouveau nom" }),
    ).resolves.toBeDefined();
    expect(mockUpdateSeries).toHaveBeenCalled();
  });

  it("autorise la mise à jour depuis 'bracket_generated'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "bracket_generated" });

    await expect(
      updateSeries(1, { name: "Nouveau nom" }),
    ).resolves.toBeDefined();
    expect(mockUpdateSeries).toHaveBeenCalled();
  });

  it("lève 400 depuis 'in_progress'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "in_progress" });

    await expect(
      updateSeries(1, { name: "Nouveau nom" }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(mockUpdateSeries).not.toHaveBeenCalled();
  });

  it("lève 400 depuis 'finished'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "finished" });

    await expect(
      updateSeries(1, { name: "Nouveau nom" }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(mockUpdateSeries).not.toHaveBeenCalled();
  });

  it("lève 404 si la série n'existe pas", async () => {
    mockGetSeriesById.mockResolvedValue(null);

    await expect(
      updateSeries(99, { name: "Nouveau nom" }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ---------------------------------------------------------------------------
// deleteSeries — guards de statut
// ---------------------------------------------------------------------------

describe("deleteSeries — guards de statut", () => {
  it("supprime depuis le statut 'draft'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "draft" });

    await deleteSeries(1);

    expect(mockDeleteSeries).toHaveBeenCalledWith(1);
  });

  it("supprime depuis le statut 'registration'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "registration" });

    await deleteSeries(1);

    expect(mockDeleteSeries).toHaveBeenCalledWith(1);
  });

  it("lève 400 depuis 'bracket_generated' (tableau déjà prêt)", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "bracket_generated" });

    await expect(deleteSeries(1)).rejects.toMatchObject({ statusCode: 400 });
    expect(mockDeleteSeries).not.toHaveBeenCalled();
  });

  it("lève 400 depuis 'in_progress'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "in_progress" });

    await expect(deleteSeries(1)).rejects.toMatchObject({ statusCode: 400 });
    expect(mockDeleteSeries).not.toHaveBeenCalled();
  });

  it("lève 400 depuis 'finished'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "finished" });

    await expect(deleteSeries(1)).rejects.toMatchObject({ statusCode: 400 });
    expect(mockDeleteSeries).not.toHaveBeenCalled();
  });

  it("lève 404 si la série n'existe pas", async () => {
    mockGetSeriesById.mockResolvedValue(null);

    await expect(deleteSeries(99)).rejects.toMatchObject({ statusCode: 404 });
    expect(mockDeleteSeries).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// startSeries — bracket_generated → in_progress
// ---------------------------------------------------------------------------

describe("startSeries", () => {
  it("passe de 'bracket_generated' à 'in_progress'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "bracket_generated" });

    await startSeries(1);

    expect(mockUpdateSeriesStatus).toHaveBeenCalledWith(1, "in_progress");
  });

  it("lève 404 si la série n'existe pas", async () => {
    mockGetSeriesById.mockResolvedValue(null);

    await expect(startSeries(99)).rejects.toMatchObject({ statusCode: 404 });
    expect(mockUpdateSeriesStatus).not.toHaveBeenCalled();
  });

  it("lève 400 depuis 'draft'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "draft" });

    await expect(startSeries(1)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("lève 400 depuis 'registration'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "registration" });

    await expect(startSeries(1)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("lève 400 depuis 'in_progress' (déjà démarré)", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "in_progress" });

    await expect(startSeries(1)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("lève 400 depuis 'finished'", async () => {
    mockGetSeriesById.mockResolvedValue({ id: 1, status: "finished" });

    await expect(startSeries(1)).rejects.toMatchObject({ statusCode: 400 });
  });
});
