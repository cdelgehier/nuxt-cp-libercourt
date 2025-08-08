<template>
  <footer class="footer-club">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Informations du club -->
        <div class="space-y-4">
          <div class="flex items-center justify-center">
            <img
              src="/images/logo-club-white.png"
              alt="Logo Club Pongiste Libercourtois"
              class="h-24 w-auto"
            />
          </div>
          <p class="text-gray-300 text-sm leading-relaxed text-center">
            Club de tennis de table convivial et compétitif, ouvert à tous les
            âges et tous les niveaux.
          </p>
        </div>

        <!-- Navigation rapide -->
        <div>
          <h4 class="text-white font-semibold mb-4">Navigation</h4>
          <ul class="space-y-2">
            <li v-for="item in footerNavigation" :key="item.href">
              <NuxtLink
                :to="item.href"
                class="text-gray-300 hover:text-club-yellow transition-colors text-sm"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="text-white font-semibold mb-4">Contact</h4>
          <div class="space-y-3">
            <div class="flex items-start space-x-3">
              <UIcon
                name="i-heroicons-map-pin"
                class="text-club-yellow mt-0.5"
              />
              <div class="text-gray-300 text-sm">
                <p>{{ config?.location?.salle || "Salle Deladerriere" }}</p>
                <p>
                  {{
                    config?.location?.complexe ||
                    "Complexe Sportif Léo Lagrange"
                  }}
                </p>
                <p>
                  {{ config?.location?.postalCode || "62820" }}
                  {{ config?.location?.city || "Libercourt" }}
                </p>
              </div>
            </div>

            <div class="flex items-center space-x-3">
              <UIcon name="i-heroicons-phone" class="text-club-yellow" />
              <a
                v-if="config?.club?.phone"
                :href="`tel:+33${config.club.phone.replace(/\s/g, '').slice(1)}`"
                class="text-gray-300 hover:text-club-yellow transition-colors text-sm"
              >
                {{ config.club.phone }}
              </a>
            </div>

            <div class="flex items-center space-x-3">
              <UIcon name="i-heroicons-envelope" class="text-club-yellow" />
              <a
                v-if="config?.club?.email"
                :href="`mailto:${config.club.email}`"
                class="text-gray-300 hover:text-club-yellow transition-colors text-sm"
              >
                {{ config.club.email }}
              </a>
            </div>
          </div>
        </div>

        <!-- Social media and schedules -->
        <div>
          <h4 class="text-white font-semibold mb-4">Suivez-nous</h4>
          <div class="flex space-x-4 mb-6">
            <a
              v-if="config?.social?.facebook"
              :href="config.social.facebook.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray-300 hover:text-club-yellow transition-colors"
              aria-label="Facebook"
            >
              <UIcon name="i-simple-icons-facebook" size="20" />
            </a>
          </div>

          <div>
            <h5 class="text-white font-medium mb-2 text-sm">Horaires salle</h5>
            <div class="text-gray-300 text-sm space-y-1">
              <p v-for="schedule in computedOpenHours" :key="schedule.day">
                {{ formatDayName(schedule.day) }}: {{ schedule.hours }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Separator -->
      <div class="border-t border-gray-600 mt-8 pt-8">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="text-gray-300 text-sm">
            <p>
              &copy; {{ currentYear }} Club Pongiste Libercourtois. Tous droits
              réservés.
            </p>
          </div>

          <div class="flex items-center space-x-6 mt-4 md:mt-0">
            <NuxtLink
              to="/mentions-legales"
              class="text-gray-300 hover:text-club-yellow transition-colors text-sm"
            >
              Mentions légales
            </NuxtLink>
            <NuxtLink
              to="/politique-confidentialite"
              class="text-gray-300 hover:text-club-yellow transition-colors text-sm"
            >
              Politique de confidentialité
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import type { NavigationItem } from "~/types";

// Load centralized configuration
const { data: config } = await useFetch("/api/club/config");

// Load schedules data for dynamic opening hours
const { data: schedulesData } = await useFetch("/api/club/schedules-pricing");

// Current year for copyright
const currentYear = new Date().getFullYear();

// Footer navigation links
const footerNavigation: NavigationItem[] = [
  { label: "Accueil", href: "/" },
  { label: "À propos", href: "/club" },
  { label: "Calendrier", href: "/calendrier" },
  { label: "Horaires & Tarifs", href: "/horaires-tarifs" },
  { label: "Contact", href: "/contact" },
];

// Format day names for display
const formatDayName = (day: string): string => {
  const dayMap: Record<string, string> = {
    Lundi: "Lun",
    Mardi: "Mar",
    Mercredi: "Mer",
    Jeudi: "Jeu",
    Vendredi: "Ven",
    Samedi: "Sam",
    Dimanche: "Dim"
  };
  return dayMap[day] || day;
};

// Parse time string to minutes for comparison
const parseTimeToMinutes = (timeStr: string): number => {
  const match = timeStr.match(/(\d{1,2})h(\d{2})/);
  if (match) {
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }
  return 0;
};

// Format minutes back to time string
const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins.toString().padStart(2, '0')}`;
};

// Compute opening hours from training schedules
const computedOpenHours = computed(() => {
  if (!schedulesData.value?.schedules?.training) return [];

  return schedulesData.value.schedules.training
    .filter(day => day.sessions && day.sessions.length > 0)
    .map(day => {
      const times: number[] = [];

      // Extract all start and end times from sessions
      day.sessions.forEach(session => {
        if (session.time && session.time.includes(' - ')) {
          const [start, end] = session.time.split(' - ');
          times.push(parseTimeToMinutes(start.trim()));
          times.push(parseTimeToMinutes(end.trim()));
        } else if (session.time && session.time.includes('h')) {
          // Single time (like "18h00")
          times.push(parseTimeToMinutes(session.time.trim()));
        }
      });

      if (times.length === 0) return null;

      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      return {
        day: day.day,
        hours: `${formatMinutesToTime(minTime)} - ${formatMinutesToTime(maxTime)}`
      };
    })
    .filter((schedule): schedule is NonNullable<typeof schedule> =>
      schedule !== null && !['Samedi', 'Dimanche'].includes(schedule.day)
    ); // Remove null entries and exclude weekend competitions
});
</script>
