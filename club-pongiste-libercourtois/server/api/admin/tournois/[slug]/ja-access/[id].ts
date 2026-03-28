import {
  deleteJaAccess,
  updateJaAccess,
} from "~~/server/domains/tournament/service";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, message: "ID invalide" });

  if (event.method === "PATCH" || event.method === "PUT") {
    const body = await readBody<{ name?: string; isActive?: boolean }>(event);
    return updateJaAccess(id, body);
  }

  if (event.method === "DELETE") {
    await deleteJaAccess(id);
    return { success: true };
  }
});
