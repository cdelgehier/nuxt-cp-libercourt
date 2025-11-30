// Composable to fetch and validate activities data
// Uses Zod schema for data validation and type safety
import { ActivitiesResponseSchema, type Activity } from "~/schemas";

export const useActivities = async () => {
  // Fetch activities from API endpoint
  const { data, error } = await useFetch("/api/activities");

  if (error.value) {
    console.error("Failed to fetch activities:", error.value);
    return {
      activities: [] as Activity[],
      error: error.value,
    };
  }

  if (!data.value) {
    console.error("No activities data received");
    return {
      activities: [] as Activity[],
      error: new Error("No data received"),
    };
  }

  // Validate response with Zod schema
  const validationResult = ActivitiesResponseSchema.safeParse(data.value);

  if (!validationResult.success) {
    console.error(
      "Activities data validation failed:",
      validationResult.error.format(),
    );
    return {
      activities: [] as Activity[],
      error: validationResult.error,
    };
  }

  return {
    activities: validationResult.data.activities,
    error: null,
  };
};
