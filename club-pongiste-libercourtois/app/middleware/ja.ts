/**
 * Middleware front — protège les pages /tournois/[slug]/ja (interface JA).
 * Vérifie la session JA (/api/ja/me) puis la session admin (OIDC ou basic auth).
 * Redirige vers la page de login JA si aucune session valide.
 */

export default defineNuxtRouteMiddleware(async (to) => {
  // Only protects the JA interface, not the login page
  if (!to.path.match(/^\/tournois\/[^/]+\/ja$/)) return;

  // 1. Session admin (OIDC)
  const { loggedIn } = useOidcAuth();
  if (loggedIn.value) return;

  // 2. Session admin (basic auth)
  try {
    const session = await $fetch<{ user: string | null }>("/api/auth/session");
    if (session?.user) return;
  } catch {
    // pas de session admin basic auth
  }

  // 3. Session JA
  try {
    await $fetch("/api/ja/me");
    return;
  } catch {
    // pas de session JA
  }

  // Non authentifié → page de login JA du tournoi
  const slug = to.params.slug as string;
  return navigateTo(
    `/tournois/${slug}/ja/login?redirect=${encodeURIComponent(to.fullPath)}`,
  );
});
