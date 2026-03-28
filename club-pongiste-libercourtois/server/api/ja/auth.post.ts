import { verifyJaPin } from "~~/server/domains/tournament/service";

const SESSION_PASSWORD =
  process.env.SESSION_SECRET ?? "fallback-change-me-in-production";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const access = await verifyJaPin(body);

  // Store JA session (same useSession mechanism as basic auth)
  const session = await useSession(event, { password: SESSION_PASSWORD });
  await session.update({
    jaAccessId: access.id,
    jaName: access.name,
    jaTournamentId: access.tournamentId,
  });

  return {
    name: access.name,
    tournamentId: access.tournamentId,
  };
});
