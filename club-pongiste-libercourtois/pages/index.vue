<template>
  <div>
    <!-- Intermediate Hero Section -->
    <section
      class="bg-gradient-to-r from-club-navy to-club-green py-12 lg:py-16"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center text-white">
          <h1 class="text-4xl lg:text-5xl font-bold text-white mb-4">
            Club Pongiste
            <span class="text-club-yellow">Libercourtois</span>
          </h1>
          <p class="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Rejoignez notre communauté passionnée de tennis de table depuis
            1970. Club convivial ouvert à tous les âges et tous les niveaux.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton
              to="/contact"
              color="primary"
              size="lg"
              class="font-semibold bg-club-yellow text-club-navy hover:bg-yellow-400"
            >
              <UIcon name="i-heroicons-user-plus" class="mr-2" />
              Nous rejoindre
            </UButton>
            <UButton
              to="/club"
              variant="outline"
              color="white"
              size="lg"
              class="font-semibold border-white text-white hover:bg-white hover:text-club-navy"
            >
              <UIcon name="i-heroicons-information-circle" class="mr-2" />
              Découvrir le club
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Activities section -->
    <section class="py-16 page-section">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold adaptive-title mb-4">Nos Activités</h2>
          <p class="text-lg adaptive-text max-w-2xl mx-auto">
            Du loisir à la compétition, découvrez toutes nos activités adaptées
            à chaque âge et niveau.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="activity in activities"
            :key="activity.title"
            class="card-club"
          >
            <div class="text-center space-y-4">
              <div
                class="inline-flex items-center justify-center w-16 h-16 bg-club-yellow/10 rounded-full"
              >
                <UIcon :name="activity.icon" class="text-2xl text-club-green" />
              </div>
              <h3 class="text-xl font-semibold adaptive-title">
                {{ activity.title }}
              </h3>
              <p class="text-gray-600">
                {{ activity.description }}
              </p>
              <div class="pt-2">
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-club-green/10 text-club-green"
                >
                  {{ activity.ageGroup }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- News section -->
    <section class="py-16 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-3xl font-bold adaptive-title mb-2">Actualités</h2>
            <p class="text-lg adaptive-text">
              Les dernières nouvelles du Comité, de la Ligue et du club
            </p>
          </div>
          <UButton to="/actualites" variant="outline" color="primary">
            Toutes les actualités
          </UButton>
        </div>

        <NewsList :limit="3" />
      </div>
    </section>

    <!-- Upcoming events section -->
    <section class="py-16 page-section">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold adaptive-title">
            Prochains Événements
          </h2>
          <UButton to="/calendrier" variant="outline" color="primary">
            Voir tout le calendrier
          </UButton>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="event in upcomingEvents"
            :key="event.id"
            class="card-club"
          >
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="getEventTypeClass(event.type)"
                >
                  {{ getEventTypeLabel(event.type) }}
                </span>
                <time class="text-sm adaptive-text">
                  {{ formatDate(event.date) }}
                </time>
              </div>

              <h3 class="text-lg font-semibold adaptive-title">
                {{ event.title }}
              </h3>
              <p class="adaptive-text text-sm">
                {{ event.description }}
              </p>

              <div class="flex items-center text-sm adaptive-text">
                <UIcon name="i-heroicons-map-pin" class="mr-1" />
                {{ event.location }}
              </div>

              <!-- Registration status -->
              <div class="flex items-center text-xs">
                <UIcon
                  :name="
                    event.registrationOpen
                      ? 'i-heroicons-check-circle'
                      : 'i-heroicons-x-circle'
                  "
                  :class="
                    event.registrationOpen
                      ? 'text-green-500 mr-1'
                      : 'text-red-500 mr-1'
                  "
                />
                <span
                  :class="
                    event.registrationOpen ? 'text-green-600' : 'text-red-600'
                  "
                >
                  {{
                    event.registrationOpen
                      ? "Inscriptions ouvertes"
                      : "Inscriptions fermées"
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section CTA -->
    <section class="py-16 bg-club-navy">
      <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl font-bold text-white mb-4">
          Prêt à nous rejoindre ?
        </h2>
        <p class="text-xl text-gray-300 mb-8">
          Découvrez le plaisir du tennis de table dans une ambiance conviviale
          et sportive.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            to="/contact"
            color="primary"
            size="lg"
            class="font-semibold"
          >
            <UIcon name="i-heroicons-phone" class="mr-2" />
            Nous contacter
          </UButton>
          <UButton
            to="/horaires-tarifs"
            variant="solid"
            color="white"
            size="lg"
            class="font-semibold bg-white text-club-navy hover:bg-gray-100 dark:bg-gray-100 dark:text-club-navy dark:hover:bg-gray-200"
          >
            <UIcon name="i-heroicons-clock" class="mr-2" />
            Voir les horaires
          </UButton>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Configuration SEO
useSeoMeta({
  title: "Accueil",
  description:
    "Club Pongiste Libercourtois - Club de tennis de table convivial à Libercourt depuis 1970. Activités pour tous âges et niveaux.",
  keywords:
    "tennis de table, ping-pong, club sportif, Libercourt, activités jeunes adultes",
});

// Club activities
const activities = [
  {
    title: "École de Tennis de Table",
    description:
      "Pour les tout petits. Coordination main-œil, service, règles, coup droit. Initiation ludique et pédagogique.",
    icon: "i-heroicons-academic-cap",
    ageGroup: "Tout petits",
  },
  {
    title: "Entraînement Jeunes",
    description:
      "Suite logique de l'école de tennis de table jusqu'à Cadet 2. Perfectionnement technique et tactique.",
    icon: "i-heroicons-trophy",
    ageGroup: "Jusqu'à Cadet 2",
  },
  {
    title: "Tennis de Table Loisir",
    description:
      "Pratique conviviale pour tous. Ambiance détendue, plaisir de jouer, tous niveaux confondus.",
    icon: "i-heroicons-heart",
    ageGroup: "Tous âges",
  },
  {
    title: "Compétition",
    description:
      "Équipes engagées en championnat départemental et régional. Pour les joueurs motivés par la performance.",
    icon: "i-heroicons-star",
    ageGroup: "Tous niveaux",
  },
  {
    title: "Ping Santé",
    description:
      "Pour découvrir le sport ou conserver une activité physique. Adapté aux seniors et reprise d'activité.",
    icon: "i-heroicons-heart-solid",
    ageGroup: "Seniors",
  },
];

// Load upcoming events from API
const eventsResponse = await $fetch("/api/events/upcoming?limit=3");
const upcomingEvents = eventsResponse?.events || [];

// Function to format dates from API response
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

// Functions to harmonize event colors
function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    tournament: "Tournoi",
    stage: "Stage",
    competition: "Compétition",
    meeting: "Réunion",
    training: "Entraînement",
    Tournoi: "Tournoi",
    Stage: "Stage",
    Compétition: "Compétition",
  };
  return labels[type] || type;
}

function getEventTypeClass(type: string): string {
  const classes: Record<string, string> = {
    tournament:
      "bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-300",
    stage:
      "bg-secondary-50 text-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-300",
    competition:
      "bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-300",
    meeting:
      "bg-club-navy/10 text-club-navy dark:bg-club-navy/20 dark:text-club-yellow",
    training:
      "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300",
    Tournoi:
      "bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-300",
    Stage:
      "bg-secondary-50 text-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-300",
    Compétition:
      "bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-300",
  };
  return (
    classes[type] ||
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
  );
}
</script>
