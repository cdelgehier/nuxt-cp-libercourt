// Composable to fetch and validate upcoming events
// Uses Zod schema for data validation and type safety
import { EventsResponseSchema, type CalendarEvent } from "~/schemas";

export const useUpcomingEvents = (limit: number = 3) => {
  // Fetch events from API with server: true to ensure SSR consistency
  const { data, error } = useFetch(`/api/events/upcoming?limit=${limit}`, {
    key: `upcoming-events-${limit}`,
    // Ensure data is fetched on server-side to prevent hydration mismatch
    server: true,
    // Transform the data immediately to ensure consistent SSR/client data
    transform: (rawData) => {
      const validationResult = EventsResponseSchema.safeParse(rawData);

      if (!validationResult.success) {
        console.error("Events data validation failed:", validationResult.error);
        return [] as CalendarEvent[];
      }

      return validationResult.data.events;
    },
    // Provide default value to prevent hydration mismatch
    default: () => [] as CalendarEvent[],
  });

  return {
    events: data,
    error,
  };
};
