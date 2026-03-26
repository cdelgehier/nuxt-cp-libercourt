import { getUpcomingEvents } from "~~/server/domains/events/service";

export default defineCachedEventHandler(
  async (event) => {
    const query = getQuery(event);
    const limit = query.limit ? Number(query.limit) : 3;
    const events = await getUpcomingEvents(limit);
    return { events };
  },
  {
    maxAge: 60,
    name: "events-upcoming",
    getKey: (event) => `limit-${getQuery(event).limit ?? 3}`,
  },
);
