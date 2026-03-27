import {
  deleteTeamMember,
  updateTeamMember,
} from "~~/server/domains/club/service";
import { purgeTags } from "~~/server/utils/purgeCache";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, message: "ID invalide" });

  if (event.method === "PATCH" || event.method === "PUT") {
    const body = await readBody(event);
    const result = await updateTeamMember(id, body);
    await purgeTags("club");
    return result;
  }
  if (event.method === "DELETE") {
    await deleteTeamMember(id);
    await purgeTags("club");
    return { success: true };
  }
});
