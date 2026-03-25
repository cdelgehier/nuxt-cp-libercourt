import { getSponsors } from "~~/server/domains/club/service";

export default defineEventHandler(async () => {
  return { data: await getSponsors() };
});
