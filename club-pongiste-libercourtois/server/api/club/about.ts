import { getAboutSection } from "~~/server/domains/club/repository";

export default defineEventHandler(async () => {
  const section = await getAboutSection("about");
  if (!section?.content) {
    throw createError({
      statusCode: 500,
      statusMessage: "Données club introuvables. Lancez le seed.",
    });
  }
  return section.content;
});
