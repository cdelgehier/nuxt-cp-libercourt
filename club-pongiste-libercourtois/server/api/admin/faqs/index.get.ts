import { getFaqs } from "~~/server/domains/club/service";

export default defineEventHandler(async () => {
  const { faqs } = await getFaqs();
  return { data: faqs };
});
