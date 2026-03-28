/**
 * Returns the jaAccessId from session, or null if caller is admin
 * (OIDC or basic auth). The server middleware already ensures auth is valid.
 */

import { getUserSession } from "nuxt-oidc-auth/runtime/server/utils/session.js";
import type { H3Event } from "h3";

const SESSION_PASSWORD =
  process.env.SESSION_SECRET ?? "fallback-change-me-in-production";

export async function getJaAccessId(event: H3Event): Promise<number | null> {
  try {
    const oidc = await getUserSession(event);
    if (oidc && Object.keys(oidc).length > 0) return null;
  } catch {
    // not OIDC
  }

  try {
    const session = await useSession(event, { password: SESSION_PASSWORD });
    if (session.data.user) return null;
  } catch {
    // not basic auth
  }

  try {
    const session = await useSession(event, { password: SESSION_PASSWORD });
    if (session.data.jaAccessId) return session.data.jaAccessId as number;
  } catch {
    // no session
  }

  return null;
}
