import { describe, expect, it, vi, beforeEach } from "vitest";
import { hash } from "bcryptjs";

// Mock console.warn to avoid noise in test output
vi.spyOn(console, "warn").mockImplementation(() => {});

const { verifyBasicAuth } = await import("~/server/domains/identity/basic");

function encodeBasic(user: string, pass: string) {
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

describe("verifyBasicAuth — format invalide", () => {
  it("undefined → invalid", async () => {
    expect(await verifyBasicAuth(undefined)).toEqual({ valid: false });
  });

  it("sans préfixe Basic → invalid", async () => {
    expect(await verifyBasicAuth("Bearer token123")).toEqual({ valid: false });
  });

  it("base64 sans ':' → invalid", async () => {
    const b64 = Buffer.from("useronly").toString("base64");
    expect(await verifyBasicAuth(`Basic ${b64}`)).toEqual({ valid: false });
  });

  it("hash non défini → invalid (avec warn)", async () => {
    vi.stubEnv("ADMIN_BASIC_AUTH_USER", "admin");
    vi.stubEnv("ADMIN_BASIC_AUTH_HASH", "");
    const result = await verifyBasicAuth(encodeBasic("admin", "anything"));
    expect(result).toEqual({ valid: false });
    expect(console.warn).toHaveBeenCalled();
  });
});

describe("verifyBasicAuth — credentials corrects", () => {
  beforeEach(async () => {
    const h = await hash("motdepasse", 10);
    vi.stubEnv("ADMIN_BASIC_AUTH_USER", "admin");
    vi.stubEnv("ADMIN_BASIC_AUTH_HASH", h);
  });

  it("bon user + bon mot de passe → valid", async () => {
    const result = await verifyBasicAuth(encodeBasic("admin", "motdepasse"));
    expect(result).toEqual({ valid: true, username: "admin" });
  });

  it("mauvais user → invalid", async () => {
    const result = await verifyBasicAuth(encodeBasic("hacker", "motdepasse"));
    expect(result).toEqual({ valid: false });
  });

  it("mauvais mot de passe → invalid", async () => {
    const result = await verifyBasicAuth(encodeBasic("admin", "mauvais"));
    expect(result).toEqual({ valid: false });
  });
});
