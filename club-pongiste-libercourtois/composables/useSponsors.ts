// Composable to fetch and validate sponsors data
// Uses Zod schema for data validation and type safety
import { SponsorsResponseSchema, type Partner } from "~/schemas";

export const useSponsors = async () => {
  // Fetch sponsors from API endpoint with server: true to ensure SSR consistency
  const { data, error } = await useFetch("/api/sponsors", {
    key: "sponsors",
    // Ensure data is fetched on server-side to prevent hydration mismatch
    server: true,
  });

  if (error.value) {
    console.error("Failed to fetch sponsors:", error.value);
    return {
      sponsors: [] as Partner[],
      error: error.value,
    };
  }

  if (!data.value) {
    console.error("No sponsors data received");
    return {
      sponsors: [] as Partner[],
      error: new Error("No data received"),
    };
  }

  // Validate response with Zod schema
  const validationResult = SponsorsResponseSchema.safeParse(data.value);

  if (!validationResult.success) {
    console.error(
      "Sponsors data validation failed:",
      validationResult.error.format(),
    );
    return {
      sponsors: [] as Partner[],
      error: validationResult.error,
    };
  }

  return {
    sponsors: validationResult.data.sponsors,
    error: null,
  };
};
