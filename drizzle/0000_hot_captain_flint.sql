CREATE TABLE "area_category_places" (
	"area_id" text NOT NULL,
	"category_id" text NOT NULL,
	"place_id" text NOT NULL,
	"first_discovered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "area_category_places_area_id_category_id_place_id_pk" PRIMARY KEY("area_id","category_id","place_id")
);
--> statement-breakpoint
CREATE TABLE "discovery_requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "discovery_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"area_id" text NOT NULL,
	"category_id" text NOT NULL,
	"result_count" integer NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitor_areas" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"polygon_asset" text NOT NULL,
	"search_configuration" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
