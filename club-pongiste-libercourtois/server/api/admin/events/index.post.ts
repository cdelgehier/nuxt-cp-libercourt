import { createEvent } from "~~/server/domains/events/service";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return createEvent(body);
});
