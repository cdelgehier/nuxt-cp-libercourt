import { getUpcomingEvents } from "~~/server/domains/events/service";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const limit = query.limit ? Number(query.limit) : 3;
  const events = await getUpcomingEvents(limit);
  return { events };
});
