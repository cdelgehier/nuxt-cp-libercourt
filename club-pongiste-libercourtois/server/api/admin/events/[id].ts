import {
  deleteEvent,
  getEventRegistrations,
  toggleRegistration,
  updateEvent,
} from "~~/server/domains/events/service";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, message: "ID invalide" });

  if (event.method === "PATCH" || event.method === "PUT") {
    const body = await readBody(event);
    // Cas spécial : toggle des inscriptions
    if ("isRegistrationOpen" in body && Object.keys(body).length === 1) {
      return toggleRegistration(id, body.isRegistrationOpen);
    }
    return updateEvent(id, body);
  }
  if (event.method === "DELETE") {
    await deleteEvent(id);
    return { success: true };
  }
  if (event.method === "GET") {
    return getEventRegistrations(id);
  }
});
