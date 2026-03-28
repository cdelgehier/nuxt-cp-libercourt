import { getUserSession } from "nuxt-oidc-auth/runtime/server/utils/session.js";

const SESSION_PASSWORD =
  process.env.SESSION_SECRET ?? "fallback-change-me-in-production";

export default defineEventHandler(async (event) => {
  // Admin via OIDC
  try {
    const oidc = await getUserSession(event);
    if (oidc && Object.keys(oidc).length > 0) {
      return {
        jaAccessId: null,
        jaName: "Administrateur",
        tournamentId: null,
        isAdmin: true,
      };
    }
  } catch {
    /* not OIDC */
  }

  // Admin via basic auth
  try {
    const session = await useSession(event, { password: SESSION_PASSWORD });
    if (session.data.user) {
      return {
        jaAccessId: null,
        jaName: String(session.data.user),
        tournamentId: null,
        isAdmin: true,
      };
    }
  } catch {
    /* not basic auth */
  }

  // JA session
  try {
    const session = await useSession(event, { password: SESSION_PASSWORD });
    if (session.data.jaAccessId) {
      return {
        jaAccessId: session.data.jaAccessId as number,
        jaName: session.data.jaName as string,
        tournamentId: session.data.jaTournamentId as number,
        isAdmin: false,
      };
    }
  } catch {
    /* no session */
  }

  throw createError({ statusCode: 401, message: "Non connecté" });
});
