<template>
  <div>
    <!-- Hero Section -->
    <section
      class="bg-gradient-to-r from-club-navy to-club-green py-12 lg:py-16"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center text-white">
          <h1 class="text-3xl font-bold text-white sm:text-4xl mb-4">
            Mentions
            <span class="text-club-yellow">Légales</span>
          </h1>
          <p class="text-xl text-gray-200 max-w-3xl mx-auto">
            Informations légales et conditions d'utilisation du site
          </p>
        </div>
      </div>
    </section>

    <!-- Contenu des mentions légales -->
    <section class="py-16 page-section">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Éditeur du site -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            1. Éditeur du site
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <div>
                <strong>{{
                  clubConfig?.club?.name || "Club Pongiste Libercourtois"
                }}</strong
                ><br />
                Association loi 1901
              </div>
              <div>
                <strong>Siège social :</strong><br />
                {{
                  clubConfig?.club?.complexe || "Complexe Sportif Léo Lagrange"
                }}<br />
                {{ clubConfig?.location?.postalCode || "62820" }}
                {{ clubConfig?.location?.city || "Libercourt" }}
              </div>
              <div>
                <strong>Contact :</strong><br />
                Email :
                <a
                  :href="`mailto:${clubConfig?.club?.email || 'cplibercourt@gmail.com'}`"
                  class="text-club-green hover:underline"
                  >{{ clubConfig?.club?.email || "cplibercourt@gmail.com" }}</a
                ><br />
                Téléphone :
                <a
                  :href="`tel:${clubConfig?.club?.phone || '06 60 05 12 41'}`"
                  class="text-club-green hover:underline"
                  >{{ clubConfig?.club?.phone || "06 60 05 12 41" }}</a
                >
              </div>
              <div>
                <strong>Responsable de la publication :</strong><br />
                Secrétaires du
                {{ clubConfig?.club?.name || "Club Pongiste Libercourtois" }}
              </div>
            </div>
          </div>
        </div>

        <!-- Hébergement -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">2. Hébergement</h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <div>
                <strong>Hébergeur :</strong> Netlify, Inc.<br />
                <strong>Adresse :</strong> 44 Montgomery Street, Suite 300, San
                Francisco, CA 94104, USA<br />
                <strong>Site web :</strong>
                <a
                  href="https://netlify.com"
                  target="_blank"
                  class="text-club-green hover:underline"
                  >netlify.com</a
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Propriété intellectuelle -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            3. Propriété intellectuelle
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <p>
                L'ensemble de ce site relève de la législation française et
                internationale sur le droit d'auteur et la propriété
                intellectuelle. Tous les droits de reproduction sont réservés, y
                compris pour les documents téléchargeables et les
                représentations iconographiques et photographiques.
              </p>
              <p>
                Les marques, logos, noms de domaine, liens et autres signes
                distinctifs présents sur ce site sont protégés par les droits de
                propriété intellectuelle.
              </p>
              <p>
                Toute reproduction, représentation, modification, publication,
                adaptation de tout ou partie des éléments du site, quel que soit
                le moyen ou le procédé utilisé, est interdite, sauf autorisation
                écrite préalable.
              </p>
            </div>
          </div>
        </div>

        <!-- Protection des données -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            4. Protection des données personnelles
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <div>
                <h3 class="text-lg font-semibold mb-3">Collecte des données</h3>
                <p>
                  Le site
                  {{ clubConfig?.club?.name || "Club Pongiste Libercourtois" }}
                  ne collecte des données personnelles que dans le cadre de la
                  prise de contact (formulaire de contact) ou d'inscription aux
                  activités du club.
                </p>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-3">
                  Utilisation des données
                </h3>
                <p>Les données collectées sont utilisées uniquement pour :</p>
                <ul class="list-disc pl-6 mt-2">
                  <li>Répondre à vos demandes d'information</li>
                  <li>Gérer les inscriptions et licences</li>
                  <li>Communiquer sur les activités du club</li>
                  <li>Respecter les obligations légales (FFTT, assurances)</li>
                </ul>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-3">Vos droits</h3>
                <p>
                  Conformément au RGPD, vous disposez d'un droit d'accès, de
                  rectification, de suppression et de portabilité de vos données
                  personnelles. Pour exercer ces droits, contactez-nous à
                  l'adresse :
                  <a
                    :href="`mailto:${clubConfig?.club?.email || 'cplibercourt@gmail.com'}`"
                    class="text-club-green hover:underline"
                    >{{
                      clubConfig?.club?.email || "cplibercourt@gmail.com"
                    }}</a
                  >
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Cookies -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">5. Cookies</h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <p>
                Ce site utilise uniquement des cookies techniques nécessaires au
                bon fonctionnement du site. Aucun cookie de traçage ou
                publicitaire n'est utilisé.
              </p>
              <p>
                Vous pouvez paramétrer votre navigateur pour refuser les
                cookies, mais cela peut affecter le fonctionnement du site.
              </p>
            </div>
          </div>
        </div>

        <!-- Responsabilité -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            6. Limitation de responsabilité
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <p>
                Les informations contenues sur ce site sont aussi précises que
                possible et le site est périodiquement remis à jour, mais peut
                toutefois contenir des inexactitudes, des omissions ou des
                lacunes.
              </p>
              <p>
                L'utilisation des informations et contenus disponibles sur
                l'ensemble du site ne pourra en aucun cas engager la
                responsabilité du
                {{ clubConfig?.club?.name || "Club Pongiste Libercourtois" }}.
              </p>
              <p>
                Le
                {{ clubConfig?.club?.name || "Club Pongiste Libercourtois" }} ne
                pourra être tenu responsable des dommages directs et indirects
                causés au matériel de l'utilisateur lors de l'accès au site.
              </p>
            </div>
          </div>
        </div>

        <!-- Liens externes -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            7. Liens externes
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <p>
                Ce site peut contenir des liens vers d'autres sites web. Le
                {{ clubConfig?.club?.name || "Club Pongiste Libercourtois" }}
                n'exerce aucun contrôle sur ces sites et n'assume aucune
                responsabilité quant à leur contenu.
              </p>
              <p>
                Les liens vers des sites externes sont fournis uniquement pour
                la commodité des utilisateurs.
              </p>
            </div>
          </div>
        </div>

        <!-- Droit applicable -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            8. Droit applicable
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <p>
                Les présentes mentions légales sont régies par le droit
                français. En cas de litige, les tribunaux français seront seuls
                compétents.
              </p>
            </div>
          </div>
        </div>

        <!-- Contact -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">9. Contact</h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <p>
                Pour toute question concernant ces mentions légales ou le
                traitement de vos données personnelles, vous pouvez nous
                contacter :
              </p>
              <div class="flex flex-col sm:flex-row gap-4 mt-4">
                <a
                  :href="`mailto:${clubConfig?.club?.email || 'cplibercourt@gmail.com'}`"
                  class="inline-flex items-center px-4 py-2 bg-club-green text-white rounded-lg hover:bg-club-green/90 transition-colors"
                >
                  <UIcon name="i-heroicons-envelope" class="mr-2" />
                  Nous contacter par email
                </a>
                <a
                  :href="`tel:${clubConfig?.club?.phone || '06 60 05 12 41'}`"
                  class="inline-flex items-center px-4 py-2 bg-club-navy text-white rounded-lg hover:bg-club-navy/90 transition-colors"
                >
                  <UIcon name="i-heroicons-phone" class="mr-2" />
                  Nous appeler
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Date de mise à jour -->
        <div class="text-center adaptive-text text-sm opacity-75">
          <p>
            Dernière mise à jour : {{ new Date().toLocaleDateString("fr-FR") }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// Meta tags for SEO optimization
useSeoMeta({
  title: "Mentions Légales - Club Pongiste Libercourtois",
  description:
    "Mentions légales, conditions d'utilisation et politique de confidentialité du site du Club Pongiste Libercourtois.",
  keywords:
    "mentions légales, RGPD, données personnelles, club tennis de table, Libercourt",
});

// Fetch club configuration from API with error handling
const { data: clubConfig } = await useFetch("/api/club/config", {
  default: () => ({
    club: {
      name: "Club Pongiste Libercourtois",
      id: "07620112",
      salle: "Salle Deladerriere",
      complexe: "Complexe Sportif Léo Lagrange",
      email: "cplibercourt@gmail.com",
      phone: "06 60 05 12 41",
      website: "cplibercourt.netlify.app",
      description:
        "Club de tennis de table à Libercourt - Passion, convivialité et performance depuis 1970",
    },
    social: {
      facebook: {
        name: "Facebook",
        url: "https://www.facebook.com/profile.php?id=100066855954701",
        icon: "i-simple-icons-facebook",
        platform: "facebook",
      },
    },
    location: {
      name: "Salle Deladerriere - Complexe Sportif Léo Lagrange",
      salle: "Salle Deladerriere",
      complexe: "Complexe Sportif Léo Lagrange",
      street: "Complexe Sportif Léo Lagrange",
      postalCode: "62820",
      city: "Libercourt",
      country: "France",
      coordinates: {
        lat: 50.48185408012125,
        lng: 3.017099247377654,
      },
      googleMapsUrl:
        "https://www.google.com/maps/place/Salle+Deladerriere,+Complexe+Sportif+Leo+Lagrange/@50.48185408012125,3.017099247377654,17z",
    },
  }),
});
</script>
