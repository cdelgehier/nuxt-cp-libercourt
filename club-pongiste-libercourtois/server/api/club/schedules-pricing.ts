/**
 * GET /api/club/schedules-pricing
 * Données des horaires, tarifs et informations d'inscription depuis la DB.
 */
import {
  getConfig,
  getPricing,
  getSchedules,
} from "~~/server/domains/club/service";

export default defineEventHandler(async () => {
  const [config, schedulesData, pricingData] = await Promise.all([
    getConfig(),
    getSchedules(),
    getPricing(),
  ]);

  // Documents FFTT (non-bloquant)
  let ffttDocuments: Record<string, unknown> = { success: false };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ffttDocuments = (await $fetch("/api/fftt/documents")) as any;
  } catch {
    // fallback silencieux
  }

  const fallbackUrl =
    "https://www.fftt.com/doc/administratif/telechargement.html";

  const allSchedules = schedulesData.schedules;
  const allPricing = [...pricingData.annual, ...pricingData.reductions];

  // Grouper les créneaux d'entraînement par jour avec structure sessions
  type TrainingDay = {
    day: string;
    sessions: {
      time: string;
      category: string;
      level: string | null;
      coach: string | null;
      type: string;
    }[];
  };
  const groupByDay = (list: typeof allSchedules): TrainingDay[] => {
    const map = new Map<string, TrainingDay>();
    for (const s of list) {
      if (!map.has(s.day)) map.set(s.day, { day: s.day, sessions: [] });
      map.get(s.day)!.sessions.push({
        time: `${s.timeStart} - ${s.timeEnd}`,
        category: s.category,
        level: s.level,
        coach: s.coach,
        type: s.type,
      });
    }
    return Array.from(map.values());
  };

  // Compétitions sous forme plate (une entrée = un créneau)
  const competitions = allSchedules
    .filter((s) => s.type === "competition")
    .map((s) => ({
      day: s.day,
      time: `${s.timeStart} - ${s.timeEnd}`,
      description: s.category,
      note: s.level ?? "",
    }));

  return {
    // Tableaux plats pour l'admin
    schedules: allSchedules,
    pricing: allPricing,
    // Structures groupées (compatibilité frontend)
    schedulesGrouped: {
      training: groupByDay(
        allSchedules.filter((s) => s.type !== "competition"),
      ),
      competitions,
    },
    pricingGrouped: {
      annual: pricingData.annual,
      reductions: pricingData.reductions,
      additional: [] as typeof pricingData.annual,
    },
    registration: {
      period: "Inscriptions ouvertes de juin à septembre",
      documents: [
        {
          name: "Bordereau de demande de Licence (Compétition / Loisir)",
          description: "Fiche d'inscription officielle FFTT",
          required: true,
          type: "fftt",
          url:
            (ffttDocuments.success &&
              (ffttDocuments as Record<string, { url: string }>)
                .bordereau_licence?.url) ||
            fallbackUrl,
        },
        {
          name: "Autoquestionnaire Médical (Personnes Majeures)",
          description: "Document médical obligatoire pour les joueurs majeurs",
          required: true,
          type: "medical",
          condition: "Pour les joueurs majeurs",
          url:
            (ffttDocuments.success &&
              (ffttDocuments as Record<string, { url: string }>)
                .questionnaire_majeurs?.url) ||
            fallbackUrl,
        },
        {
          name: "Autoquestionnaire Médical (Personnes Mineures)",
          description: "Document médical obligatoire pour les joueurs mineurs",
          required: true,
          type: "medical",
          condition: "Pour les joueurs mineurs",
          url:
            (ffttDocuments.success &&
              (ffttDocuments as Record<string, { url: string }>)
                .questionnaire_mineurs?.url) ||
            fallbackUrl,
        },
        {
          name: "Adresse email",
          description: "Adresse email valide pour les communications du club",
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
        email: config.email,
        phone: config.phone,
        availability: "Mardi et jeudi de 18h à 20h",
      },
    },
    facilities: {
      address: {
        name: [config.salle, config.complexe].filter(Boolean).join(" - "),
        street: config.street,
        city: config.city,
        postalCode: config.postalCode,
        country: config.country,
        coordinates: { lat: config.lat, lng: config.lng },
      },
      parking: "Gratuit sur place",
      accessibility: "Accès PMR disponible",
    },
    contact: {
      generalInfo: {
        name: config.name,
        email: config.email,
        phone: config.phone,
        salle: config.salle,
      },
    },
  };
});
