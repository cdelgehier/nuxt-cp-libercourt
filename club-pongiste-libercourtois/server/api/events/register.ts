/**
 * POST /api/events/register
 * Inscription à un événement via le service DDD.
 */
import { registerForEvent } from "~~/server/domains/events/service";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { eventId, participant } = body;

  if (!eventId || !participant) {
    throw createError({
      statusCode: 400,
      message: "eventId et participant requis",
    });
  }

  return registerForEvent(Number(eventId), participant);
});
