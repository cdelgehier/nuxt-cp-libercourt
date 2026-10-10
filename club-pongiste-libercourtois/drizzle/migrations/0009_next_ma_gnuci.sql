ALTER TABLE "event_registrations" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN IF NOT EXISTS "companions" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN IF NOT EXISTS "is_paid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "series_registrations" ADD COLUMN IF NOT EXISTS "player_gender" text;--> statement-breakpoint
ALTER TABLE "tournament_series" ADD COLUMN IF NOT EXISTS "females_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_series" ADD COLUMN IF NOT EXISTS "series_date" text;--> statement-breakpoint
ALTER TABLE "tournament_series" ADD COLUMN IF NOT EXISTS "start_time" text;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN IF NOT EXISTS "location_lat" double precision;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN IF NOT EXISTS "location_lng" double precision;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN IF NOT EXISTS "date_end" text;
