import { deleteFaq, updateFaq } from "~~/server/domains/club/service";
import { purgeTags } from "~~/server/utils/purgeCache";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, message: "ID invalide" });

  if (event.method === "PATCH" || event.method === "PUT") {
    const body = await readBody(event);
    const result = await updateFaq(id, body);
    await purgeTags("faq");
    return result;
  }
  if (event.method === "DELETE") {
    await deleteFaq(id);
    await purgeTags("faq");
    return { success: true };
  }
});
