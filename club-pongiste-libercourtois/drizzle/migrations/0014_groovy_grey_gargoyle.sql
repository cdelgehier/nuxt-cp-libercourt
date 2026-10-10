CREATE TABLE "integral_matches" (
	"series_id" integer NOT NULL,
	"id" integer NOT NULL,
	"key" text NOT NULL,
	"phase" text NOT NULL,
	"pool_id" integer,
	"range_start" integer,
	"range_end" integer,
	"player1" integer,
	"player2" integer,
	"winner" integer,
	"loser" integer,
	"winner_range_start" integer,
	"winner_range_end" integer,
	"loser_range_start" integer,
	"loser_range_end" integer,
	"status" text NOT NULL,
	"rules" jsonb,
	"sources" jsonb NOT NULL,
	"forfeit_players" jsonb NOT NULL,
	"table" integer,
	"scheduled_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	CONSTRAINT "integral_matches_series_id_id_pk" PRIMARY KEY("series_id","id"),
	CONSTRAINT "integral_matches_series_id_key_unique" UNIQUE("series_id","key")
);
--> statement-breakpoint
CREATE TABLE "integral_phases" (
	"series_id" integer NOT NULL,
	"name" text NOT NULL,
	"current" boolean NOT NULL,
	CONSTRAINT "integral_phases_series_id_name_pk" PRIMARY KEY("series_id","name")
);
--> statement-breakpoint
CREATE TABLE "integral_placements" (
	"series_id" integer NOT NULL,
	"registration_id" integer NOT NULL,
	"place" integer NOT NULL,
	CONSTRAINT "integral_placements_series_id_registration_id_pk" PRIMARY KEY("series_id","registration_id"),
	CONSTRAINT "integral_placements_series_id_place_unique" UNIQUE("series_id","place")
);
--> statement-breakpoint
CREATE TABLE "integral_pool_members" (
	"series_id" integer NOT NULL,
	"pool_id" integer NOT NULL,
	"registration_id" integer NOT NULL,
	"position" integer NOT NULL,
	"rank" integer,
	CONSTRAINT "integral_pool_members_series_id_registration_id_pk" PRIMARY KEY("series_id","registration_id"),
	CONSTRAINT "integral_pool_members_series_id_pool_id_position_unique" UNIQUE("series_id","pool_id","position")
);
--> statement-breakpoint
CREATE TABLE "integral_pools" (
	"series_id" integer NOT NULL,
	"id" integer NOT NULL,
	CONSTRAINT "integral_pools_series_id_id_pk" PRIMARY KEY("series_id","id")
);
--> statement-breakpoint
CREATE TABLE "integral_ranges" (
	"series_id" integer NOT NULL,
	"start" integer NOT NULL,
	"end" integer NOT NULL,
	"generated" boolean NOT NULL,
	"sources" jsonb NOT NULL,
	CONSTRAINT "integral_ranges_series_id_start_end_pk" PRIMARY KEY("series_id","start","end")
);
--> statement-breakpoint
CREATE TABLE "integral_sets" (
	"series_id" integer NOT NULL,
	"match_id" integer NOT NULL,
	"number" integer NOT NULL,
	"score1" integer NOT NULL,
	"score2" integer NOT NULL,
	CONSTRAINT "integral_sets_series_id_match_id_number_pk" PRIMARY KEY("series_id","match_id","number")
);
--> statement-breakpoint
ALTER TABLE "integral_matches" ADD CONSTRAINT "integral_matches_series_id_integral_series_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."integral_series"("series_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_matches" ADD CONSTRAINT "integral_matches_player1_series_registrations_id_fk" FOREIGN KEY ("player1") REFERENCES "public"."series_registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_matches" ADD CONSTRAINT "integral_matches_player2_series_registrations_id_fk" FOREIGN KEY ("player2") REFERENCES "public"."series_registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_matches" ADD CONSTRAINT "integral_matches_winner_series_registrations_id_fk" FOREIGN KEY ("winner") REFERENCES "public"."series_registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_matches" ADD CONSTRAINT "integral_matches_loser_series_registrations_id_fk" FOREIGN KEY ("loser") REFERENCES "public"."series_registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_matches" ADD CONSTRAINT "integral_matches_series_id_phase_integral_phases_series_id_name_fk" FOREIGN KEY ("series_id","phase") REFERENCES "public"."integral_phases"("series_id","name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_matches" ADD CONSTRAINT "integral_matches_series_id_pool_id_integral_pools_series_id_id_fk" FOREIGN KEY ("series_id","pool_id") REFERENCES "public"."integral_pools"("series_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_matches" ADD CONSTRAINT "integral_matches_series_id_range_start_range_end_integral_ranges_series_id_start_end_fk" FOREIGN KEY ("series_id","range_start","range_end") REFERENCES "public"."integral_ranges"("series_id","start","end") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_matches" ADD CONSTRAINT "integral_matches_series_id_winner_range_start_winner_range_end_integral_ranges_series_id_start_end_fk" FOREIGN KEY ("series_id","winner_range_start","winner_range_end") REFERENCES "public"."integral_ranges"("series_id","start","end") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_matches" ADD CONSTRAINT "integral_matches_series_id_loser_range_start_loser_range_end_integral_ranges_series_id_start_end_fk" FOREIGN KEY ("series_id","loser_range_start","loser_range_end") REFERENCES "public"."integral_ranges"("series_id","start","end") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_phases" ADD CONSTRAINT "integral_phases_series_id_integral_series_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."integral_series"("series_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_placements" ADD CONSTRAINT "integral_placements_series_id_integral_series_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."integral_series"("series_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_placements" ADD CONSTRAINT "integral_placements_registration_id_series_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."series_registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_pool_members" ADD CONSTRAINT "integral_pool_members_registration_id_series_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."series_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_pool_members" ADD CONSTRAINT "integral_pool_members_series_id_pool_id_integral_pools_series_id_id_fk" FOREIGN KEY ("series_id","pool_id") REFERENCES "public"."integral_pools"("series_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_pools" ADD CONSTRAINT "integral_pools_series_id_integral_series_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."integral_series"("series_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_ranges" ADD CONSTRAINT "integral_ranges_series_id_integral_series_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."integral_series"("series_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integral_sets" ADD CONSTRAINT "integral_sets_series_id_match_id_integral_matches_series_id_id_fk" FOREIGN KEY ("series_id","match_id") REFERENCES "public"."integral_matches"("series_id","id") ON DELETE cascade ON UPDATE no action;