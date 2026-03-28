/**
 * Dev seed: insert N random players into a series.
 *
 * Usage:
 *   pnpm tsx server/db/seed-series.ts <seriesId> [count=30]
 *
 * Example:
 *   pnpm tsx server/db/seed-series.ts 3
 *   pnpm tsx server/db/seed-series.ts 3 10
 */

import { config } from "dotenv";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { seriesRegistrations } from "../domains/tournament/schema";

config({ path: resolve(process.cwd(), ".env") });

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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomRanking(): number {
  // Realistic FFTT points: 500–2000, clustered around 800
  return Math.floor(500 + Math.random() * 1500);
}

function randomAttendance(): "present" | "absent" | "unknown" {
  const r = Math.random();
  if (r < 0.7) return "present";
  if (r < 0.85) return "unknown";
  return "absent";
}

async function main() {
  const seriesId = Number(process.argv[2]);
  const count = Number(process.argv[3] ?? 30);

  if (!seriesId) {
    console.error(
      "Usage: pnpm tsx server/db/seed-series.ts <seriesId> [count=30]",
    );
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  const players = Array.from({ length: count }, (_, i) => ({
    seriesId,
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    club:
      i < Math.ceil(count * 0.6)
        ? "LIBERCOURT CP"
        : pick([
            "TTC BETHUNE",
            "TTC LENS",
            "ES ARRAS TT",
            "DOUAI TT",
            "HENIN TT",
          ]),
    ranking: randomRanking(),
    attendanceStatus: randomAttendance() as "present" | "absent" | "unknown",
    paymentStatus: (Math.random() > 0.3 ? "paid" : "unpaid") as
      | "paid"
      | "unpaid",
    licenceNumber: null,
    handicapPoints: 0,
    isForfeit: false,
    seedPosition: null,
    notes: null,
    partnerLicenceNumber: null,
    partnerFirstName: null,
    partnerLastName: null,
    partnerClub: null,
    partnerRanking: null,
  }));

  await db.insert(seriesRegistrations).values(players);

  console.log(`✓ ${count} joueurs insérés dans la série ${seriesId}`);
  console.log(
    `  Libercourt CP : ~${Math.ceil(count * 0.6)}, autres clubs : ~${Math.floor(count * 0.4)}`,
  );
  console.log(
    `  Présents : ~${players.filter((p) => p.attendanceStatus === "present").length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
