/**
 * GET /api/admin/events/:id/registrations
 * Admin full list (includes notes, isPaid, email, phone).
 * Optional query param: ?paid=true|false to filter by payment status.
 */
import { getAdminEventRegistrations } from "~~/server/domains/events/service";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (isNaN(id) || id <= 0) {
    throw createError({ statusCode: 400, message: "ID invalide" });
  }

  const query = getQuery(event);
  let paid: boolean | undefined;
  if (query.paid === "true") paid = true;
  else if (query.paid === "false") paid = false;

  return getAdminEventRegistrations(id, paid);
});
