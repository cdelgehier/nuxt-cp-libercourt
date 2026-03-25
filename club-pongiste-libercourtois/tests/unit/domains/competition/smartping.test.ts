import { describe, expect, it } from "vitest";

/**
 * Tests du parsing des données SmartPing.
 * On teste les fonctions d'extraction depuis les noms d'équipes FFTT.
 */

// Importer les utilitaires depuis le domaine competition
import {
  extractDivisionId,
  extractPhaseFromTeamName,
  extractPouleId,
  extractTeamNumber,
  getPhaseDescription,
  getPhaseLabel,
  getUniqueTeamKey,
  groupTeamsByPhase,
} from "~/server/domains/competition/teams";

describe("SmartPing — extraction de phase", () => {
  it("extrait Phase 1", () => {
    expect(extractPhaseFromTeamName("LIBERCOURT CP (1) - Phase 1")).toBe(1);
  });

  it("extrait Phase 2", () => {
    expect(extractPhaseFromTeamName("LIBERCOURT CP (2) - Phase 2")).toBe(2);
  });

  it("retourne 1 par défaut si pas de phase", () => {
    expect(extractPhaseFromTeamName("LIBERCOURT CP (1)")).toBe(1);
  });
});

describe("SmartPing — extraction de poule et division", () => {
  const link = "cx_poule=1164490&D1=206205&organisme_pere=67";

  it("extrait le cx_poule", () => {
    expect(extractPouleId(link)).toBe("1164490");
  });

  it("retourne chaîne vide si cx_poule absent", () => {
    expect(extractPouleId("D1=206205")).toBe("");
  });

  it("extrait le D1", () => {
    expect(extractDivisionId(link)).toBe("206205");
  });

  it("retourne chaîne vide si D1 absent", () => {
    expect(extractDivisionId("cx_poule=1164490")).toBe("");
  });
});

describe("SmartPing — clé unique équipe", () => {
  it("compose idequipe-cx_poule", () => {
    expect(getUniqueTeamKey("27182", "cx_poule=1164490&D1=206205")).toBe(
      "27182-1164490",
    );
  });
});

describe("SmartPing — numéro d'équipe", () => {
  it('extrait le numéro depuis "CP (2)"', () => {
    expect(extractTeamNumber("LIBERCOURT CP (2) - Phase 1")).toBe(2);
  });

  it("retourne 1 par défaut", () => {
    expect(extractTeamNumber("LIBERCOURT CP")).toBe(1);
  });
});

describe("SmartPing — labels de phase", () => {
  it('Phase 1 → contient "1"', () => {
    expect(getPhaseLabel(1)).toContain("1");
  });

  it('Phase 2 → contient "2"', () => {
    expect(getPhaseLabel(2)).toContain("2");
  });
});

describe("SmartPing — description de phase", () => {
  it("Phase 1 → première partie de saison", () => {
    expect(getPhaseDescription(1)).toContain("Première");
  });

  it("Phase 2 → deuxième partie de saison", () => {
    expect(getPhaseDescription(2)).toContain("Deuxième");
  });

  it("Phase 3 → fallback générique", () => {
    expect(getPhaseDescription(3)).toContain("3");
  });
});

describe("SmartPing — groupement par phase", () => {
  const mockTeams = [
    { idequipe: "1", libequipe: "LIBERCOURT CP (1) - Phase 1", phase: 1 },
    { idequipe: "1", libequipe: "LIBERCOURT CP (1) - Phase 2", phase: 2 },
    { idequipe: "2", libequipe: "LIBERCOURT CP (2) - Phase 1", phase: 1 },
  ];

  it("groupe correctement par phase", () => {
    const grouped = groupTeamsByPhase(mockTeams);
    expect(grouped[1]).toHaveLength(2);
    expect(grouped[2]).toHaveLength(1);
  });

  it("retourne un objet vide pour un tableau vide", () => {
    expect(groupTeamsByPhase([])).toEqual({});
  });
});
