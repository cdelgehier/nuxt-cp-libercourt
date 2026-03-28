import { enterMatchScore } from "~~/server/domains/tournament/service";
import { getJaAccessId } from "~~/server/utils/requireJaOrAdmin";

export default defineEventHandler(async (event) => {
  const matchId = Number(getRouterParam(event, "matchId"));
  if (!matchId) throw createError({ statusCode: 400, message: "ID invalide" });

  const jaAccessId = await getJaAccessId(event);
  const body = await readBody(event);
  return enterMatchScore(matchId, body, jaAccessId);
});
