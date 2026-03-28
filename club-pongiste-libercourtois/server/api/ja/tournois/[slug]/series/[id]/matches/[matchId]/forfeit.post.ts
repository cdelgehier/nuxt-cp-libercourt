import { enterForfeit } from "~~/server/domains/tournament/service";
import { forfeitInputSchema } from "~~/server/domains/tournament/types";
import { getJaAccessId } from "~~/server/utils/requireJaOrAdmin";

export default defineEventHandler(async (event) => {
  const matchId = Number(getRouterParam(event, "matchId"));
  if (!matchId) throw createError({ statusCode: 400, message: "ID invalide" });

  const jaAccessId = await getJaAccessId(event);
  const body = forfeitInputSchema.parse(await readBody(event));
  await enterForfeit(matchId, body.winnerId, jaAccessId);
  return { success: true };
});
