// Composable to fetch and validate sponsors data
// Uses Zod schema for data validation and type safety
import { SponsorsResponseSchema, type Partner } from "~/schemas";

export const useSponsors = () => {
  // Fetch sponsors from API endpoint with server: true to ensure SSR consistency
  const { data, error } = useFetch("/api/sponsors", {
    key: "sponsors",
    // Ensure data is fetched on server-side to prevent hydration mismatch
    server: true,
    // Transform the data immediately to ensure consistent SSR/client data
    transform: (rawData) => {
      const validationResult = SponsorsResponseSchema.safeParse(rawData);

      if (!validationResult.success) {
        console.error(
          "Sponsors data validation failed:",
          validationResult.error.format(),
        );
        return [] as Partner[];
      }

      return validationResult.data.sponsors;
    },
    // Provide default value to prevent hydration mismatch
    default: () => [] as Partner[],
  });

  return {
    sponsors: data,
    error,
  };
};
