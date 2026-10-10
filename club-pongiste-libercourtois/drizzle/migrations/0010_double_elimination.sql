DO $$ BEGIN CREATE TYPE "public"."bracket_mode" AS ENUM('single', 'double'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."bracket_side" AS ENUM('winners', 'losers', 'grand_final'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
ALTER TABLE "bracket_matches" DROP CONSTRAINT IF EXISTS "bracket_matches_series_id_round_match_number_unique";--> statement-breakpoint
ALTER TABLE "bracket_matches" ADD COLUMN IF NOT EXISTS "bracket_side" "bracket_side" DEFAULT 'winners' NOT NULL;--> statement-breakpoint
ALTER TABLE "bracket_matches" ADD COLUMN IF NOT EXISTS "loser_next_match_id" integer;--> statement-breakpoint
ALTER TABLE "bracket_matches" ADD COLUMN IF NOT EXISTS "loser_next_match_slot" integer;--> statement-breakpoint
ALTER TABLE "tournament_series" ADD COLUMN IF NOT EXISTS "bracket_mode" "bracket_mode" DEFAULT 'single' NOT NULL;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_series_id_bracket_side_round_match_number_unique" UNIQUE("series_id","bracket_side","round","match_number"); EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;