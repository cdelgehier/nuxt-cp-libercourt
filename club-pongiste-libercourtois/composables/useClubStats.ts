import type { ClubStats } from "~/types";

// Composable for fetching club statistics with real-time data from PingPocket
export default function () {
  // Fetch club stats with caching
  const {
    data: clubStats,
    pending,
    error,
    refresh,
  } = useLazyFetch<ClubStats>("/api/club/stats", {
    // Cache for 1 hour on client side
    key: "club-stats",
    default: () => ({
      licencies: 78,
      equipes: 9,
      annees: new Date().getFullYear() - 1970,
      lastUpdated: new Date().toISOString(),
    }),
  });

  return {
    clubStats: readonly(clubStats),
    pending: readonly(pending),
    error: readonly(error),
    refresh,
  };
}
