import {
  deleteSeries,
  getSeriesWithBracket,
  updateSeries,
} from "~~/server/domains/tournament/service";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, message: "ID invalide" });

  if (event.method === "GET") {
    return getSeriesWithBracket(id);
  }

  if (event.method === "PATCH" || event.method === "PUT") {
    const body = await readBody(event);
    return updateSeries(id, body);
  }

  if (event.method === "DELETE") {
    await deleteSeries(id);
    return { success: true };
  }
});
