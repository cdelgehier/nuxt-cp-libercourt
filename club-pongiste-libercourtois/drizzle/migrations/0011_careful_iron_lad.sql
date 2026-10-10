CREATE TABLE "integral_series" (
	"series_id" integer PRIMARY KEY NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"state" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integral_series" ADD CONSTRAINT "integral_series_series_id_tournament_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."tournament_series"("id") ON DELETE cascade ON UPDATE no action;