import * as repo from "~~/server/domains/tournament/repository";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, message: "ID invalide" });

  const matches = await repo.getMatchesBySeries(id);
  return matches.filter(
    (m) => m.status === "pending" || m.status === "in_progress",
  );
});
