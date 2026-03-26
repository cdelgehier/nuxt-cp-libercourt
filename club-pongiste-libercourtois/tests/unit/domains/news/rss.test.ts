import { describe, expect, it } from "vitest";
import { extractImageFromHtml, stripHtml } from "~/server/domains/news/rss";

describe("RSS — extractImageFromHtml", () => {
  it("extrait l'URL de la première image", () => {
    const html =
      '<p>Texte</p><img src="https://example.com/photo.jpg" alt="test" />';
    expect(extractImageFromHtml(html)).toBe("https://example.com/photo.jpg");
  });

  it("retourne undefined si pas d'image", () => {
    expect(extractImageFromHtml("<p>Pas d'image ici</p>")).toBeUndefined();
  });

  it("extrait la première image si plusieurs", () => {
    const html =
      '<img src="https://example.com/first.jpg" /><img src="https://example.com/second.jpg" />';
    expect(extractImageFromHtml(html)).toBe("https://example.com/first.jpg");
  });

  it("retourne undefined pour une chaîne vide", () => {
    expect(extractImageFromHtml("")).toBeUndefined();
  });
});

describe("RSS — stripHtml", () => {
  it("supprime les balises HTML simples", () => {
    expect(stripHtml("<p>Bonjour</p>")).toBe("Bonjour");
  });

  it("supprime les balises imbriquées", () => {
    expect(stripHtml("<div><strong>Titre</strong> et texte</div>")).toBe(
      "Titre et texte",
    );
  });

  it("trim les espaces", () => {
    expect(stripHtml("  <p>  Texte  </p>  ")).toBe("Texte");
  });

  it("retourne une chaîne vide si que des balises", () => {
    expect(stripHtml("<br/><hr/>")).toBe("");
  });

  it("texte sans balises → inchangé (sauf trim)", () => {
    expect(stripHtml("Texte brut")).toBe("Texte brut");
  });
});
