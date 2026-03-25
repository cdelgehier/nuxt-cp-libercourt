/**
 * Fallback Basic Auth — utilisé si Authentik (OIDC) est injoignable.
 * Credentials stockés en variables d'environnement (hash bcrypt).
 */

import { compare } from "bcryptjs";

export interface BasicAuthResult {
  valid: boolean;
  username?: string;
}

export async function verifyBasicAuth(
  authHeader: string | undefined,
): Promise<BasicAuthResult> {
  if (!authHeader?.startsWith("Basic ")) return { valid: false };

  const base64 = authHeader.slice("Basic ".length);
  const decoded = Buffer.from(base64, "base64").toString("utf-8");
  const colonIndex = decoded.indexOf(":");
  if (colonIndex === -1) return { valid: false };

  const username = decoded.slice(0, colonIndex);
  const password = decoded.slice(colonIndex + 1);

  const expectedUser = process.env.ADMIN_BASIC_AUTH_USER ?? "admin";
  const expectedHash = process.env.ADMIN_BASIC_AUTH_HASH ?? "";

  if (!expectedHash) {
    console.warn(
      "[auth] ADMIN_BASIC_AUTH_HASH non défini — Basic Auth désactivé",
    );
    return { valid: false };
  }

  if (username !== expectedUser) return { valid: false };

  const valid = await compare(password, expectedHash);
  return { valid, username: valid ? username : undefined };
}
