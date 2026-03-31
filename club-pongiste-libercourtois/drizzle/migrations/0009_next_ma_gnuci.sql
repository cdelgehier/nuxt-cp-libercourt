ALTER TABLE "event_registrations" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "companions" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "is_paid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "series_registrations" ADD COLUMN "player_gender" text;--> statement-breakpoint
ALTER TABLE "tournament_series" ADD COLUMN "females_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_series" ADD COLUMN "series_date" text;--> statement-breakpoint
ALTER TABLE "tournament_series" ADD COLUMN "start_time" text;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "location_lat" double precision;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "location_lng" double precision;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "date_end" text;
