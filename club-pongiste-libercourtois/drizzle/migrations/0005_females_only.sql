ALTER TABLE "tournament_series" ADD COLUMN IF NOT EXISTS "females_only" boolean NOT NULL DEFAULT false;
ALTER TABLE "series_registrations" ADD COLUMN IF NOT EXISTS "player_gender" text;
