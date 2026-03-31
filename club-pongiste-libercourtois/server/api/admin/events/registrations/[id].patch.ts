/**
 * PATCH /api/admin/events/registrations/:id
 * Admin toggles payment status.
 * Body: { isPaid: boolean }
 */
import { patchRegistrationPayment } from "~~/server/domains/events/service";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: "ID invalide" });
  }

  const body = await readBody(event);
  return patchRegistrationPayment(id, body);
});
