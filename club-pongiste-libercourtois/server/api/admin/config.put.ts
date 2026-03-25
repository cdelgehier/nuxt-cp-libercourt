import { updateConfig } from "~~/server/domains/club/service";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return updateConfig(body);
});
