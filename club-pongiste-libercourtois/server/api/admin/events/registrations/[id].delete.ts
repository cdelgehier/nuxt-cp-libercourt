/**
 * DELETE /api/admin/events/registrations/:id
 * Admin removes a registration.
 */
import { deleteRegistration } from "~~/server/domains/events/service";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: "ID invalide" });
  }

  await deleteRegistration(id);
  return { success: true };
});
