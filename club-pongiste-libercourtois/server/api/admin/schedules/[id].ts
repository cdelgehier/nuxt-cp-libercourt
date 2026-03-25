import { deleteSchedule, updateSchedule } from "~~/server/domains/club/service";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, message: "ID invalide" });

  if (event.method === "PATCH" || event.method === "PUT") {
    const body = await readBody(event);
    return updateSchedule(id, body);
  }
  if (event.method === "DELETE") {
    await deleteSchedule(id);
    return { success: true };
  }
});
