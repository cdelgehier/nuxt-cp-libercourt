/**
 * Middleware serveur — protège :
 *   - /api/admin/* : admin uniquement (OIDC ou basic auth)
 *   - /api/ja/tournois/* : JA ou admin (session JA ou session admin)
 *
 * Les routes /api/ja/auth (login/logout JA) sont publiques.
 */

// @ts-expect-error — auto-imported by nuxt-oidc-auth at runtime
import { getUserSession } from "nuxt-oidc-auth/runtime/server/utils/session.js";
import { verifyBasicAuth } from "~~/server/domains/identity/basic";

const SESSION_PASSWORD =
  process.env.SESSION_SECRET ?? "fallback-change-me-in-production";

export default defineEventHandler(async (event) => {
  const path = event.path;

  // Only applies to admin and JA tournament routes
  const isAdminRoute = path.startsWith("/api/admin");
  const isJaRoute = path.startsWith("/api/ja/tournois");
  if (!isAdminRoute && !isJaRoute) return;

  // Check admin session (shared by both route types)
  // 1. Session OIDC
  try {
    const session = await getUserSession(event);
    if (session && Object.keys(session).length > 0) return;
  } catch {
    // pas de session OIDC
  }

  // 2. Session basic auth (cookie httpOnly)
  try {
    const session = await useSession(event, { password: SESSION_PASSWORD });
    if (session.data.user) return;
  } catch {
    // pas de session basic auth
  }

  // 3. Header Authorization: Basic (curl / scripts)
  const authHeader = getHeader(event, "authorization");
  const result = await verifyBasicAuth(authHeader);
  if (result.valid) return;

  // JA routes also accept a valid JA session
  if (isJaRoute) {
    try {
      const session = await useSession(event, { password: SESSION_PASSWORD });
      if (session.data.jaAccessId) return;
    } catch {
      // pas de session JA
    }
  }

  throw createError({ statusCode: 401, message: "Authentification requise" });
});
