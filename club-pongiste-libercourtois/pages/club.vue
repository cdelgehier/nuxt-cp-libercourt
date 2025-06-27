<template>
  <div>
    <!-- Hero Section Club -->
    <section
      class="bg-gradient-to-br from-club-navy via-club-green to-club-navy py-16 lg:py-24"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center text-white">
          <h1 class="text-4xl lg:text-6xl font-bold mb-6">
            À propos du
            <span class="text-club-yellow">Club</span>
          </h1>
          <p class="text-xl lg:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
            {{ clubInfo.name }} - Une passion partagée depuis
            {{ clubInfo.foundedYear }}
          </p>
          <div class="flex flex-wrap justify-center gap-8 text-center">
            <div
              class="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[120px]"
            >
              <div class="text-3xl font-bold text-club-yellow">
                {{
                  pending
                    ? "..."
                    : (clubStats?.licencies ?? clubInfo.statistics.members)
                }}
              </div>
              <div class="text-sm text-gray-300">Licenciés</div>
            </div>
            <div
              class="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[120px]"
            >
              <div class="text-3xl font-bold text-club-yellow">
                {{
                  pending
                    ? "..."
                    : (clubStats?.equipes ?? clubInfo.statistics.teams)
                }}
              </div>
              <div class="text-sm text-gray-300">Équipes</div>
            </div>
            <div
              class="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[120px]"
            >
              <div class="text-3xl font-bold text-club-yellow">
                {{
                  pending
                    ? "..."
                    : (clubStats?.annees ??
                      clubInfo.statistics.yearsOfExistence)
                }}
              </div>
              <div class="text-sm text-gray-300">Années</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Histoire du club -->
    <section class="py-16 page-section">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 class="text-3xl font-bold adaptive-title mb-6">
              Notre Histoire
            </h2>
            <div class="prose prose-lg adaptive-text space-y-4">
              <p>{{ clubInfo.description }}</p>
              <p>
                Fondé en {{ clubInfo.foundedYear }}, le Club Pongiste
                Libercourtois a vu naître et grandir plusieurs générations de
                joueurs passionnés. Depuis plus de 50 ans, nous perpétuons les
                valeurs du tennis de table dans un esprit convivial et sportif.
              </p>
              <p>
                Notre club a évolué au fil des décennies, s'adaptant aux
                nouvelles pratiques tout en conservant son âme familiale.
                Aujourd'hui, nous accueillons des joueurs de tous âges et tous
                niveaux, des débutants aux compétiteurs confirmés.
              </p>
            </div>
          </div>

          <div class="relative">
            <img
              src="/images/club-history.png"
              alt="Histoire du Club Pongiste Libercourtois"
              class="rounded-xl shadow-xl w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Mission et Valeurs -->
    <section class="py-16 page-section">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold adaptive-title mb-4">Notre Mission</h2>
          <p class="text-lg adaptive-text max-w-3xl mx-auto">
            {{ clubInfo.mission }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div
            v-for="(value, index) in clubInfo.values"
            :key="index"
            class="adaptive-card rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow"
          >
            <div
              class="w-12 h-12 bg-club-yellow rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <UIcon
                :name="getValueIcon(index)"
                class="adaptive-text-primary text-xl"
              />
            </div>
            <h3 class="font-semibold adaptive-title">
              {{ value }}
            </h3>
          </div>
        </div>
      </div>
    </section>

    <!-- Management team -->
    <section class="py-16 page-section">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold adaptive-title mb-4">
            Équipe Dirigeante
          </h2>
          <p class="text-lg text-gray-600">
            Une équipe dévouée au service du club et de ses membres
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            v-for="member in teamMembers"
            :key="member.id"
            class="adaptive-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div
              class="h-48 bg-gradient-to-br from-club-green to-club-navy relative"
            >
              <div class="absolute inset-0 flex items-center justify-center">
                <div
                  class="w-20 h-20 bg-white rounded-full flex items-center justify-center"
                >
                  <UIcon
                    name="i-heroicons-user"
                    class="text-3xl text-club-navy"
                  />
                </div>
              </div>
            </div>
            <div class="p-6">
              <h3 class="font-bold text-lg adaptive-title mb-1">
                {{ member.firstName }} {{ member.lastName }}
              </h3>
              <p class="text-club-green font-medium mb-3">
                {{ member.fullRole }}
              </p>
              <p v-if="member.bio" class="text-gray-600 text-sm">
                {{ member.bio }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Our achievements -->
    <section class="py-16 adaptive-bg-secondary">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold adaptive-title mb-4">
            Nos Réalisations
          </h2>
          <p class="text-lg adaptive-text">
            Quelques moments forts de notre histoire récente
          </p>
        </div>

        <div class="space-y-8">
          <div
            v-for="achievement in clubInfo.achievements"
            :key="achievement.year"
            class="adaptive-card rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow"
          >
            <div
              class="flex flex-col md:flex-row items-start md:items-center gap-6"
            >
              <div class="flex-shrink-0">
                <div
                  class="w-16 h-16 bg-club-yellow rounded-full flex items-center justify-center"
                >
                  <span class="text-club-navy font-bold text-lg">{{
                    achievement.year
                  }}</span>
                </div>
              </div>
              <div class="flex-grow">
                <h3 class="text-xl font-bold adaptive-title mb-2">
                  {{ achievement.title }}
                </h3>
                <p class="adaptive-text">
                  {{ achievement.description }}
                </p>
              </div>
              <div class="flex-shrink-0">
                <UIcon
                  name="i-heroicons-trophy"
                  class="text-3xl text-club-yellow"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Installations -->
    <section class="py-16 page-section">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 class="text-3xl font-bold adaptive-title mb-6">
              Nos Installations
            </h2>
            <div class="space-y-6">
              <div class="flex items-center space-x-3">
                <UIcon
                  name="i-heroicons-home"
                  class="text-club-green text-xl"
                />
                <span class="text-lg adaptive-text-primary">{{
                  clubInfo.facilities.location
                }}</span>
              </div>
              <div class="flex items-center space-x-3">
                <UIcon
                  name="i-heroicons-map-pin"
                  class="text-club-green text-xl"
                />
                <div class="adaptive-text-primary">
                  <div>{{ clubInfo.facilities.address.street }}</div>
                  <div>
                    {{ clubInfo.facilities.address.postalCode }}
                    {{ clubInfo.facilities.address.city }}
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-3">
                <UIcon
                  name="i-heroicons-rectangle-group"
                  class="text-club-green text-xl"
                />
                <span class="text-lg adaptive-text-primary"
                  >{{ clubInfo.facilities.tables }} tables de compétition</span
                >
              </div>
            </div>

            <div class="mt-8">
              <h3 class="text-xl font-semibold adaptive-title mb-4">
                Équipements disponibles
              </h3>
              <ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <li
                  v-for="equipment in clubInfo.facilities.equipment"
                  :key="equipment"
                  class="flex items-center space-x-2 adaptive-text-primary"
                >
                  <UIcon
                    name="i-heroicons-check-circle"
                    class="text-club-green flex-shrink-0"
                  />
                  <span class="adaptive-text-primary">{{ equipment }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="relative">
            <!-- Custom image carousel -->
            <div class="relative rounded-xl shadow-xl overflow-hidden">
              <div class="relative w-full h-96">
                <!-- Images -->
                <div
                  v-for="(image, index) in facilityImages"
                  :key="index"
                  class="absolute inset-0 transition-opacity duration-500 ease-in-out"
                  :class="{
                    'opacity-100': currentImageIndex === index,
                    'opacity-0': currentImageIndex !== index,
                  }"
                >
                  <img
                    :src="image.src"
                    :alt="image.alt"
                    class="w-full h-96 object-cover"
                  />
                </div>

                <!-- Boutons de navigation -->
                <button
                  class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors z-10"
                  :disabled="facilityImages.length <= 1"
                  @click="previousImage"
                >
                  <UIcon
                    name="i-heroicons-chevron-left-20-solid"
                    class="w-5 h-5 text-club-navy"
                  />
                </button>

                <button
                  class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors z-10"
                  :disabled="facilityImages.length <= 1"
                  @click="nextImage"
                >
                  <UIcon
                    name="i-heroicons-chevron-right-20-solid"
                    class="w-5 h-5 text-club-navy"
                  />
                </button>

                <!-- Indicateurs -->
                <div
                  class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10"
                >
                  <button
                    v-for="(image, index) in facilityImages"
                    :key="index"
                    class="w-2 h-2 rounded-full transition-colors"
                    :class="{
                      'bg-white': currentImageIndex === index,
                      'bg-white/50': currentImageIndex !== index,
                    }"
                    @click="goToImage(index)"
                  />
                </div>
              </div>

              <!-- Badge number of tables (positioned above carousel) -->
              <div
                class="absolute top-4 right-4 bg-club-navy/80 text-white px-3 py-1 rounded-lg text-sm z-10"
              >
                {{ clubInfo.facilities.tables }} tables
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Location and Access -->
    <section class="py-16 page-section">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold adaptive-title mb-4">Lieu et Accès</h2>
          <p class="text-xl adaptive-text max-w-2xl mx-auto">
            Retrouvez-nous facilement dans notre salle moderne au cœur de
            Libercourt
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <!-- Access information -->
          <div class="adaptive-card rounded-xl p-8 shadow-lg">
            <h3
              class="text-2xl font-bold adaptive-title mb-6 flex items-center"
            >
              <UIcon name="i-heroicons-map-pin" class="mr-3 text-club-green" />
              Informations d'accès
            </h3>

            <div class="space-y-6">
              <div>
                <h4 class="adaptive-subtitle mb-2">Adresse</h4>
                <div class="adaptive-text-primary">
                  <div class="font-medium">
                    {{ clubInfo.facilities.location }}
                  </div>
                  <div>{{ clubInfo.facilities.address.street }}</div>
                  <div>
                    {{ clubInfo.facilities.address.postalCode }}
                    {{ clubInfo.facilities.address.city }}
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <div class="flex items-center adaptive-text-primary">
                  <UIcon
                    name="i-heroicons-truck"
                    class="text-club-green mr-3 flex-shrink-0"
                  />
                  <span>Parking gratuit disponible</span>
                </div>
                <div class="flex items-center adaptive-text-primary">
                  <UIcon
                    name="i-heroicons-user-group"
                    class="text-club-green mr-3 flex-shrink-0"
                  />
                  <span>Accès PMR</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Equipment and transport -->
          <div class="adaptive-card rounded-xl p-8 shadow-lg">
            <h3
              class="text-2xl font-bold adaptive-title mb-6 flex items-center"
            >
              <UIcon name="i-heroicons-home" class="mr-3 text-club-green" />
              Équipements & Transport
            </h3>

            <div class="space-y-6">
              <div>
                <h4 class="adaptive-subtitle mb-3">Équipements disponibles</h4>
                <ul class="space-y-2">
                  <li
                    v-for="item in clubInfo.facilities.equipment"
                    :key="item"
                    class="adaptive-text-primary text-sm flex items-center"
                  >
                    <span
                      class="w-2 h-2 bg-club-green rounded-full mr-3 flex-shrink-0"
                    />
                    {{ item }}
                  </li>
                </ul>
              </div>

              <div class="space-y-3">
                <UButton
                  href="https://www.google.com/maps/search/?api=1&query=Complexe+Sportif+Leo+Lagrange+Libercourt"
                  target="_blank"
                  color="primary"
                  size="sm"
                  variant="outline"
                  block
                  class="font-semibold"
                >
                  <UIcon name="i-heroicons-map" class="mr-2" />
                  Voir sur Google Maps
                </UButton>

                <UButton
                  href="https://www.google.com/maps/dir/?api=1&destination=Salle+des+Sports+Libercourt"
                  target="_blank"
                  color="green"
                  size="sm"
                  variant="outline"
                  block
                  class="font-semibold"
                >
                  <UIcon name="i-heroicons-map-pin" class="mr-2" />
                  Calculer l'itinéraire
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section CTA -->
    <section class="py-16 bg-club-navy">
      <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-white mb-4">
          Envie de nous rejoindre ?
        </h2>
        <p class="text-xl text-gray-300 mb-8">
          Venez découvrir notre club et partager notre passion pour le tennis de
          table !
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
            class="font-semibold bg-white text-club-navy hover:bg-gray-100 border-0 dark:bg-gray-100 dark:text-club-navy dark:hover:bg-gray-200"
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
import type { ClubMember } from "~/types";

// Configuration SEO
useSeoMeta({
  title: "À propos du Club",
  description:
    "Découvrez l'histoire, la mission et l'équipe du Club Pongiste Libercourtois. Plus de 50 ans de passion pour le tennis de table à Libercourt.",
  keywords:
    "club tennis de table, histoire, équipe dirigeante, Libercourt, installations",
});

// Interface for club statistics
interface ClubStats {
  licencies: number;
  equipes: number;
  annees: number;
  lastUpdated: string;
}

// Fetch club statistics from API (real-time data)
const { data: clubStats, pending } = await useLazyFetch<ClubStats>(
  "/api/club/stats",
  {
    key: "club-page-stats",
    default: () => ({
      licencies: 78,
      equipes: 9,
      annees: new Date().getFullYear() - 1970,
      lastUpdated: new Date().toISOString(),
    }),
  },
);

// Chargement des informations du club (static data)
const clubInfo = await $fetch("/api/club/about");

// Load team management from unified API
const teamResponse = (await $fetch("/api/club/team")) as any;
const teamMembers = teamResponse.team || [];

// Images du carousel des installations
const facilityImages = [
  {
    src: "/images/salle-deladerriere.jpg",
    alt: "Vue de la salle depuis le fond",
  },
  {
    src: "/images/salle-deladerriere-1.jpg",
    alt: "Vue de la salle depuis l'entree",
  },
  {
    src: "/images/grande-salle.jpg",
    alt: "Vue d'ensemble de la grande salle",
  },
];

// Gestion du carousel d'images
const currentImageIndex = ref(0);

// Fonctions de navigation du carousel
function nextImage() {
  currentImageIndex.value =
    (currentImageIndex.value + 1) % facilityImages.length;
  pauseAutoPlay();
}

function previousImage() {
  currentImageIndex.value =
    currentImageIndex.value === 0
      ? facilityImages.length - 1
      : currentImageIndex.value - 1;
  pauseAutoPlay();
}

function goToImage(index: number) {
  currentImageIndex.value = index;
  pauseAutoPlay();
}

// Auto-play du carousel avec gestion des interactions
let intervalId: NodeJS.Timeout | null = null;

function pauseAutoPlay() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  // Resume auto-play after 10 seconds of inactivity
  setTimeout(() => {
    startAutoPlay();
  }, 10000);
}

function startAutoPlay() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  intervalId = setInterval(() => {
    currentImageIndex.value =
      (currentImageIndex.value + 1) % facilityImages.length;
  }, 5000); // Change d'image toutes les 5 secondes
}

onMounted(() => {
  // Start auto-play after 3 seconds
  setTimeout(() => {
    startAutoPlay();
  }, 3000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

// Utilitaires pour l'affichage
function getRoleDisplayName(role: string): string {
  const roles: Record<string, string> = {
    president: "Président",
    "vice-president": "Vice-Président",
    secretary: "Secrétaire adjoint",
    treasurer: "Trésorier",
    coach: "Entraîneur",
    member: "Membre du bureau",
  };
  return roles[role] || role;
}

function getValueIcon(index: number): string {
  const icons = [
    "i-heroicons-users",
    "i-heroicons-heart",
    "i-heroicons-arrow-trending-up",
    "i-heroicons-face-smile",
    "i-heroicons-academic-cap",
  ];
  return icons[index] || "i-heroicons-star";
}
</script>
