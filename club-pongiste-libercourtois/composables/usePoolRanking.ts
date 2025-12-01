import type { PoolRankingEntry } from "~/server/utils/smartping";

export type { PoolRankingEntry };

export interface PoolRankingResponse {
  success: boolean;
  data?: PoolRankingEntry[];
  poolName?: string;
  error?: string;
}

export interface TeamData {
  idequipe: string;
  libequipe: string;
  libdivision: string;
  liendivision: string;
  idepr: string;
  libepr: string;
}

/**
 * Composable to fetch and manage pool ranking data
 */
export function usePoolRanking() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const data = ref<PoolRankingEntry[]>([]);
  const poolName = ref<string>("");

  /**
   * Fetch pool ranking for a specific team
   */
  const fetchPoolRanking = async (team: TeamData, clubNumber: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<PoolRankingResponse>("/api/pool-ranking", {
        method: "POST",
        body: {
          team,
          clubNumber,
        },
      });

      if (response.success && response.data) {
        data.value = response.data;
        poolName.value = response.poolName || "";
        return true;
      } else {
        error.value = response.error || "Failed to fetch pool ranking";
        return false;
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error fetching pool ranking:", err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get zone icon based on zone type
   */
  const getZoneIcon = (zone?: string): string => {
    switch (zone) {
      case "promotion":
        return "i-heroicons-arrow-up-circle";
      case "barrage":
        return "i-heroicons-arrows-up-down";
      case "relegation":
        return "i-heroicons-arrow-down-circle";
      default:
        return "";
    }
  };

  /**
   * Get zone color based on zone type
   */
  const getZoneColor = (zone?: string): string => {
    switch (zone) {
      case "promotion":
        return "text-green-500";
      case "barrage":
        return "text-orange-500";
      case "relegation":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  /**
   * Get zone label for accessibility
   */
  const getZoneLabel = (zone?: string): string => {
    switch (zone) {
      case "promotion":
        return "Montée";
      case "barrage":
        return "Barrage";
      case "relegation":
        return "Relégation";
      default:
        return "";
    }
  };

  return {
    loading: readonly(loading),
    error: readonly(error),
    data: readonly(data),
    poolName: readonly(poolName),
    fetchPoolRanking,
    getZoneIcon,
    getZoneColor,
    getZoneLabel,
  };
}
