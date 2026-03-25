import { getSchedules } from "~~/server/domains/club/service";

export default defineEventHandler(async () => {
  const { schedules } = await getSchedules();
  return { data: schedules };
});
