import { describe, it, expect } from "vitest";
import { clubBgColor } from "../../../app/utils/clubColor";

describe("clubBgColor", () => {
  it("retourne une chaîne vide pour un club null", () => {
    expect(clubBgColor(null)).toBe("");
  });

  it("retourne une chaîne vide pour un club undefined", () => {
    expect(clubBgColor(undefined)).toBe("");
  });

  it("retourne une chaîne vide pour un club vide", () => {
    expect(clubBgColor("")).toBe("");
  });

  it("retourne une couleur hsl valide pour un club non vide", () => {
    const color = clubBgColor("DOUAI TT");
    expect(color).toMatch(/^hsl\(\d+, 60%, 88%\)$/);
  });

  it("est déterministe — même club donne toujours la même couleur", () => {
    expect(clubBgColor("ES ARRAS TT")).toBe(clubBgColor("ES ARRAS TT"));
  });

  it("donne des couleurs différentes pour des clubs différents", () => {
    const clubs = [
      "DOUAI TT",
      "ES ARRAS TT",
      "HENIN TT",
      "LIBERCOURT TT",
      "LENS TT",
    ];
    const colors = clubs.map(clubBgColor);
    const unique = new Set(colors);
    expect(unique.size).toBe(clubs.length);
  });

  it("la teinte est dans l'intervalle [0, 359]", () => {
    const clubs = [
      "DOUAI TT",
      "ES ARRAS TT",
      "HENIN TT",
      "LIBERCOURT TT",
      "LILLE TT",
      "VALENCIENNES TT",
      "BOULOGNE TT",
      "CALAIS TT",
    ];
    for (const club of clubs) {
      const color = clubBgColor(club);
      const hue = Number(color.match(/hsl\((\d+)/)?.[1]);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });

  it("gère correctement les noms avec caractères spéciaux", () => {
    expect(() => clubBgColor("AS Saint-Étienne TT")).not.toThrow();
    expect(clubBgColor("AS Saint-Étienne TT")).toMatch(
      /^hsl\(\d+, 60%, 88%\)$/,
    );
  });
});
