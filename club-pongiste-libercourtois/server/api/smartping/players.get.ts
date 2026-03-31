import { SmartPingAPI } from "~~/server/utils/smartping";
import { getClubId } from "~~/server/utils/clubConfig";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const nom = String(query.nom ?? "").trim();
  const prenom = query.prenom ? String(query.prenom).trim() : undefined;
  const clubOnly = query.clubOnly === "true";

  if (!nom || nom.length < 2) {
    throw createError({
      statusCode: 400,
      message: "nom requis (min 2 caractères)",
    });
  }

  const appCode = process.env.SMARTPING_APP_CODE;
  const password = process.env.SMARTPING_PASSWORD;
  const email = process.env.SMARTPING_EMAIL;

  if (!appCode || !password || !email) {
    throw createError({
      statusCode: 500,
      message: "Configuration SmartPing manquante",
    });
  }

  const api = new SmartPingAPI(appCode, password, email);
  const result = await api.searchPlayers(nom, prenom);

  if (!result.success) {
    throw createError({ statusCode: 502, message: result.error });
  }

  const clubId = getClubId();
  const players = result.data ?? [];
  // In parseXMLJoueursFromRankingDB: p.club = club number (XML <nclub>), p.nclub = club name (XML <club>)
  const filtered = clubOnly
    ? players.filter(
        (p) => p.club === clubId || p.club === clubId.replace(/^0+/, ""),
      )
    : players;

  return filtered.map((p) => ({
    licence: p.licence,
    lastName: p.nom,
    firstName: p.prenom,
    club: p.nclub, // nclub = club name in parseXMLJoueursFromRankingDB
    ranking: 0, // points not available in xml_liste_joueur.php name search; fetched via getLicenseeDetails on select
  }));
});
