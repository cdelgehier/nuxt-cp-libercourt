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
              <p>Lun-Mar: 17h30-20h30</p>
              <p>Mer: 17h30-20h00</p>
              <p>Jeu-Ven: 17h30-20h30</p>
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
</script>
