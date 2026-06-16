import { updateConfig } from "~~/server/domains/club/service";
import { purgePaths, purgeTags } from "~~/server/utils/purgeCache";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const result = await updateConfig(body);
  await Promise.all([
    purgeTags("config", "club"),
    purgePaths("/api/club/config", "/club"),
  ]);
  return result;
});
