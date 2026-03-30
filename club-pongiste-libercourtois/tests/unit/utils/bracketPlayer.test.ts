import { describe, it, expect } from "vitest";
import {
  playerDisplayName,
  buildLicenseeFromRegistration,
  licenseeDetailsSchema,
} from "../../../app/utils/bracketPlayer";

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

const BASE_REG = {
  licenceNumber: "1234567",
  firstName: "Aaron",
  lastName: "MOLLET",
  playerGender: "M" as const,
  playerCategory: null,
  ranking: null,
};

describe("buildLicenseeFromRegistration", () => {
  it("sans données Smartping : utilise les données DB", () => {
    const result = buildLicenseeFromRegistration(BASE_REG);
    expect(result.licence).toBe("1234567");
    expect(result.firstName).toBe("Aaron");
    expect(result.lastName).toBe("MOLLET");
    expect(result.sexe).toBe("M");
    expect(result.cat).toBe("");
    expect(result.clast).toBe("NC");
    expect(result.points).toBeUndefined();
    expect(result.pointm).toBeUndefined();
  });

  it("avec données Smartping : les champs Smartping priment", () => {
    const fetched = {
      sexe: "H",
      cat: "S",
      clast: "1234",
      points: 1234,
      pointm: "1234",
    };
    const result = buildLicenseeFromRegistration(BASE_REG, fetched);
    expect(result.sexe).toBe("H");
    expect(result.cat).toBe("S");
    expect(result.clast).toBe("1234");
    expect(result.points).toBe(1234);
    expect(result.pointm).toBe("1234");
  });

  it("avec ranking DB non nul : clast et points issus de la DB si pas de Smartping", () => {
    const reg = { ...BASE_REG, ranking: 875 };
    const result = buildLicenseeFromRegistration(reg);
    expect(result.clast).toBe("875");
    expect(result.points).toBe(875);
  });

  it("Smartping null : fallback complet sur la DB", () => {
    const result = buildLicenseeFromRegistration(BASE_REG, null);
    expect(result.clast).toBe("NC");
    expect(result.cat).toBe("");
  });

  it("champs Smartping undefined : conserve la valeur DB", () => {
    const result = buildLicenseeFromRegistration(
      { ...BASE_REG, ranking: 500 },
      { cat: undefined, clast: undefined, points: undefined },
    );
    expect(result.clast).toBe("500");
    expect(result.points).toBe(500);
    expect(result.cat).toBe("");
  });

  it("playerGender null : sexe par défaut à M", () => {
    const result = buildLicenseeFromRegistration({
      ...BASE_REG,
      playerGender: null,
    });
    expect(result.sexe).toBe("M");
  });
});

describe("licenseeDetailsSchema", () => {
  it("accepte un objet Smartping complet", () => {
    const parsed = licenseeDetailsSchema.safeParse({
      sexe: "M",
      cat: "S",
      clast: "1234",
      points: 1234,
      pointm: "1234",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepte un objet vide (tous les champs optionnels)", () => {
    expect(licenseeDetailsSchema.safeParse({}).success).toBe(true);
  });

  it("accepte des champs inconnus (passthrough implicite de safeParse)", () => {
    const parsed = licenseeDetailsSchema.safeParse({
      cat: "V",
      categoryDecoded: "Vétéran 45",
      categoryColor: "text-purple-500",
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.cat).toBe("V");
  });

  it("rejette points non numérique", () => {
    const parsed = licenseeDetailsSchema.safeParse({ points: "mille" });
    expect(parsed.success).toBe(false);
  });
});
