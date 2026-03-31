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
  findRegistrationByName: vi.fn(),
  deleteRegistration: vi.fn(),
  getRegistrationById: vi.fn(),
  patchRegistrationPayment: vi.fn(),
  getEventRegistrationsByPaid: vi.fn(),
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

  it("email inscription absent → OK (optionnel)", async () => {
    const { registerForEventSchema } =
      await import("~/server/domains/events/types");
    expect(() =>
      registerForEventSchema.parse({
        firstName: "Jean",
        lastName: "Dupont",
      }),
    ).not.toThrow();
  });
});

describe("registerForEvent — doublons", () => {
  const baseEvent = {
    id: 1,
    title: "Loto",
    slug: "loto",
    type: "social",
    startDate: new Date(Date.now() + 86400_000),
    endDate: null,
    location: null,
    description: null,
    maxParticipants: null,
    isRegistrationOpen: true,
    price: null,
    contact: null,
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("même prénom+nom sur même événement → 409", async () => {
    const repo = await import("~/server/domains/events/repository");
    const { registerForEvent } =
      await import("~/server/domains/events/service");
    vi.mocked(repo.getEventById).mockResolvedValue(baseEvent);
    vi.mocked(repo.findRegistrationByName).mockResolvedValue({
      id: 99,
      eventId: 1,
      firstName: "Jean",
      lastName: "Dupont",
      email: null,
      phone: null,
      licenceNumber: null,
      level: null,
      notes: null,
      companions: 0,
      isPaid: false,
      registeredAt: new Date(),
    });

    const err = await registerForEvent(1, {
      firstName: "Jean",
      lastName: "Dupont",
    }).catch((e) => e);
    expect(err.statusCode).toBe(409);
  });

  it("email absent → inscription OK (pas de doublon)", async () => {
    const repo = await import("~/server/domains/events/repository");
    const { registerForEvent } =
      await import("~/server/domains/events/service");
    const inserted = {
      id: 10,
      eventId: 1,
      firstName: "Marie",
      lastName: "Martin",
      email: null,
      phone: null,
      licenceNumber: null,
      level: null,
      notes: null,
      companions: 0,
      isPaid: false,
      registeredAt: new Date(),
    };
    vi.mocked(repo.getEventById).mockResolvedValue(baseEvent);
    vi.mocked(repo.findRegistrationByName).mockResolvedValue(null);
    vi.mocked(repo.insertRegistration).mockResolvedValue(inserted);

    const result = await registerForEvent(1, {
      firstName: "Marie",
      lastName: "Martin",
    });
    expect(result.firstName).toBe("Marie");
  });
});

describe("registerForEvent — capacité avec accompagnants", () => {
  const limitedEvent = {
    id: 2,
    title: "Tournoi",
    slug: "tournoi",
    type: "tournament",
    startDate: new Date(Date.now() + 86400_000),
    endDate: null,
    location: null,
    description: null,
    maxParticipants: 5,
    isRegistrationOpen: true,
    price: null,
    contact: null,
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("inscription avec accompagnants quand capacité insuffisante → refus", async () => {
    const repo = await import("~/server/domains/events/repository");
    const { registerForEvent } =
      await import("~/server/domains/events/service");
    vi.mocked(repo.getEventById).mockResolvedValue(limitedEvent);
    vi.mocked(repo.findRegistrationByName).mockResolvedValue(null);
    vi.mocked(repo.countEventRegistrations).mockResolvedValue(4); // 4 inscrits, max 5

    // 1 personne + 2 accompagnants = 3 slots nécessaires, seulement 1 disponible
    const err = await registerForEvent(2, {
      firstName: "Jean",
      lastName: "Dupont",
      companions: 2,
    }).catch((e) => e);
    expect(err.statusCode).toBe(400);
  });

  it("inscription solo quand 1 place restante → OK", async () => {
    const repo = await import("~/server/domains/events/repository");
    const { registerForEvent } =
      await import("~/server/domains/events/service");
    const inserted = {
      id: 11,
      eventId: 2,
      firstName: "Jean",
      lastName: "Dupont",
      email: null,
      phone: null,
      licenceNumber: null,
      level: null,
      notes: null,
      companions: 0,
      isPaid: false,
      registeredAt: new Date(),
    };
    vi.mocked(repo.getEventById).mockResolvedValue(limitedEvent);
    vi.mocked(repo.findRegistrationByName).mockResolvedValue(null);
    vi.mocked(repo.countEventRegistrations).mockResolvedValue(4); // 4 inscrits, 1 place
    vi.mocked(repo.insertRegistration).mockResolvedValue(inserted);

    const result = await registerForEvent(2, {
      firstName: "Jean",
      lastName: "Dupont",
      companions: 0,
    });
    expect(result.id).toBe(11);
  });

  it("inscription avec accompagnants sans limite → OK", async () => {
    const repo = await import("~/server/domains/events/repository");
    const { registerForEvent } =
      await import("~/server/domains/events/service");
    const unlimitedEvent = { ...limitedEvent, maxParticipants: null };
    const inserted = {
      id: 12,
      eventId: 2,
      firstName: "Jean",
      lastName: "Dupont",
      email: null,
      phone: null,
      licenceNumber: null,
      level: null,
      notes: null,
      companions: 5,
      isPaid: false,
      registeredAt: new Date(),
    };
    vi.mocked(repo.getEventById).mockResolvedValue(unlimitedEvent);
    vi.mocked(repo.findRegistrationByName).mockResolvedValue(null);
    vi.mocked(repo.insertRegistration).mockResolvedValue(inserted);

    const result = await registerForEvent(2, {
      firstName: "Jean",
      lastName: "Dupont",
      companions: 5,
    });
    expect(result.companions).toBe(5);
  });
});

describe("patchRegistrationPayment", () => {
  it("registration inexistante → 404", async () => {
    const repo = await import("~/server/domains/events/repository");
    const { patchRegistrationPayment } =
      await import("~/server/domains/events/service");
    vi.mocked(repo.patchRegistrationPayment).mockResolvedValue(null);

    const err = await patchRegistrationPayment(999, { isPaid: true }).catch(
      (e) => e,
    );
    expect(err.statusCode).toBe(404);
  });

  it("isPaid: true → mise à jour OK", async () => {
    const repo = await import("~/server/domains/events/repository");
    const { patchRegistrationPayment } =
      await import("~/server/domains/events/service");
    const updated = {
      id: 5,
      eventId: 1,
      firstName: "Jean",
      lastName: "Dupont",
      email: null,
      phone: null,
      licenceNumber: null,
      level: null,
      notes: null,
      companions: 0,
      isPaid: true,
      registeredAt: new Date(),
    };
    vi.mocked(repo.patchRegistrationPayment).mockResolvedValue(updated);

    const result = await patchRegistrationPayment(5, { isPaid: true });
    expect(result.isPaid).toBe(true);
  });
});
