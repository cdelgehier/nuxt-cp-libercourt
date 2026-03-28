ALTER TABLE "tournament_series" ALTER COLUMN "series_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tournament_series" ALTER COLUMN "series_type" SET DEFAULT 'standard'::text;--> statement-breakpoint
DROP TYPE "public"."series_type";--> statement-breakpoint
CREATE TYPE "public"."series_type" AS ENUM('standard', 'speedy', 'handicap', 'points_limit', 'poussin_benjamin', 'minimes', 'cadets', 'juniors', 'veterans', 'super_veterans', 'mixed_doubles', 'coupe_davis');--> statement-breakpoint
ALTER TABLE "tournament_series" ALTER COLUMN "series_type" SET DEFAULT 'standard'::"public"."series_type";--> statement-breakpoint
ALTER TABLE "tournament_series" ALTER COLUMN "series_type" SET DATA TYPE "public"."series_type" USING "series_type"::"public"."series_type";
