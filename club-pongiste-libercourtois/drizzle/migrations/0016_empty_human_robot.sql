-- Keep existing dates and times. Older series inherit their tournament date.
UPDATE "tournament_series" AS series
SET "series_date" = tournament."date"
FROM "tournaments" AS tournament
WHERE series."tournament_id" = tournament."id"
  AND (series."series_date" IS NULL OR series."series_date" = '');
--> statement-breakpoint
-- Use 09:00 only when an older series has no start time.
UPDATE "tournament_series"
SET "start_time" = '09:00'
WHERE "start_time" IS NULL OR "start_time" = '';
--> statement-breakpoint
ALTER TABLE "tournament_series" ALTER COLUMN "series_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_series" ALTER COLUMN "start_time" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_series" ADD CONSTRAINT "tournament_series_date_valid" CHECK ("tournament_series"."series_date" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND "tournament_series"."series_date"::date IS NOT NULL);--> statement-breakpoint
ALTER TABLE "tournament_series" ADD CONSTRAINT "tournament_series_start_time_valid" CHECK ("tournament_series"."start_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
