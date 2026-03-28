import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSeriesById = vi.fn();
const mockCountRegistrations = vi.fn();
const mockInsertRegistration = vi.fn();

vi.mock("../../../server/domains/tournament/repository", () => ({
  getSeriesById: (...args: unknown[]) => mockGetSeriesById(...args),
  countRegistrations: (...args: unknown[]) => mockCountRegistrations(...args),
  insertRegistration: (...args: unknown[]) => mockInsertRegistration(...args),
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
  deleteRegistration: vi.fn(),
  updateRegistration: vi.fn(),
  syncSiblingRegistrations: vi.fn(),
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

const { addRegistration } =
  await import("../../../server/domains/tournament/service");

const baseSeries = {
  id: 1,
  status: "registration",
  seriesFormat: "singles",
  seriesType: "standard",
  ageCategories: [],
  maxPlayers: null,
  pointsLimitMin: null,
  pointsLimitMax: null,
};

const validPlayer = { firstName: "Jean", lastName: "Dupont" };
const fakeReg = { id: 10, seriesId: 1, ...validPlayer };

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSeriesById.mockResolvedValue(baseSeries);
  mockCountRegistrations.mockResolvedValue(0);
  mockInsertRegistration.mockResolvedValue(fakeReg);
});

const pointsLimitSeries = {
  ...baseSeries,
  seriesType: "points_limit",
  pointsLimitMin: 500,
  pointsLimitMax: 1000,
};

describe("addRegistration — points_limit (singles)", () => {
  it("accepte un joueur dans la fourchette", async () => {
    mockGetSeriesById.mockResolvedValue(pointsLimitSeries);
    await expect(
      addRegistration(1, { ...validPlayer, ranking: 750 }),
    ).resolves.toBeDefined();
  });

  it("refuse un classement trop bas", async () => {
    mockGetSeriesById.mockResolvedValue(pointsLimitSeries);
    await expect(
      addRegistration(1, { ...validPlayer, ranking: 400 }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("refuse un classement trop élevé", async () => {
    mockGetSeriesById.mockResolvedValue(pointsLimitSeries);
    await expect(
      addRegistration(1, { ...validPlayer, ranking: 1200 }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("accepte si ranking absent (inconnu)", async () => {
    mockGetSeriesById.mockResolvedValue(pointsLimitSeries);
    await expect(
      addRegistration(1, validPlayer), // no ranking
    ).resolves.toBeDefined();
  });
});

describe("addRegistration — points_limit (doubles, somme de la paire)", () => {
  const doublesSeries = {
    ...pointsLimitSeries,
    seriesFormat: "doubles",
    pointsLimitMin: 800,
    pointsLimitMax: 1500,
  };

  it("accepte une paire dont la somme est dans la fourchette", async () => {
    mockGetSeriesById.mockResolvedValue(doublesSeries);
    await expect(
      addRegistration(1, {
        ...validPlayer,
        ranking: 600,
        partnerFirstName: "Marie",
        partnerLastName: "Durand",
        partnerRanking: 600, // 600+600 = 1200 → dans [800, 1500]
      }),
    ).resolves.toBeDefined();
  });

  it("refuse une paire dont la somme est trop basse", async () => {
    mockGetSeriesById.mockResolvedValue(doublesSeries);
    await expect(
      addRegistration(1, {
        ...validPlayer,
        ranking: 300,
        partnerFirstName: "Marie",
        partnerLastName: "Durand",
        partnerRanking: 300, // 300+300 = 600 < 800
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("refuse une paire dont la somme est trop élevée", async () => {
    mockGetSeriesById.mockResolvedValue(doublesSeries);
    await expect(
      addRegistration(1, {
        ...validPlayer,
        ranking: 900,
        partnerFirstName: "Marie",
        partnerLastName: "Durand",
        partnerRanking: 900, // 900+900 = 1800 > 1500
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("utilise uniquement le ranking joueur si partnerRanking absent", async () => {
    mockGetSeriesById.mockResolvedValue(doublesSeries);
    // ranking=1000 seul → dans [800, 1500] → accepté
    await expect(
      addRegistration(1, {
        ...validPlayer,
        ranking: 1000,
        partnerFirstName: "Marie",
        partnerLastName: "Durand",
      }),
    ).resolves.toBeDefined();
  });
});

describe("addRegistration — doubles (partenaire requis)", () => {
  const doublesSeries = {
    ...baseSeries,
    seriesFormat: "doubles",
  };

  it("refuse si partnerFirstName absent", async () => {
    mockGetSeriesById.mockResolvedValue(doublesSeries);
    await expect(
      addRegistration(1, { ...validPlayer, partnerLastName: "Martin" }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("refuse si partnerLastName absent", async () => {
    mockGetSeriesById.mockResolvedValue(doublesSeries);
    await expect(
      addRegistration(1, { ...validPlayer, partnerFirstName: "Marie" }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("accepte avec les deux champs partenaire renseignés", async () => {
    mockGetSeriesById.mockResolvedValue(doublesSeries);
    await expect(
      addRegistration(1, {
        ...validPlayer,
        partnerFirstName: "Marie",
        partnerLastName: "Martin",
      }),
    ).resolves.toBeDefined();
    expect(mockInsertRegistration).toHaveBeenCalled();
  });
});

describe("addRegistration — catégories d'âge", () => {
  it("pas d'avertissement si ageCategories est vide (série ouverte)", async () => {
    const result = await addRegistration(1, {
      ...validPlayer,
      playerCategory: "veterans",
    });
    expect(result.warning).toBeNull();
  });

  it("pas d'avertissement si playerCategory correspond à ageCategories", async () => {
    mockGetSeriesById.mockResolvedValue({
      ...baseSeries,
      ageCategories: ["poussin", "benjamin"],
    });
    const result = await addRegistration(1, {
      ...validPlayer,
      playerCategory: "poussin",
    });
    expect(result.warning).toBeNull();
  });

  it("avertissement souple si playerCategory hors ageCategories", async () => {
    mockGetSeriesById.mockResolvedValue({
      ...baseSeries,
      ageCategories: ["poussin", "benjamin"],
    });
    const result = await addRegistration(1, {
      ...validPlayer,
      playerCategory: "veterans",
    });
    expect(result.warning).toMatch(/[Vv]étéran/);
    expect(result.warning).toMatch(/[Pp]oussin|[Bb]enjamin/);
  });

  it("pas d'avertissement si playerCategory est absent (inconnu)", async () => {
    mockGetSeriesById.mockResolvedValue({
      ...baseSeries,
      ageCategories: ["cadets"],
    });
    const result = await addRegistration(1, validPlayer); // no playerCategory
    expect(result.warning).toBeNull();
  });

  it("l'inscription est créée même avec avertissement", async () => {
    mockGetSeriesById.mockResolvedValue({
      ...baseSeries,
      ageCategories: ["minimes"],
    });
    const result = await addRegistration(1, {
      ...validPlayer,
      playerCategory: "veterans",
    });
    expect(result.registration).toEqual(fakeReg);
    expect(mockInsertRegistration).toHaveBeenCalled();
  });
});
