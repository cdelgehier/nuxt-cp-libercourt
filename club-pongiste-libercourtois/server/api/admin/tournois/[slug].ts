import {
  deleteTournament,
  getTournamentWithSeriesForAdmin,
  updateTournament,
} from "~~/server/domains/tournament/service";
import * as repo from "~~/server/domains/tournament/repository";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug")!;

  if (event.method === "GET") {
    return getTournamentWithSeriesForAdmin(slug);
  }

  // PATCH and DELETE need the tournament id
  const tournament = await repo.getTournamentBySlug(slug);
  if (!tournament) {
    throw createError({ statusCode: 404, message: "Tournoi introuvable" });
  }

  if (event.method === "PATCH" || event.method === "PUT") {
    const body = await readBody(event);
    return updateTournament(tournament.id, body);
  }

  if (event.method === "DELETE") {
    await deleteTournament(tournament.id);
    return { success: true };
  }
});
