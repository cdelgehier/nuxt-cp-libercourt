import { describe, it, expect } from "vitest";
import { playerDisplayName } from "../../../app/utils/bracketPlayer";

describe("playerDisplayName", () => {
  it("retourne une chaîne vide pour null", () => {
    expect(playerDisplayName(null)).toBe("");
  });

  it("retourne prénom nom pour un simple", () => {
    expect(
      playerDisplayName({ firstName: "Guillaume", lastName: "FAURE" }),
    ).toBe("Guillaume FAURE");
  });

  it("ne contient JAMAIS le nom du club pour un simple", () => {
    const result = playerDisplayName({
      firstName: "Guillaume",
      lastName: "FAURE",
      partnerLastName: null,
    });
    expect(result).toBe("Guillaume FAURE");
    expect(result).not.toContain("·");
    expect(result).not.toContain("—");
  });

  it("retourne NOM / PARTENAIRE pour un double", () => {
    expect(
      playerDisplayName({
        firstName: "Guillaume",
        lastName: "FAURE",
        partnerLastName: "MOREAU",
      }),
    ).toBe("FAURE / MOREAU");
  });

  it("ne contient JAMAIS le nom du club pour un double", () => {
    const result = playerDisplayName({
      firstName: "Guillaume",
      lastName: "FAURE",
      partnerLastName: "MOREAU",
    });
    expect(result).toBe("FAURE / MOREAU");
    expect(result).not.toContain("·");
    expect(result).not.toContain("—");
    expect(result).not.toContain("LIBERCOURT");
    expect(result).not.toContain("ARRAS");
  });

  it("ignore partnerLastName vide ou undefined", () => {
    expect(
      playerDisplayName({
        firstName: "Pierre",
        lastName: "ROBERT",
        partnerLastName: undefined,
      }),
    ).toBe("Pierre ROBERT");
    expect(
      playerDisplayName({
        firstName: "Pierre",
        lastName: "ROBERT",
        partnerLastName: "",
      }),
    ).toBe("Pierre ROBERT");
  });
});
