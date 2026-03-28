import { getTournamentWithSeriesForPublic } from "~~/server/domains/tournament/service";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug")!;
  return getTournamentWithSeriesForPublic(slug);
});
