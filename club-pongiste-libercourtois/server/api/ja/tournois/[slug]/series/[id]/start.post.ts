import { startSeries } from "~~/server/domains/tournament/service";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, message: "ID invalide" });
  await startSeries(id);
  return { success: true };
});
