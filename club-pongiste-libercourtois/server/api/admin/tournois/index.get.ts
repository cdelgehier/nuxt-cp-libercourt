import { getAllTournamentsForAdmin } from "~~/server/domains/tournament/service";

export default defineEventHandler(async () => {
  return getAllTournamentsForAdmin();
});
