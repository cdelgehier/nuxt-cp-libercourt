import type { ClubConfig } from "~/types";

export default defineEventHandler(async (event) => {
  try {
    // Import centralized configuration data
    const configData = await import("~/content/club/config.json");
    const config = (configData.default || configData) as ClubConfig;

    // Import schedules data from JSON file
    const schedulesData = await import("~/content/club/schedules.json");
    const schedules = schedulesData.default || schedulesData;

    // Import pricing data from separate JSON file
    const pricingData = await import("~/content/club/pricing.json");
    const pricing = pricingData.default || pricingData;

    // Get document URLs FFTT
    let ffttDocuments;
    try {
      ffttDocuments = await $fetch("/api/fftt/documents");
    } catch (error) {
      console.warn("Could not fetch FFTT documents, using fallback URLs");
      ffttDocuments = { success: false };
    }

    // Fallback URLs if scraping fails
    const fallbackUrl =
      "https://www.fftt.com/doc/administratif/telechargement.html";

    // Structure enriched with config data and FFTT documents
    const enrichedData = {
      // Use schedules from schedules.json
      schedules: schedules.schedules,
      // Use pricing from pricing.json
      pricing: pricing.pricing,
      registration: {
        period: "Inscriptions ouvertes de juin à septembre",
        documents: [
          {
            name: "Bordereau de demande de Licence (Compétition / Loisir)",
            description:
              "Fiche d'inscription officielle FFTT - fait office de formulaire d'inscription",
            required: true,
            type: "fftt",
            url:
              ffttDocuments.success && ffttDocuments.bordereau_licence
                ? ffttDocuments.bordereau_licence.url
                : fallbackUrl,
          },
          {
            name: "Autoquestionnaire Médical (Personnes Majeures)",
            description:
              "Document médical obligatoire pour les joueurs majeurs",
            required: true,
            type: "medical",
            condition: "Pour les joueurs majeurs",
            url:
              ffttDocuments.success && ffttDocuments.questionnaire_majeurs
                ? ffttDocuments.questionnaire_majeurs.url
                : fallbackUrl,
          },
          {
            name: "Autoquestionnaire Médical (Personnes Mineures)",
            description:
              "Document médical obligatoire pour les joueurs mineurs",
            required: true,
            type: "medical",
            condition: "Pour les joueurs mineurs",
            url:
              ffttDocuments.success && ffttDocuments.questionnaire_mineurs
                ? ffttDocuments.questionnaire_mineurs.url
                : fallbackUrl,
          },
          {
            name: "Certificat médical d'un médecin",
            description:
              "Certificat médical de non contre-indication à la pratique du tennis de table",
            required: true,
            type: "medical",
            condition: "Pour les nouveaux licenciés uniquement",
            url:
              ffttDocuments.success && ffttDocuments.certificat_medical
                ? ffttDocuments.certificat_medical.url
                : fallbackUrl,
          },
          {
            name: "Adresse email",
            description: "Adresse email valide pour les communications du club",
            required: true,
            type: "contact",
          },
          {
            name: "Numéro de téléphone",
            description:
              "Numéro de téléphone pour les urgences et communications",
            required: true,
            type: "contact",
          },
          {
            name: "Règlement",
            description: "Paiement de la licence (chèque, espèces ou virement)",
            required: true,
            type: "payment",
          },
        ],
        contact: {
          responsible: "Cédric DELGEHIER",
          role: "Responsable des inscriptions",
          email: config.club.email,
          phone: config.club.phone,
          availability: "Mardi et jeudi de 18h à 20h",
        },
      },
      facilities: {
        address: {
          name: `${config.club.salle} - ${config.club.complexe}`,
          street: config.club.complexe,
          city: config.location.city,
          postalCode: config.location.postalCode,
          country: config.location.country,
          coordinates: {
            lat: config.location.coordinates.lat,
            lng: config.location.coordinates.lng,
          },
        },
        description: `Salle moderne équipée de 24 tables de compétition dans un ${(config as any).club.complexe.toLowerCase()} accessible`,
        equipment: [
          "24 tables de compétition Cornilleau",
          "Éclairage professionnel LED",
          "Sol sportif homologué FFTT",
          "Vestiaires et sanitaires",
          "Espace convivialité",
        ],
        access: {
          parking: "Gratuit sur place",
          publicTransport: `Ligne de bus 12 - Arrêt ${config.club.complexe}`,
          accessibility: "Accès PMR disponible",
        },
        parking: "Gratuit sur place",
        accessibility: "Accès PMR disponible",
      },
      contact: {
        generalInfo: config.club,
        permanences: [
          {
            day: "Mardi",
            time: "18h00 - 20h00",
            location: config.club.salle,
            contact: "Cédric DELGEHIER",
          },
          {
            day: "Jeudi",
            time: "18h00 - 20h00",
            location: config.club.salle,
            contact: "Patrick Levray",
          },
        ],
      },
    };

    return enrichedData;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Erreur lors de la récupération des données horaires et tarifs",
    });
  }
});
