import { describe, expect, it } from "vitest";
import { createFaqSchema, updateFaqSchema } from "~/server/domains/club/types";

describe("Club FAQ — validation Zod", () => {
  it("FAQ valide → OK", () => {
    const result = createFaqSchema.parse({
      question: "Comment s'inscrire au club ?",
      answer: "Contactez-nous par email ou venez aux permanences.",
      category: "Inscription",
    });
    expect(result.question).toContain("inscrire");
    expect(result.isPopular).toBeUndefined();
  });

  it("question trop courte → erreur", () => {
    expect(() =>
      createFaqSchema.parse({
        question: "Non",
        answer:
          "Une réponse valide suffisamment longue pour passer la validation.",
        category: "Inscription",
      }),
    ).toThrow();
  });

  it("réponse trop courte → erreur", () => {
    expect(() =>
      createFaqSchema.parse({
        question: "Question valide avec plus de 5 caractères",
        answer: "Non",
        category: "Inscription",
      }),
    ).toThrow();
  });

  it("updateFaq partiel → OK", () => {
    const result = updateFaqSchema.parse({
      isPopular: true,
    });
    expect(result.isPopular).toBe(true);
  });
});

describe("Club FAQ — catégories", () => {
  it("catégorie vide → erreur", () => {
    expect(() =>
      createFaqSchema.parse({
        question: "Question valide",
        answer: "Réponse valide suffisamment longue.",
        category: "",
      }),
    ).toThrow();
  });
});
