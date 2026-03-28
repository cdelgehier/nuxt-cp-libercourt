import * as repo from "~~/server/domains/tournament/repository";

/**
 * Public endpoint: returns only {id, name} for active JA accesses.
 * Used by the JA login page — no PIN is exposed.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug")!;
  const tournament = await repo.getTournamentBySlug(slug);
  if (!tournament) {
    throw createError({ statusCode: 404, message: "Tournoi introuvable" });
  }
  const accesses = await repo.getJaAccessByTournament(tournament.id);
  return accesses
    .filter((a) => a.isActive)
    .map((a) => ({ id: a.id, name: a.name }));
});
