import { deleteFaq, updateFaq } from "~~/server/domains/club/service";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, message: "ID invalide" });

  if (event.method === "PATCH" || event.method === "PUT") {
    const body = await readBody(event);
    return updateFaq(id, body);
  }
  if (event.method === "DELETE") {
    await deleteFaq(id);
    return { success: true };
  }
});
