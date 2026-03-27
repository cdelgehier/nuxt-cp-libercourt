import {
  deleteEvent,
  getEventRegistrations,
  toggleRegistration,
  updateEvent,
} from "~~/server/domains/events/service";
import { purgeTags } from "~~/server/utils/purgeCache";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, message: "ID invalide" });

  if (event.method === "PATCH" || event.method === "PUT") {
    const body = await readBody(event);
    // Cas spécial : toggle des inscriptions
    if ("isRegistrationOpen" in body && Object.keys(body).length === 1) {
      const result = await toggleRegistration(id, body.isRegistrationOpen);
      await purgeTags("events");
      return result;
    }
    const result = await updateEvent(id, body);
    await purgeTags("events");
    return result;
  }
  if (event.method === "DELETE") {
    await deleteEvent(id);
    await purgeTags("events");
    return { success: true };
  }
  if (event.method === "GET") {
    return getEventRegistrations(id);
  }
});
