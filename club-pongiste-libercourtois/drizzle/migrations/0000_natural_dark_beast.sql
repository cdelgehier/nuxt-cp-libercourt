CREATE TABLE "club_about_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text,
	"content" jsonb,
	"sort_order" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "club_about_sections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "club_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"level" text,
	"icon" text,
	"color" text,
	"features" jsonb,
	"schedule_info" text,
	"sort_order" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	CONSTRAINT "club_activities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "club_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"club_id" text NOT NULL,
	"description" text,
	"email" text,
	"phone" text,
	"website" text,
	"facebook_url" text,
	"salle" text,
	"complexe" text,
	"street" text,
	"postal_code" text,
	"city" text,
	"country" text DEFAULT 'France',
	"lat" text,
	"lng" text,
	"google_maps_url" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "club_faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text NOT NULL,
	"is_popular" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "club_pricing" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"age_range" text,
	"price" integer NOT NULL,
	"includes" jsonb,
	"is_reduction" boolean DEFAULT false,
	"reduction_label" text,
	"reduction_amount" integer,
	"details" text,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "club_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"day" text NOT NULL,
	"day_order" integer NOT NULL,
	"time_start" text NOT NULL,
	"time_end" text NOT NULL,
	"category" text NOT NULL,
	"level" text,
	"type" text DEFAULT 'libre' NOT NULL,
	"coach" text,
	"active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "club_sponsors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"website" text,
	"category" text DEFAULT 'bronze' NOT NULL,
	"description" text,
	"active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "club_team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" text NOT NULL,
	"full_role" text,
	"email" text,
	"phone" text,
	"bio" text,
	"responsibilities" jsonb,
	"image" text,
	"joined_date" text,
	"sort_order" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"licence_number" text,
	"level" text,
	"notes" text,
	"registered_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"type" text DEFAULT 'other' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"location" text,
	"description" text,
	"max_participants" integer,
	"is_registration_open" boolean DEFAULT false,
	"price" integer,
	"contact" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
