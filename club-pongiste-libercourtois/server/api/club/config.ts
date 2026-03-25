import { getConfig } from "~~/server/domains/club/service";

export default defineEventHandler(async () => {
  return getConfig();
});
