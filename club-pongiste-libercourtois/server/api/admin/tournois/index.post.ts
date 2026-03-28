import { createTournament } from "~~/server/domains/tournament/service";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return createTournament(body);
});
