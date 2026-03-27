import { createPricing } from "~~/server/domains/club/service";
import { purgeTags } from "~~/server/utils/purgeCache";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const result = await createPricing(body);
  await purgeTags("horaires-pricing");
  return result;
});
