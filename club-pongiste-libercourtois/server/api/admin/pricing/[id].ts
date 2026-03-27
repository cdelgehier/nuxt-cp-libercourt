import { deletePricing, updatePricing } from "~~/server/domains/club/service";
import { purgeTags } from "~~/server/utils/purgeCache";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, message: "ID invalide" });

  if (event.method === "PATCH" || event.method === "PUT") {
    const body = await readBody(event);
    const result = await updatePricing(id, body);
    await purgeTags("horaires-pricing");
    return result;
  }
  if (event.method === "DELETE") {
    await deletePricing(id);
    await purgeTags("horaires-pricing");
    return { success: true };
  }
});
