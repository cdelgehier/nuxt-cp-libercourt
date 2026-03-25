import { getPricing } from "~~/server/domains/club/service";

export default defineEventHandler(async () => {
  const pricing = await getPricing();
  return { data: [...pricing.annual, ...pricing.reductions] };
});
