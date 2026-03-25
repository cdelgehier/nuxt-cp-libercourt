// Composable to access club configuration data
// This provides a centralized way to get club information across the app

import type { ClubConfig } from "~~/server/domains/club/types";

export type { ClubConfig };

export const useClubConfig = () => {
  const {
    data: clubConfig,
    pending,
    error,
  } = useLazyFetch<ClubConfig>("/api/club/config", {
    deep: true,
  });

  const clubName = computed(
    () => clubConfig.value?.name || "Club Pongiste Libercourtois",
  );
  const clubDescription = computed(
    () => clubConfig.value?.description || "Club de tennis de table",
  );
  const clubEmail = computed(
    () => clubConfig.value?.email || "contact@club.fr",
  );
  const clubPhone = computed(() => clubConfig.value?.phone || "");
  const clubLocation = computed(
    () => clubConfig.value?.salle || "Salle de sport",
  );

  return {
    clubConfig,
    pending,
    error,
    clubName,
    clubDescription,
    clubEmail,
    clubPhone,
    clubLocation,
  };
};
