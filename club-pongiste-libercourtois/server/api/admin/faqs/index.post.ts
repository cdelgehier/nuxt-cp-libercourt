import { createFaq } from "~~/server/domains/club/service";
import { purgeTags } from "~~/server/utils/purgeCache";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const result = await createFaq(body);
  await purgeTags("faq");
  return result;
});
