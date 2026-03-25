/**
 * GET /api/club/contact
 * Données de la page contact depuis la DB.
 */
import { getConfig, getTeamMembers } from "~~/server/domains/club/service";

export default defineEventHandler(async () => {
  const [config, members] = await Promise.all([getConfig(), getTeamMembers()]);

  const contacts = members.map((m) => ({
    name: `${m.firstName} ${m.lastName}`,
    role: m.fullRole ?? m.role,
    responsibilities: m.responsibilities,
    email: m.email,
    phone: m.phone,
  }));

  const socialMedia = config.facebookUrl
    ? [
        {
          platform: "facebook",
          name: "Facebook",
          url: config.facebookUrl,
          icon: "i-simple-icons-facebook",
        },
      ]
    : [];

  return {
    contacts,
    club: {
      name: config.name,
      email: config.email,
      phone: config.phone,
      website: config.website,
    },
    address: {
      name: [config.salle, config.complexe].filter(Boolean).join(" - ") || null,
      street: config.street,
      postalCode: config.postalCode,
      city: config.city,
      country: config.country,
      googleMapsUrl: config.googleMapsUrl,
      coordinates: { lat: config.lat, lng: config.lng },
    },
    socialMedia,
    schedule: {
      availability: {
        title: "Disponibilité des Responsables",
        note: "Nous sommes disponibles lors des créneaux d'entraînement et sur rendez-vous",
        sessions: [
          {
            day: "Contactez-nous",
            time: "Par email ou téléphone",
            location: "Réponse rapide garantie",
            contact: "Équipe dirigeante",
          },
        ],
      },
    },
    faq: [
      {
        question: "Comment puis-je m'inscrire au club ?",
        answer:
          "Vous pouvez vous inscrire directement en venant aux permanences ou en nous contactant par téléphone.",
      },
    ],
  };
});
