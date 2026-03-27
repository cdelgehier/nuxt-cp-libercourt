import { createEvent } from "~~/server/domains/events/service";
import { purgeTags } from "~~/server/utils/purgeCache";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const result = await createEvent(body);
  await purgeTags("events");
  return result;
});
