import { swapPlayersInBracket } from "~~/server/domains/tournament/service";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, message: "ID invalide" });
  const body = await readBody(event);
  await swapPlayersInBracket(id, body);
  return { success: true };
});
