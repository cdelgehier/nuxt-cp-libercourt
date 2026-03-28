CREATE TYPE "public"."attendance_status" AS ENUM('unknown', 'present', 'absent');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('pending', 'in_progress', 'finished', 'forfeit');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'paid', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."series_format" AS ENUM('singles', 'doubles');--> statement-breakpoint
CREATE TYPE "public"."series_status" AS ENUM('draft', 'registration', 'bracket_generated', 'in_progress', 'finished');--> statement-breakpoint
CREATE TYPE "public"."series_type" AS ENUM('standard', 'speedy', 'handicap', 'points_limit', 'age_junior', 'age_veteran', 'mixed_doubles');--> statement-breakpoint
CREATE TABLE "bracket_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" integer NOT NULL,
	"round" integer NOT NULL,
	"match_number" integer NOT NULL,
	"table_number" integer,
	"player1_id" integer,
	"player2_id" integer,
	"winner_id" integer,
	"status" "match_status" DEFAULT 'pending' NOT NULL,
	"next_match_id" integer,
	"next_match_slot" integer,
	"entered_by_ja_id" integer,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "bracket_matches_series_id_round_match_number_unique" UNIQUE("series_id","round","match_number")
);
--> statement-breakpoint
CREATE TABLE "match_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"set_number" integer NOT NULL,
	"score1" integer NOT NULL,
	"score2" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "series_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" integer NOT NULL,
	"licence_number" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"club" text,
	"ranking" integer,
	"handicap_points" integer DEFAULT 0 NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"attendance_status" "attendance_status" DEFAULT 'unknown' NOT NULL,
	"is_forfeit" boolean DEFAULT false NOT NULL,
	"seed_position" integer,
	"partner_licence_number" text,
	"partner_first_name" text,
	"partner_last_name" text,
	"partner_club" text,
	"partner_ranking" integer,
	"notes" text,
	"registered_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_ja_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"name" text NOT NULL,
	"pin" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_series" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"name" text NOT NULL,
	"series_format" "series_format" DEFAULT 'singles' NOT NULL,
	"series_type" "series_type" DEFAULT 'standard' NOT NULL,
	"points_limit_min" integer,
	"points_limit_max" integer,
	"status" "series_status" DEFAULT 'draft' NOT NULL,
	"max_players" integer,
	"sets_to_win" integer DEFAULT 3 NOT NULL,
	"points_per_set" integer DEFAULT 11 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"date" text NOT NULL,
	"location" text,
	"description" text,
	"table_count" integer DEFAULT 1 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tournaments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_series_id_tournament_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."tournament_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_player1_id_series_registrations_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."series_registrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_player2_id_series_registrations_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."series_registrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_winner_id_series_registrations_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."series_registrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_entered_by_ja_id_tournament_ja_access_id_fk" FOREIGN KEY ("entered_by_ja_id") REFERENCES "public"."tournament_ja_access"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_sets" ADD CONSTRAINT "match_sets_match_id_bracket_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."bracket_matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series_registrations" ADD CONSTRAINT "series_registrations_series_id_tournament_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."tournament_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_ja_access" ADD CONSTRAINT "tournament_ja_access_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_series" ADD CONSTRAINT "tournament_series_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;
