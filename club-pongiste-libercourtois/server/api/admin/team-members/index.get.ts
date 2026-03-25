import { getTeamMembers } from "~~/server/domains/club/service";

export default defineEventHandler(async () => {
  return { data: await getTeamMembers() };
});
