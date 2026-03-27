import { deleteSchedule, updateSchedule } from "~~/server/domains/club/service";
import { purgeTags } from "~~/server/utils/purgeCache";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, message: "ID invalide" });

  if (event.method === "PATCH" || event.method === "PUT") {
    const body = await readBody(event);
    const result = await updateSchedule(id, body);
    await purgeTags("horaires-pricing");
    return result;
  }
  if (event.method === "DELETE") {
    await deleteSchedule(id);
    await purgeTags("horaires-pricing");
    return { success: true };
  }
});
