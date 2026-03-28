import { db } from "~~/server/db/client";
import {
  seriesRegistrations,
  tournamentSeries,
} from "~~/server/domains/tournament/schema";
import { fetchLicenseesWithSmartPing } from "~~/server/utils/smartping";
import { eq } from "drizzle-orm";

const FIRST_NAMES = [
  "Thomas",
  "Lucas",
  "Nathan",
  "Maxime",
  "Julien",
  "Antoine",
  "Pierre",
  "Romain",
  "Nicolas",
  "Clément",
  "Baptiste",
  "Alexandre",
  "Quentin",
  "Florian",
  "Mathieu",
  "Cédric",
  "Thierry",
  "Marc",
  "David",
  "Éric",
  "Kevin",
  "Sébastien",
  "Yoann",
  "Alexis",
  "Guillaume",
  "Xavier",
  "Laurent",
  "Stéphane",
  "Bertrand",
  "Arnaud",
];
const LAST_NAMES = [
  "MARTIN",
  "BERNARD",
  "THOMAS",
  "PETIT",
  "ROBERT",
  "RICHARD",
  "DURAND",
  "MOREAU",
  "LEFEBVRE",
  "SIMON",
  "MICHEL",
  "LEROY",
  "ROUX",
  "DAVID",
  "BERTRAND",
  "MOREL",
  "FOURNIER",
  "GIRARD",
  "BONNET",
  "DUPONT",
  "LAMBERT",
  "FONTAINE",
  "ROUSSEAU",
  "VINCENT",
  "MULLER",
  "LEFEVRE",
  "FAURE",
  "ANDRE",
  "MERCIER",
  "BLANC",
];
const OTHER_CLUBS = [
  "TTC BETHUNE",
  "TTC LENS",
  "ES ARRAS TT",
  "DOUAI TT",
  "HENIN TT",
];
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomAttendance() {
  return (
    Math.random() < 0.7 ? "present" : Math.random() < 0.5 ? "unknown" : "absent"
  ) as "present" | "absent" | "unknown";
}

function randomPayment() {
  return (Math.random() > 0.3 ? "paid" : "unpaid") as "paid" | "unpaid";
}

function mapGender(sexe: string): "M" | "F" | null {
  if (sexe === "M" || sexe === "H") return "M";
  if (sexe === "F") return "F";
  return null;
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as { seriesId: number; count?: number };
  const { seriesId, count = 30 } = body;

  if (!seriesId)
    throw createError({ statusCode: 400, message: "seriesId requis" });

  const [series] = await db
    .select({ seriesFormat: tournamentSeries.seriesFormat })
    .from(tournamentSeries)
    .where(eq(tournamentSeries.id, seriesId));

  const isDoubles = series?.seriesFormat === "doubles";

  const config = useRuntimeConfig();
  const clubId = config.public.clubId;

  const result = await fetchLicenseesWithSmartPing(clubId);

  if (!result.success || !result.data?.length) {
    throw createError({
      statusCode: 502,
      message: `Impossible de récupérer les licenciés Smartping : ${result.error ?? "no data"}`,
    });
  }

  // Shuffle and take `count` players (or all if fewer)
  const shuffled = [...result.data].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, count);

  let entries;
  if (isDoubles) {
    // Fake doubles pairs
    entries = Array.from({ length: count }, (_, i) => ({
      seriesId,
      licenceNumber: null,
      firstName: pick(FIRST_NAMES),
      lastName: pick(LAST_NAMES),
      club: i < Math.ceil(count * 0.6) ? "LIBERCOURT CP" : pick(OTHER_CLUBS),
      ranking: Math.floor(500 + Math.random() * 1500),
      playerGender: null,
      playerCategory: null,
      handicapPoints: 0,
      attendanceStatus: randomAttendance(),
      paymentStatus: randomPayment(),
      isForfeit: false,
      seedPosition: null,
      notes: null,
      partnerLicenceNumber: null,
      partnerFirstName: pick(FIRST_NAMES),
      partnerLastName: pick(LAST_NAMES),
      partnerClub: Math.random() < 0.5 ? "LIBERCOURT CP" : pick(OTHER_CLUBS),
      partnerRanking: Math.floor(500 + Math.random() * 1500),
    }));
  } else {
    // Real players from Smartping
    entries = picked.map((p) => ({
      seriesId,
      licenceNumber: p.licence,
      firstName: p.prenom,
      lastName: p.nom,
      club: p.club || "LIBERCOURT CP",
      ranking: p.points ?? null,
      playerGender: mapGender(p.sexe),
      playerCategory: null,
      handicapPoints: 0,
      attendanceStatus: randomAttendance(),
      paymentStatus: randomPayment(),
      isForfeit: false,
      seedPosition: null,
      notes: null,
      partnerLicenceNumber: null,
      partnerFirstName: null,
      partnerLastName: null,
      partnerClub: null,
      partnerRanking: null,
    }));
  }

  await db.insert(seriesRegistrations).values(entries);

  return { inserted: entries.length };
});
