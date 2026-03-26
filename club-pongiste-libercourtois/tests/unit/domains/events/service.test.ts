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

// Import depuis la source réelle (server/domains/events/helpers.ts)
const { computeStatus, formatPrice, enrichEvent } =
  await import("~/server/domains/events/helpers");

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
  it("'0' → Gratuit", () => expect(formatPrice("0")).toBe("Gratuit"));
  it("'45' → 45,00 €", () => expect(formatPrice("45")).toBe("45,00\u00A0€"));
  it("'1' → 1,00 €", () => expect(formatPrice("1")).toBe("1,00\u00A0€"));
});

describe("Events — enrichEvent", () => {
  const baseEvent = {
    id: 1,
    title: "Tournoi",
    slug: "tournoi",
    type: "tournament",
    startDate: new Date(Date.now() + 86400_000), // demain
    endDate: null,
    location: null,
    description: null,
    maxParticipants: 10,
    isRegistrationOpen: true,
    price: "15",
    contact: null,
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("inscriptions ouvertes avec places disponibles → isRegistrationAvailable true", () => {
    const result = enrichEvent(baseEvent, 3);
    expect(result.status).toBe("upcoming");
    expect(result.isRegistrationAvailable).toBe(true);
    expect(result.spotsLeft).toBe(7);
    expect(result.formattedPrice).toBe("15,00\u00A0€");
  });

  it("complet (maxParticipants atteint) → isRegistrationAvailable false", () => {
    const result = enrichEvent(baseEvent, 10);
    expect(result.isRegistrationAvailable).toBe(false);
    expect(result.spotsLeft).toBe(0);
  });

  it("inscriptions fermées → isRegistrationAvailable false", () => {
    const result = enrichEvent({ ...baseEvent, isRegistrationOpen: false }, 0);
    expect(result.isRegistrationAvailable).toBe(false);
  });

  it("sans limite de participants → spotsLeft null", () => {
    const result = enrichEvent({ ...baseEvent, maxParticipants: null }, 99);
    expect(result.spotsLeft).toBeNull();
    expect(result.isRegistrationAvailable).toBe(true);
  });
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
