import { getAllEvents } from "~~/server/domains/events/service";

export default defineEventHandler(async () => {
  const { events } = await getAllEvents();
  return { data: events };
});
