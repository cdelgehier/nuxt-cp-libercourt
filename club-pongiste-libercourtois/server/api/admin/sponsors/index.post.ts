import { createSponsor } from "~~/server/domains/club/service";
import { purgeTags } from "~~/server/utils/purgeCache";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const result = await createSponsor(body);
  await purgeTags("sponsors");
  return result;
});
