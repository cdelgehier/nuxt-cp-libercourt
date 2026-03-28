ALTER TABLE "tournaments" ADD COLUMN IF NOT EXISTS "location_lat" double precision;
ALTER TABLE "tournaments" ADD COLUMN IF NOT EXISTS "location_lng" double precision;
