import { getConfig } from "~~/server/domains/club/service";

export default defineCachedEventHandler(async () => getConfig(), {
  maxAge: 60 * 60,
  name: "club-config",
  getKey: () => "config",
});
