/**
 * GET /api/events/:id/registrations
 * Public list of participants for an event (notes excluded).
 */
import { getEventRegistrations } from "~~/server/domains/events/service";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: "ID invalide" });
  }

  const { event: evt, registrations } = await getEventRegistrations(id);

  return {
    eventId: evt.id,
    registrations: registrations.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      companions: r.companions,
      registeredAt: r.registeredAt,
    })),
    count: registrations.length,
  };
});
