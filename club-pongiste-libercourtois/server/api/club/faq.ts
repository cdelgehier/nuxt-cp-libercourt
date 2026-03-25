import { getFaqs } from "~~/server/domains/club/service";

export default defineEventHandler(async () => {
  return getFaqs();
});
