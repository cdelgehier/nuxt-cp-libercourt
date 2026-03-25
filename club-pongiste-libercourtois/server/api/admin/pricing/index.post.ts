import { createPricing } from "~~/server/domains/club/service";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return createPricing(body);
});
