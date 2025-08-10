<template>
  <div>
    <!-- Hero Section -->
    <section
      class="bg-gradient-to-r from-club-navy to-club-green py-12 lg:py-16"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center text-white">
          <h1 class="text-3xl font-bold text-white sm:text-4xl mb-4">
            Politique de
            <span class="text-club-yellow">Confidentialité</span>
          </h1>
          <p class="text-xl text-gray-200 max-w-3xl mx-auto">
            Protection et traitement de vos données personnelles
          </p>
        </div>
      </div>
    </section>

    <!-- Contenu de la politique de confidentialité -->
    <section class="py-16 page-section">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Introduction -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            1. Introduction
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <p>
                Le
                {{ clubConfig?.club?.name || "Club Pongiste Libercourtois" }}
                s'engage à protéger votre vie privée et vos données
                personnelles. Cette politique de confidentialité explique
                comment nous collectons, utilisons et protégeons vos
                informations lorsque vous utilisez notre site web ou participez
                à nos activités.
              </p>
              <p>
                Cette politique est conforme au Règlement Général sur la
                Protection des Données (RGPD) et à la loi française
                "Informatique et Libertés".
              </p>
            </div>
          </div>
        </div>

        <!-- Responsable du traitement -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            2. Responsable du traitement
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <div>
                <strong>Responsable :</strong>
                {{ clubConfig?.club?.name || "Club Pongiste Libercourtois"
                }}<br />
                <strong>Adresse :</strong>
                {{
                  clubConfig?.club?.complexe || "Complexe Sportif Léo Lagrange"
                }}, {{ clubConfig?.location?.postalCode || "62820" }}
                {{ clubConfig?.location?.city || "Libercourt" }}<br />
                <strong>Email :</strong>
                <a
                  :href="`mailto:${clubConfig?.club?.email || 'cplibercourt@gmail.com'}`"
                  class="text-club-green hover:underline"
                  >{{ clubConfig?.club?.email || "cplibercourt@gmail.com" }}</a
                ><br />
                <strong>Téléphone :</strong>
                <a
                  :href="`tel:${clubConfig?.club?.phone || '06 60 05 12 41'}`"
                  class="text-club-green hover:underline"
                  >{{ clubConfig?.club?.phone || "06 60 05 12 41" }}</a
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Données collectées -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            3. Données personnelles collectées
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-6 adaptive-text">
              <div>
                <h3 class="text-lg font-semibold mb-3">
                  3.1. Données d'identification
                </h3>
                <ul class="list-disc pl-6 space-y-1">
                  <li>Nom et prénom</li>
                  <li>Adresse email</li>
                  <li>Numéro de téléphone</li>
                  <li>Adresse postale</li>
                  <li>Date de naissance</li>
                </ul>
              </div>

              <div>
                <h3 class="text-lg font-semibold mb-3">
                  3.2. Données de navigation
                </h3>
                <ul class="list-disc pl-6 space-y-1">
                  <li>Adresse IP</li>
                  <li>Type de navigateur</li>
                  <li>Pages consultées</li>
                  <li>Durée de visite</li>
                </ul>
              </div>

              <div>
                <h3 class="text-lg font-semibold mb-3">
                  3.3. Données spécifiques au club
                </h3>
                <ul class="list-disc pl-6 space-y-1">
                  <li>Niveau de jeu</li>
                  <li>Catégorie d'âge</li>
                  <li>Historique des participations</li>
                  <li>Certificat médical (si applicable)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Base légale et finalités -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            4. Base légale et finalités du traitement
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-6 adaptive-text">
              <div>
                <h3 class="text-lg font-semibold mb-3">
                  4.1. Gestion des adhésions
                </h3>
                <p><strong>Base légale :</strong> Exécution d'un contrat</p>
                <ul class="list-disc pl-6 mt-2">
                  <li>Inscription et renouvellement d'adhésion</li>
                  <li>Gestion des licences FFTT</li>
                  <li>Suivi des cotisations</li>
                </ul>
              </div>

              <div>
                <h3 class="text-lg font-semibold mb-3">4.2. Communication</h3>
                <p><strong>Base légale :</strong> Intérêt légitime</p>
                <ul class="list-disc pl-6 mt-2">
                  <li>Information sur les activités du club</li>
                  <li>Invitation aux événements</li>
                  <li>Newsletter (avec consentement)</li>
                </ul>
              </div>

              <div>
                <h3 class="text-lg font-semibold mb-3">
                  4.3. Obligations légales
                </h3>
                <p><strong>Base légale :</strong> Obligation légale</p>
                <ul class="list-disc pl-6 mt-2">
                  <li>Déclarations FFTT</li>
                  <li>Assurance responsabilité civile</li>
                  <li>Comptabilité associative</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Destinataires -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            5. Destinataires des données
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <p>
                Vos données personnelles peuvent être transmises aux
                destinataires suivants :
              </p>
              <ul class="list-disc pl-6 space-y-2">
                <li>
                  <strong
                    >Fédération Française de Tennis de Table (FFTT) :</strong
                  >
                  pour la gestion des licences et compétitions
                </li>
                <li>
                  <strong>Compagnie d'assurance :</strong> en cas de sinistre
                  nécessitant une déclaration
                </li>
                <li>
                  <strong>Autorités compétentes :</strong> sur demande légale ou
                  judiciaire
                </li>
                <li>
                  <strong>Prestataires techniques :</strong> pour l'hébergement
                  du site (avec garanties de protection)
                </li>
              </ul>
              <p class="mt-4">
                Aucune donnée n'est vendue ou cédée à des tiers à des fins
                commerciales.
              </p>
            </div>
          </div>
        </div>

        <!-- Durée de conservation -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            6. Durée de conservation
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <ul class="list-disc pl-6 space-y-2">
                <li>
                  <strong>Données d'adhésion :</strong> 3 ans après la fin de
                  l'adhésion
                </li>
                <li>
                  <strong>Données comptables :</strong> 10 ans (obligation
                  légale)
                </li>
                <li>
                  <strong>Données de navigation :</strong> 13 mois maximum
                </li>
                <li>
                  <strong>Newsletters :</strong> jusqu'au désabonnement ou 3 ans
                  d'inactivité
                </li>
                <li>
                  <strong>Formulaires de contact :</strong> 1 an après le
                  dernier échange
                </li>
              </ul>
              <p class="mt-4">
                À l'expiration de ces délais, vos données sont automatiquement
                supprimées ou anonymisées.
              </p>
            </div>
          </div>
        </div>

        <!-- Droits des personnes -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">7. Vos droits</h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-6 adaptive-text">
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>

              <div class="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 class="font-semibold mb-2">✓ Droit d'accès</h3>
                  <p class="text-sm">
                    Connaître les données que nous détenons sur vous
                  </p>
                </div>
                <div>
                  <h3 class="font-semibold mb-2">✓ Droit de rectification</h3>
                  <p class="text-sm">
                    Corriger ou mettre à jour vos informations
                  </p>
                </div>
                <div>
                  <h3 class="font-semibold mb-2">✓ Droit d'effacement</h3>
                  <p class="text-sm">Demander la suppression de vos données</p>
                </div>
                <div>
                  <h3 class="font-semibold mb-2">✓ Droit à la portabilité</h3>
                  <p class="text-sm">
                    Récupérer vos données dans un format standard
                  </p>
                </div>
                <div>
                  <h3 class="font-semibold mb-2">✓ Droit d'opposition</h3>
                  <p class="text-sm">
                    Vous opposer au traitement de vos données
                  </p>
                </div>
                <div>
                  <h3 class="font-semibold mb-2">✓ Droit de limitation</h3>
                  <p class="text-sm">Limiter l'utilisation de vos données</p>
                </div>
              </div>

              <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 class="font-semibold mb-2">Comment exercer vos droits ?</h3>
                <p class="text-sm mb-3">
                  Pour exercer ces droits, contactez-nous en précisant votre
                  demande et en joignant une copie de votre pièce d'identité :
                </p>
                <div class="flex flex-col sm:flex-row gap-3">
                  <a
                    :href="`mailto:${clubConfig?.club?.email || 'cplibercourt@gmail.com'}?subject=Demande RGPD`"
                    class="inline-flex items-center px-4 py-2 bg-club-green text-white rounded-lg hover:bg-club-green/90 transition-colors text-sm"
                  >
                    <UIcon name="i-heroicons-envelope" class="mr-2" />
                    Demande par email
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sécurité -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            8. Sécurité des données
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <p>
                Nous mettons en œuvre des mesures techniques et
                organisationnelles appropriées pour protéger vos données
                personnelles :
              </p>
              <ul class="list-disc pl-6 space-y-1">
                <li>Chiffrement des données en transit (HTTPS)</li>
                <li>Accès limité aux données par des personnes autorisées</li>
                <li>Sauvegardes régulières et sécurisées</li>
                <li>Hébergement sur des serveurs sécurisés</li>
                <li>Formation des bénévoles sur la protection des données</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Cookies -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            9. Cookies et traceurs
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <p>
                Notre site utilise uniquement des cookies strictement
                nécessaires au fonctionnement du site :
              </p>
              <ul class="list-disc pl-6 space-y-1">
                <li>
                  <strong>Cookies de session :</strong> pour maintenir votre
                  connexion
                </li>
                <li>
                  <strong>Cookies de préférences :</strong> pour mémoriser vos
                  choix (thème sombre/clair)
                </li>
                <li>
                  <strong>Cookies de sécurité :</strong> pour protéger contre
                  les attaques
                </li>
              </ul>
              <p class="mt-4">
                Aucun cookie de traçage publicitaire ou d'analyse
                comportementale n'est utilisé. Vous pouvez configurer votre
                navigateur pour bloquer les cookies, mais cela peut affecter
                certaines fonctionnalités.
              </p>
            </div>
          </div>
        </div>

        <!-- Réclamation -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            10. Réclamation
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <p>
                Si vous estimez que vos droits ne sont pas respectés, vous
                pouvez introduire une réclamation auprès de la Commission
                Nationale de l'Informatique et des Libertés (CNIL) :
              </p>
              <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p>
                  <strong>CNIL</strong><br />
                  3 Place de Fontenoy - TSA 80715<br />
                  75334 PARIS CEDEX 07<br />
                  Téléphone : 01 53 73 22 22<br />
                  Site web :
                  <a
                    href="https://www.cnil.fr"
                    target="_blank"
                    class="text-club-green hover:underline"
                    >www.cnil.fr</a
                  >
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Modifications -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">
            11. Modifications de la politique
          </h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <p>
                Cette politique de confidentialité peut être modifiée pour
                s'adapter aux évolutions légales, techniques ou
                organisationnelles. Toute modification importante vous sera
                communiquée par email ou via une notification sur le site.
              </p>
              <p>
                Nous vous recommandons de consulter régulièrement cette page
                pour rester informé de nos pratiques en matière de protection
                des données.
              </p>
            </div>
          </div>
        </div>

        <!-- Contact -->
        <div class="mb-12">
          <h2 class="text-2xl font-bold adaptive-title mb-6">12. Contact</h2>
          <div class="adaptive-card p-6 rounded-lg">
            <div class="space-y-4 adaptive-text">
              <p>
                Pour toute question concernant cette politique de
                confidentialité ou le traitement de vos données personnelles :
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
  title: "Politique de Confidentialité - Club Pongiste Libercourtois",
  description:
    "Politique de confidentialité et protection des données personnelles du Club Pongiste Libercourtois. Conforme RGPD.",
  keywords:
    "politique confidentialité, RGPD, protection données, vie privée, club tennis de table",
});

// Fetch club configuration from API - uses centralized config
const { data: clubConfig } = await useFetch("/api/club/config");
</script>
