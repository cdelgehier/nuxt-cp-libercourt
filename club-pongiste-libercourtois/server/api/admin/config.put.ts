import { updateConfig } from "~~/server/domains/club/service";
import { purgeTags } from "~~/server/utils/purgeCache";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const result = await updateConfig(body);
  await purgeTags("config", "club");
  return result;
});
