import {
  removeRegistration,
  updateRegistration,
} from "~~/server/domains/tournament/service";

export default defineEventHandler(async (event) => {
  const regId = Number(getRouterParam(event, "regId"));
  if (!regId) throw createError({ statusCode: 400, message: "ID invalide" });

  if (event.method === "PATCH" || event.method === "PUT") {
    const body = await readBody(event);
    return updateRegistration(regId, body);
  }

  if (event.method === "DELETE") {
    await removeRegistration(regId);
    return { success: true };
  }
});
