export default defineEventHandler(async (event) => {
  const session = await useSession(event, {
    password: process.env.SESSION_SECRET ?? "fallback-change-me-in-production",
  });
  return {
    user: session.data.user ?? null,
    method: session.data.method ?? null,
  };
});
