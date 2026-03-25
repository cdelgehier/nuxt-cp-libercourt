import { getAllEvents } from "~~/server/domains/events/service";

export default defineEventHandler(async () => {
  return getAllEvents();
});
