/**
 * Middleware serveur — protège toutes les routes /api/admin/*.
 *
 * Flux :
 * 1. Vérifier le cookie de session OIDC (via nuxt-oidc-auth)
 * 2. Vérifier la session basic auth (cookie httpOnly, POST /api/auth/basic-login)
 * 3. Vérifier le header Authorization: Basic (compatibilité scripts/curl)
 * 4. Si aucun n'est valide → 401
 */

// @ts-expect-error — auto-imported by nuxt-oidc-auth at runtime
import { getUserSession } from "nuxt-oidc-auth/runtime/server/utils/session.js";
import { verifyBasicAuth } from "~~/server/domains/identity/basic";

const SESSION_PASSWORD =
  process.env.SESSION_SECRET ?? "fallback-change-me-in-production";

export default defineEventHandler(async (event) => {
  // Ne s'applique qu'aux routes admin
  if (!event.path.startsWith("/api/admin")) return;

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

  // 4. Non authentifié
  throw createError({ statusCode: 401, message: "Authentification requise" });
});
