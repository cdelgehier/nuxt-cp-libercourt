import { describe, expect, it, vi } from "vitest";

// Mock des dépendances Nitro/Nuxt (pas disponibles hors contexte serveur)
vi.mock("~/server/domains/events/repository", () => ({
  getAllEvents: vi.fn(),
  getUpcomingEvents: vi.fn(),
  getEventById: vi.fn(),
  getEventBySlug: vi.fn(),
  countEventRegistrations: vi.fn(),
  insertEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  toggleRegistration: vi.fn(),
  insertRegistration: vi.fn(),
}));

// createError est une globale Nitro — mock minimal
vi.stubGlobal(
  "createError",
  ({ statusCode, message }: { statusCode: number; message: string }) => {
    const err = new Error(message) as Error & { statusCode: number };
    err.statusCode = statusCode;
    return err;
  },
);

// Import après les mocks
const { computeStatus, formatPrice } = await import("./helpers");

describe("Events — statuts calculés", () => {
  it("événement futur → upcoming", () => {
    const future = new Date(Date.now() + 86400_000); // demain
    expect(computeStatus({ startDate: future, endDate: null })).toBe(
      "upcoming",
    );
  });

  it("événement passé → past", () => {
    const past = new Date(Date.now() - 86400_000); // hier
    expect(computeStatus({ startDate: past, endDate: null })).toBe("past");
  });

  it("événement en cours → ongoing", () => {
    const start = new Date(Date.now() - 3600_000); // il y a 1h
    const end = new Date(Date.now() + 3600_000); // dans 1h
    expect(computeStatus({ startDate: start, endDate: end })).toBe("ongoing");
  });
});

describe("Events — prix formaté", () => {
  it("null → null", () => expect(formatPrice(null)).toBeNull());
  it("0 → Gratuit", () => expect(formatPrice(0)).toBe("Gratuit"));
  it("4500 → 45,00 €", () => expect(formatPrice(4500)).toBe("45,00 €"));
  it("100 → 1,00 €", () => expect(formatPrice(100)).toBe("1,00 €"));
});

describe("Events — validation Zod", () => {
  it("slug invalide → erreur", async () => {
    const { createEventInputSchema } =
      await import("~/server/domains/events/types");
    expect(() =>
      createEventInputSchema.parse({
        title: "Test",
        slug: "Slug Invalide!!",
        type: "tournament",
        startDate: new Date().toISOString(),
      }),
    ).toThrow();
  });

  it("slug valide → OK", async () => {
    const { createEventInputSchema } =
      await import("~/server/domains/events/types");
    const result = createEventInputSchema.parse({
      title: "Tournoi de Pâques",
      slug: "tournoi-paques-2026",
      type: "tournament",
      startDate: new Date().toISOString(),
    });
    expect(result.slug).toBe("tournoi-paques-2026");
  });

  it("email inscription invalide → erreur", async () => {
    const { registerForEventSchema } =
      await import("~/server/domains/events/types");
    expect(() =>
      registerForEventSchema.parse({
        firstName: "Jean",
        lastName: "Dupont",
        email: "pas-un-email",
      }),
    ).toThrow();
  });
});
