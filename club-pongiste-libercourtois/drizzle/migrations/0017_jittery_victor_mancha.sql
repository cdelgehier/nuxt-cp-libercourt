CREATE TABLE "tournament_forecasts" (
	"tournament_id" integer PRIMARY KEY NOT NULL,
	"config" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_forecasts_version_positive" CHECK ("tournament_forecasts"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "tournament_forecasts" ADD CONSTRAINT "tournament_forecasts_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;
