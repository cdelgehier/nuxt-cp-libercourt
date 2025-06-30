// Composable to access club configuration data
// This provides a centralized way to get club information across the app

export interface ClubConfig {
  club: {
    name: string;
    id: string;
    salle: string;
    complexe: string;
    email: string;
    phone: string;
    website: string;
    description: string;
  };
  social: {
    facebook: {
      name: string;
      url: string;
      icon: string;
      platform: string;
    };
  };
  location: {
    name: string;
    salle: string;
    complexe: string;
    street: string;
    postalCode: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}

export const useClubConfig = () => {
  // Load club configuration data from API
  const {
    data: clubConfig,
    pending,
    error,
  } = useLazyFetch<ClubConfig>("/api/club/config");

  // Computed values for easy access to common club info
  const clubName = computed(
    () => clubConfig.value?.club?.name || "Club Pongiste Libercourtois",
  );
  const clubDescription = computed(
    () => clubConfig.value?.club?.description || "Club de tennis de table",
  );
  const clubEmail = computed(
    () => clubConfig.value?.club?.email || "contact@club.fr",
  );
  const clubPhone = computed(() => clubConfig.value?.club?.phone || "");
  const clubLocation = computed(
    () => clubConfig.value?.location?.name || "Salle de sport",
  );

  return {
    clubConfig,
    pending,
    error,
    // Easy access to commonly used values
    clubName,
    clubDescription,
    clubEmail,
    clubPhone,
    clubLocation,
  };
};
