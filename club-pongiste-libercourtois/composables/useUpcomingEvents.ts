// Composable to fetch and validate upcoming events
// Uses Zod schema for data validation and type safety
import { EventsResponseSchema, type CalendarEvent } from "~/schemas";

export const useUpcomingEvents = async (limit: number = 3) => {
  // Fetch events from API
  const { data, error } = await useFetch(`/api/events/upcoming?limit=${limit}`);

  // Validate response with Zod schema
  const validationResult = EventsResponseSchema.safeParse(data.value);

  if (!validationResult.success) {
    console.error("Events data validation failed:", validationResult.error);
    return {
      events: [] as CalendarEvent[],
      error: validationResult.error,
    };
  }

  return {
    events: validationResult.data.events,
    error: error.value,
  };
};
