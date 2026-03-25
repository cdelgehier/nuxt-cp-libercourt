/**
 * Club configuration utility — lit depuis runtimeConfig / env vars (plus depuis JSON).
 * Le clubId FFTT est stable et connu : 07620112.
 */

const FALLBACK_CLUB_ID = "07620112";

export function getClubId(): string {
  const config = useRuntimeConfig();
  return (config.public.clubId as string) || FALLBACK_CLUB_ID;
}
