/**
 * Service domaine competition — orchestre SmartPing avec cache Nitro.
 * Toute la logique d'appel FFTT passe par ici, pas directement dans les routes API.
 */

import { useStorage } from "nitropack/runtime";
import { SmartPingAPI } from "./smartping/client";
import type { PoolRankingEntry } from "./smartping/client";

const TTL_TEAMS = 3600; // 1h
const TTL_LICENSEES = 3600;
const TTL_MATCHES = 1800; // 30min
const TTL_RANKING = 1800;

function createClient(): SmartPingAPI {
  const config = useRuntimeConfig();
  return new SmartPingAPI(
    config.smartpingAppCode as string,
    config.smartpingPassword as string,
    config.smartpingEmail as string,
  );
}

async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const storage = useStorage("cache");
  const cached = await storage.getItem<T>(key);
  if (cached !== null) return cached;
  const data = await fetcher();
  await storage.setItem(key, data, { ttl });
  return data;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export async function getClubTeams(clubId: string) {
  return withCache(`smartping:teams:${clubId}`, TTL_TEAMS, () => {
    const client = createClient();
    return client.getClubTeams(clubId);
  });
}

export async function getClubLicensees(clubId: string) {
  return withCache(`smartping:licensees:${clubId}`, TTL_LICENSEES, () => {
    const client = createClient();
    return client.getClubLicenseesWithCategories(clubId);
  });
}

export async function getClubStats(clubId: string) {
  return withCache(`smartping:stats:${clubId}`, TTL_TEAMS, async () => {
    const client = createClient();
    const [teams, licensees] = await Promise.all([
      client.getClubTeams(clubId),
      client.getClubLicensees(clubId),
    ]);
    return {
      teamsCount: teams.length,
      licenseesCount: licensees.length,
      lastUpdated: new Date().toISOString(),
    };
  });
}

export async function getTeamMatches(teamId: string, clubId: string) {
  return withCache(`smartping:matches:${teamId}`, TTL_MATCHES, () => {
    const client = createClient();
    return client.getTeamMatches(teamId, clubId);
  });
}

export async function getPoolRanking(
  divisionId: string,
  pouleId: string,
): Promise<PoolRankingEntry[]> {
  return withCache(
    `smartping:ranking:${divisionId}:${pouleId}`,
    TTL_RANKING,
    () => {
      const client = createClient();
      return client.getPoolRanking(divisionId, pouleId);
    },
  );
}

export async function getMatchDetails(matchId: string) {
  return withCache(`smartping:match:${matchId}`, TTL_MATCHES, () => {
    const client = createClient();
    return client.getMatchDetails(matchId);
  });
}

export async function getPlayerMatches(licenceId: string) {
  return withCache(`smartping:player:matches:${licenceId}`, TTL_MATCHES, () => {
    const client = createClient();
    return client.getPlayerMatches(licenceId);
  });
}

export async function getPlayerRankingHistory(licenceId: string) {
  return withCache(`smartping:player:history:${licenceId}`, TTL_RANKING, () => {
    const client = createClient();
    return client.getPlayerRankingHistory(licenceId);
  });
}

export async function getLicenseeDetails(licenceId: string) {
  return withCache(`smartping:licensee:${licenceId}`, TTL_LICENSEES, () => {
    const client = createClient();
    return client.getLicenseeDetails(licenceId);
  });
}
