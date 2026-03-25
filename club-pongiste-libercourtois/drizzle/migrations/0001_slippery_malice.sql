ALTER TABLE "club_activities" RENAME COLUMN "level" TO "age_group";--> statement-breakpoint
ALTER TABLE "club_pricing" ALTER COLUMN "price" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "club_pricing" ALTER COLUMN "reduction_amount" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "price" SET DATA TYPE numeric;
