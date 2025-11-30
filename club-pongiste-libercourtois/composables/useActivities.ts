// Composable to fetch and validate activities data
// Uses Zod schema for data validation and type safety
import { ActivitiesResponseSchema, type Activity } from "~/schemas";

export const useActivities = () => {
  // Fetch activities from API endpoint with server: true to ensure SSR consistency
  const { data, error } = useFetch("/api/activities", {
    key: "activities",
    // Ensure data is fetched on server-side to prevent hydration mismatch
    server: true,
    // Transform the data immediately to ensure consistent SSR/client data
    transform: (rawData) => {
      const validationResult = ActivitiesResponseSchema.safeParse(rawData);

      if (!validationResult.success) {
        console.error(
          "Activities data validation failed:",
          validationResult.error.format(),
        );
        return [] as Activity[];
      }

      return validationResult.data.activities;
    },
    // Provide default value to prevent hydration mismatch
    default: () => [] as Activity[],
  });

  return {
    activities: data,
    error,
  };
};
