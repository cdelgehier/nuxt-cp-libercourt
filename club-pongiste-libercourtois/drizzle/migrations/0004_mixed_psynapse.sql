-- Step 1: Add new columns first
ALTER TABLE "tournament_series" ADD COLUMN IF NOT EXISTS "age_categories" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "series_registrations" ADD COLUMN IF NOT EXISTS "player_category" text;--> statement-breakpoint
-- Step 2: Cast series_type to text so we can compare and update freely
ALTER TABLE "tournament_series" ALTER COLUMN "series_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tournament_series" ALTER COLUMN "series_type" SET DEFAULT 'standard'::text;--> statement-breakpoint
-- Step 3: Migrate old age-category types → standard + populate age_categories
UPDATE "tournament_series" SET
  "age_categories" = CASE "series_type"
    WHEN 'poussin_benjamin' THEN ARRAY['poussin', 'benjamin']
    WHEN 'minimes'          THEN ARRAY['minimes']
    WHEN 'cadets'           THEN ARRAY['cadets']
    WHEN 'juniors'          THEN ARRAY['juniors']
    WHEN 'veterans'         THEN ARRAY['veterans']
    WHEN 'super_veterans'   THEN ARRAY['super_veterans']
    ELSE "age_categories"
  END,
  "series_type" = 'standard'
WHERE "series_type" IN ('poussin_benjamin','minimes','cadets','juniors','veterans','super_veterans');--> statement-breakpoint
-- Step 4: Drop old enum and recreate with reduced values
DROP TYPE IF EXISTS "public"."series_type";--> statement-breakpoint
CREATE TYPE "public"."series_type" AS ENUM('standard', 'speedy', 'handicap', 'points_limit', 'mixed_doubles', 'coupe_davis');--> statement-breakpoint
-- Step 5: Cast column back to enum
ALTER TABLE "tournament_series" ALTER COLUMN "series_type" SET DEFAULT 'standard'::"public"."series_type";--> statement-breakpoint
ALTER TABLE "tournament_series" ALTER COLUMN "series_type" SET DATA TYPE "public"."series_type" USING "series_type"::"public"."series_type";
