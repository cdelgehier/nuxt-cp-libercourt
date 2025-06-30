<template>
  <div>
    <!-- Intermediate Hero Section -->
    <section
      class="bg-gradient-to-r from-club-navy to-club-green py-12 lg:py-16"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center text-white">
          <h1 class="text-3xl font-bold text-white sm:text-4xl mb-4">
            Nous
            <span class="text-club-yellow">Contacter</span>
          </h1>
          <p class="text-xl text-gray-200 max-w-3xl mx-auto">
            Une question ? Envie de nous rejoindre ? Nous sommes là pour vous
            accompagner !
          </p>
        </div>
      </div>
    </section>

    <!-- Informations de contact principales -->
    <section class="py-16 page-section">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <!-- Contact principal -->
          <div class="text-center">
            <div
              class="w-20 h-20 bg-club-navy rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <UIcon
                name="i-heroicons-building-office"
                class="text-3xl text-club-yellow"
              />
            </div>
            <h3 class="text-xl font-bold adaptive-title mb-4">
              {{ data.club.name }}
            </h3>
            <div class="space-y-2 adaptive-text">
              <div class="flex items-center justify-center">
                <UIcon
                  name="i-heroicons-envelope"
                  class="mr-2 text-club-green"
                />
                <a
                  :href="`mailto:${data.club.email}`"
                  class="hover:text-club-green transition-colors"
                >
                  {{ data.club.email }}
                </a>
              </div>
              <div class="flex items-center justify-center">
                <UIcon name="i-heroicons-phone" class="mr-2 text-club-green" />
                <a
                  :href="`tel:${data.club.phone}`"
                  class="hover:text-club-green transition-colors"
                >
                  {{ data.club.phone }}
                </a>
              </div>
              <div class="flex items-center justify-center">
                <UIcon
                  name="i-heroicons-globe-alt"
                  class="mr-2 text-club-green"
                />
                <span>{{ data.club.website }}</span>
              </div>
            </div>
          </div>

          <!-- Adresse -->
          <div class="text-center">
            <div
              class="w-20 h-20 bg-club-green rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <UIcon name="i-heroicons-map-pin" class="text-3xl text-white" />
            </div>
            <h3 class="text-xl font-bold adaptive-title mb-4">Notre Salle</h3>
            <div class="space-y-1 adaptive-text">
              <div class="font-medium">
                {{ data.address.name }}
              </div>
              <div>{{ data.address.street }}</div>
              <div>{{ data.address.postalCode }} {{ data.address.city }}</div>
            </div>
            <UButton
              variant="outline"
              color="primary"
              size="sm"
              class="mt-4"
              @click="scrollToSection('map')"
            >
              <UIcon name="i-heroicons-map" class="mr-2" />
              Voir sur la carte
            </UButton>
          </div>

          <!-- Social media -->
          <div class="text-center">
            <div
              class="w-20 h-20 bg-club-yellow rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <UIcon name="i-heroicons-share" class="text-3xl text-club-navy" />
            </div>
            <h3 class="text-xl font-bold adaptive-title mb-4">Suivez-nous</h3>
            <div class="space-y-3">
              <a
                v-for="social in data.socialMedia"
                :key="social.platform"
                :href="social.url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-center adaptive-text hover:text-club-green transition-colors"
              >
                <UIcon :name="social.icon" class="mr-2" />
                <span>{{ social.name }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Management team and contacts -->
    <section id="contacts" class="py-16 page-section">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold adaptive-title mb-4">Nos Contacts</h2>
          <p class="text-lg adaptive-text max-w-3xl mx-auto">
            Une équipe dévouée à votre service pour répondre à toutes vos
            questions
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div
            v-for="contact in data.contacts"
            :key="contact.name"
            class="adaptive-card rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <div class="flex items-start space-x-4">
              <div
                class="w-16 h-16 bg-club-navy rounded-full flex items-center justify-center flex-shrink-0"
              >
                <UIcon
                  name="i-heroicons-user"
                  class="text-2xl text-club-yellow"
                />
              </div>
              <div class="flex-grow">
                <h3 class="text-xl font-bold adaptive-title mb-1">
                  {{ contact.name }}
                </h3>
                <div class="text-club-green font-medium mb-4">
                  {{ contact.role }}
                </div>

                <div>
                  <h4 class="font-semibold adaptive-subtitle text-sm mb-2">
                    Responsabilités :
                  </h4>
                  <ul class="text-sm adaptive-text space-y-1">
                    <li
                      v-for="responsibility in contact.responsibilities"
                      :key="responsibility"
                      class="flex items-center"
                    >
                      <UIcon
                        name="i-heroicons-check-circle"
                        class="text-club-green mr-2 text-xs"
                      />
                      <span>{{ responsibility }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Permanences -->
    <section class="py-16 page-section">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold adaptive-title mb-4">Permanences</h2>
          <p class="text-lg adaptive-text max-w-3xl mx-auto">
            Venez nous rencontrer directement à la salle durant nos permanences
          </p>
        </div>

        <div class="adaptive-card rounded-xl p-8">
          <h3 class="text-xl font-bold adaptive-title mb-6 text-center">
            {{ data.schedule.availability.title }}
          </h3>

          <div class="mb-6 text-center">
            <p class="adaptive-text">
              {{ data.schedule.availability.note }}
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              v-for="session in data.schedule.availability.sessions"
              :key="`${session.day}-${session.time}`"
              class="adaptive-card rounded-lg p-6 text-center adaptive-border border"
            >
              <div
                class="w-12 h-12 bg-club-yellow rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <UIcon
                  name="i-heroicons-calendar-days"
                  class="text-club-navy text-xl"
                />
              </div>
              <h4 class="font-bold adaptive-title mb-2">
                {{ session.day }}
              </h4>
              <div class="text-lg font-semibold text-club-green mb-2">
                {{ session.time }}
              </div>
              <div class="text-sm adaptive-text mb-1">
                {{ session.location }}
              </div>
              <div class="text-sm adaptive-text opacity-75">
                {{ session.contact }}
              </div>
            </div>
          </div>

          <div
            class="mt-8 p-4 bg-club-navy/10 dark:bg-club-navy/20 rounded-lg text-center"
          >
            <p class="text-club-navy dark:text-club-yellow">
              <UIcon name="i-heroicons-information-circle" class="mr-2" />
              {{ data.schedule.training.note }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Formulaire de contact -->
    <section id="contact-form" class="py-16 page-section">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold adaptive-title mb-4">Écrivez-nous</h2>
          <p class="text-lg adaptive-text">
            Vous avez une question ? N'hésitez pas à nous écrire, nous vous
            répondrons rapidement.
          </p>
        </div>

        <div class="adaptive-card rounded-xl shadow-lg p-8">
          <form
            name="contact"
            method="POST"
            data-netlify="true"
            data-netlify-honeypot="bot-field"
            action="/merci"
            class="space-y-6"
            @submit.prevent="submitForm"
          >
            <!-- Hidden input for Netlify -->
            <input type="hidden" name="form-name" value="contact" />

            <!-- Honeypot field to prevent spam (hidden) -->
            <div style="display: none">
              <label
                >Don't fill this out if you're human: <input name="bot-field"
              /></label>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  for="firstName"
                  class="block text-sm font-semibold adaptive-title mb-3"
                >
                  Prénom *
                </label>
                <UInput
                  id="firstName"
                  v-model="form.firstName"
                  name="firstName"
                  placeholder="Votre prénom"
                  required
                  size="lg"
                  color="white"
                  class="adaptive-input border-gray-300 focus:border-club-green focus:ring-club-green"
                />
              </div>
              <div>
                <label
                  for="lastName"
                  class="block text-sm font-semibold adaptive-title mb-3"
                >
                  Nom *
                </label>
                <UInput
                  id="lastName"
                  v-model="form.lastName"
                  name="lastName"
                  placeholder="Votre nom"
                  required
                  size="lg"
                  color="white"
                  class="adaptive-input border-gray-300 focus:border-club-green focus:ring-club-green"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  for="email"
                  class="block text-sm font-semibold adaptive-title mb-3"
                >
                  Email *
                </label>
                <UInput
                  id="email"
                  v-model="form.email"
                  name="email"
                  type="email"
                  placeholder="votre.email@exemple.fr"
                  required
                  size="lg"
                  color="white"
                  class="adaptive-input border-gray-300 focus:border-club-green focus:ring-club-green"
                />
              </div>
              <div>
                <label
                  for="phone"
                  class="block text-sm font-semibold adaptive-title mb-3"
                >
                  Téléphone
                </label>
                <UInput
                  id="phone"
                  v-model="form.phone"
                  name="phone"
                  type="tel"
                  placeholder="06 XX XX XX XX"
                  size="lg"
                  color="white"
                  class="adaptive-input border-gray-300 focus:border-club-green focus:ring-club-green"
                />
              </div>
            </div>

            <div>
              <label
                for="subject"
                class="block text-sm font-semibold adaptive-title mb-3"
              >
                Sujet *
              </label>
              <USelect
                id="subject"
                v-model="form.subject"
                name="subject"
                :options="subjectOptions"
                placeholder="Choisissez un sujet"
                required
                size="lg"
                color="white"
                class="adaptive-input border-gray-300 focus:border-club-green focus:ring-club-green"
              />
            </div>

            <div>
              <label
                for="message"
                class="block text-sm font-semibold adaptive-title mb-3"
              >
                Message *
              </label>
              <UTextarea
                id="message"
                v-model="form.message"
                name="message"
                placeholder="Votre message..."
                :rows="6"
                required
                size="lg"
                color="white"
                class="adaptive-input border-gray-300 focus:border-club-green focus:ring-club-green"
              />
            </div>

            <div class="text-center pt-4">
              <UButton
                type="submit"
                size="xl"
                :loading="isSubmitting"
                class="font-semibold bg-club-green hover:bg-teal-600 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200 border-0"
              >
                <UIcon name="i-heroicons-paper-airplane" class="mr-3 text-xl" />
                Envoyer le message
              </UButton>
            </div>
          </form>
        </div>
      </div>
    </section>

    <!-- Map and access -->
    <section id="map" class="py-16 page-section">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold adaptive-title mb-4">Plan d'accès</h2>
          <p class="text-lg adaptive-text">
            Trouvez facilement notre salle de sport à Libercourt
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Access information -->
          <div class="lg:col-span-1">
            <div class="adaptive-card rounded-xl p-8">
              <h3 class="text-xl font-bold adaptive-title mb-6">
                Informations d'accès
              </h3>

              <div class="space-y-4">
                <div>
                  <h4
                    class="font-semibold adaptive-subtitle mb-2 flex items-center"
                  >
                    <UIcon
                      name="i-heroicons-map-pin"
                      class="mr-2 text-club-green"
                    />
                    Adresse
                  </h4>
                  <div class="adaptive-text pl-6">
                    <div>{{ data.address.name }}</div>
                    <div>{{ data.address.street }}</div>
                    <div>
                      {{ data.address.postalCode }} {{ data.address.city }}
                    </div>
                  </div>
                </div>

                <div>
                  <h4
                    class="font-semibold adaptive-subtitle mb-2 flex items-center"
                  >
                    <UIcon
                      name="i-heroicons-truck"
                      class="mr-2 text-club-green"
                    />
                    Parking
                  </h4>
                  <p class="adaptive-text pl-6">
                    Parking gratuit disponible devant la salle
                  </p>
                </div>

                <div>
                  <h4
                    class="font-semibold adaptive-subtitle mb-2 flex items-center"
                  >
                    <UIcon
                      name="i-heroicons-user-group"
                      class="mr-2 text-club-green"
                    />
                    Accessibilité
                  </h4>
                  <p class="adaptive-text pl-6">
                    Salle accessible aux personnes à mobilité réduite
                  </p>
                </div>
              </div>

              <div class="mt-6 pt-6 border-t adaptive-border">
                <UButton
                  color="primary"
                  block
                  class="font-semibold"
                  @click="openGoogleMaps"
                >
                  <UIcon name="i-heroicons-globe-alt" class="mr-2" />
                  Ouvrir dans Google Maps
                </UButton>
              </div>
            </div>
          </div>

          <!-- Embedded map -->
          <div class="lg:col-span-2">
            <div class="adaptive-card rounded-xl overflow-hidden h-96">
              <iframe
                :src="`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2522.8234567890123!2d${data.address.coordinates.lng}!3d${data.address.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTDCsDI4JzU0LjciTiAzwrAwMScwMS42IkU!5e0!3m2!1sfr!2sfr!4v1640000000000!5m2!1sfr!2sfr`"
                width="100%"
                height="100%"
                style="border: 0"
                allowfullscreen
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                class="rounded-xl"
                :title="`Localisation du ${clubConfig?.club?.name || 'Club Pongiste Libercourtois'}`"
              />
            </div>
            <div class="mt-4 text-center">
              <UButton
                variant="outline"
                color="primary"
                size="sm"
                class="font-semibold"
                @click="openDirections"
              >
                <UIcon
                  name="i-heroicons-arrow-top-right-on-square"
                  class="mr-2"
                />
                Obtenir l'itinéraire
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-16 page-section">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold adaptive-title mb-4">
            Questions Fréquentes
          </h2>
          <p class="text-lg adaptive-text">
            Retrouvez les réponses aux questions les plus courantes
          </p>
        </div>

        <UAccordion :items="faqItems" :ui="{ wrapper: 'space-y-3' }" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Load contact data
const data = await $fetch("/api/club/contact");

// Load club configuration for dynamic content
const { data: clubConfig } = await useFetch("/api/club/config");

// Configuration SEO with dynamic club name
useSeoMeta({
  title: "Contact",
  description: `Contactez le ${clubConfig.value?.club?.name || "Club Pongiste Libercourtois"}. Trouvez toutes nos coordonnées, horaires de permanence et plan d'accès à notre salle de sport.`,
  keywords:
    "contact club tennis de table, Libercourt, horaires permanence, plan accès, formulaire contact",
});

// Form state
const form = ref({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
});

const isSubmitting = ref(false);

// Options pour le sujet
const subjectOptions = [
  { value: "inscription", label: "Inscription / Renseignements" },
  { value: "horaires", label: "Horaires et créneaux" },
  { value: "tarifs", label: "Tarifs et modalités" },
  { value: "competition", label: "Compétitions et tournois" },
  { value: "materiel", label: "Matériel et équipement" },
  { value: "stage", label: "Stages et cours particuliers" },
  { value: "partenariat", label: "Partenariat" },
  { value: "autre", label: "Autre demande" },
];

// Transform FAQ for accordion
const faqItems = computed(() =>
  data.faq.map((item: any) => ({
    label: item.question,
    content: item.answer,
    defaultOpen: false,
  })),
);

// Form submission function for Netlify Forms
async function submitForm(event: Event) {
  isSubmitting.value = true;

  try {
    // Get form element from event
    const formElement = event.target as HTMLFormElement;

    // Create FormData object from form
    const formData = new FormData(formElement);

    // Submit to Netlify
    const response = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData as any).toString(),
    });

    if (response.ok) {
      // Redirect to thank you page
      await navigateTo("/merci");
    } else {
      throw new Error("Network response was not ok");
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi:", error);
    alert(
      "Une erreur s'est produite. Veuillez réessayer ou nous contacter directement.",
    );
  } finally {
    isSubmitting.value = false;
  }
}

// Function to open Google Maps in a new tab
function openGoogleMaps() {
  // Use the URL from data or build one with coordinates
  const url =
    data.address?.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${data.address?.coordinates?.lat || 50.48185408012125},${data.address?.coordinates?.lng || 3.017099247377654}`;

  // Open Google Maps in a new tab
  window.open(url, "_blank");
}

// Function to open Google Maps directions in a new tab
function openDirections() {
  // Build directions URL using address data
  const destination = `${data.address?.name || "Salle Deladerriere"}, ${data.address?.city || "Libercourt"}`;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;

  // Open directions in a new tab
  window.open(url, "_blank");
}

// Fonction de navigation vers une section
function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}
</script>
