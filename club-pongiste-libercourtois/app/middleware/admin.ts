/**
 * Middleware front — protège les pages /admin/*.
 * Vérifie OIDC d'abord, puis la session basic auth (fallback SSO down).
 */

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith("/admin") || to.path === "/admin/login") return;

  // 1. Session OIDC
  const { loggedIn } = useOidcAuth();
  if (loggedIn.value) return;

  // 2. Session basic auth (cookie httpOnly)
  try {
    const session = await $fetch<{ user: string | null }>("/api/auth/session");
    if (session?.user) return;
  } catch {
    // pas de session basic auth
  }

  // Non authentifié → page de login
  return navigateTo(`/admin/login?redirect=${encodeURIComponent(to.fullPath)}`);
});
