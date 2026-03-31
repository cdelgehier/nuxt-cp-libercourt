import { describe, expect, it } from "vitest";
import {
  registerForEventSchema,
  patchRegistrationPaymentSchema,
} from "~/server/domains/events/types";

describe("registerForEventSchema", () => {
  it("champs minimaux (prénom + nom) → OK, companions défaut 0", () => {
    const result = registerForEventSchema.parse({
      firstName: "Jean",
      lastName: "Dupont",
    });
    expect(result.firstName).toBe("Jean");
    expect(result.lastName).toBe("Dupont");
    expect(result.companions).toBe(0);
  });

  it("prénom trop court → erreur", () => {
    expect(() =>
      registerForEventSchema.parse({ firstName: "J", lastName: "Dupont" }),
    ).toThrow();
  });

  it("nom trop court → erreur", () => {
    expect(() =>
      registerForEventSchema.parse({ firstName: "Jean", lastName: "D" }),
    ).toThrow();
  });

  it("email absent → OK (optionnel)", () => {
    expect(() =>
      registerForEventSchema.parse({ firstName: "Jean", lastName: "Dupont" }),
    ).not.toThrow();
  });

  it("email valide → OK", () => {
    const result = registerForEventSchema.parse({
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean@exemple.fr",
    });
    expect(result.email).toBe("jean@exemple.fr");
  });

  it("email invalide → erreur", () => {
    expect(() =>
      registerForEventSchema.parse({
        firstName: "Jean",
        lastName: "Dupont",
        email: "pas-un-email",
      }),
    ).toThrow();
  });

  it("notes > 500 chars → erreur", () => {
    expect(() =>
      registerForEventSchema.parse({
        firstName: "Jean",
        lastName: "Dupont",
        notes: "x".repeat(501),
      }),
    ).toThrow();
  });

  it("notes à 500 chars exactement → OK", () => {
    expect(() =>
      registerForEventSchema.parse({
        firstName: "Jean",
        lastName: "Dupont",
        notes: "x".repeat(500),
      }),
    ).not.toThrow();
  });

  it("companions négatif → erreur", () => {
    expect(() =>
      registerForEventSchema.parse({
        firstName: "Jean",
        lastName: "Dupont",
        companions: -1,
      }),
    ).toThrow();
  });

  it("companions > 20 → erreur", () => {
    expect(() =>
      registerForEventSchema.parse({
        firstName: "Jean",
        lastName: "Dupont",
        companions: 21,
      }),
    ).toThrow();
  });

  it("companions = 20 → OK", () => {
    const result = registerForEventSchema.parse({
      firstName: "Jean",
      lastName: "Dupont",
      companions: 20,
    });
    expect(result.companions).toBe(20);
  });

  it("companions absent → défaut 0", () => {
    const result = registerForEventSchema.parse({
      firstName: "Jean",
      lastName: "Dupont",
    });
    expect(result.companions).toBe(0);
  });
});

describe("patchRegistrationPaymentSchema", () => {
  it("isPaid: true → OK", () => {
    const result = patchRegistrationPaymentSchema.parse({ isPaid: true });
    expect(result.isPaid).toBe(true);
  });

  it("isPaid: false → OK", () => {
    const result = patchRegistrationPaymentSchema.parse({ isPaid: false });
    expect(result.isPaid).toBe(false);
  });

  it("isPaid absent → erreur", () => {
    expect(() => patchRegistrationPaymentSchema.parse({})).toThrow();
  });

  it("isPaid non-booléen → erreur", () => {
    expect(() =>
      patchRegistrationPaymentSchema.parse({ isPaid: "oui" }),
    ).toThrow();
  });
});
