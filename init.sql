CREATE TABLE "chapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"story_id" integer NOT NULL,
	"parent_id" integer,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"prompt" text,
	"is_root" integer DEFAULT 0,
	"is_ending" integer DEFAULT 0,
	"path" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"story_id" integer NOT NULL,
	"name" text NOT NULL,
	"age" text,
	"background" text,
	"personality" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "continuation_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"chapter_id" integer NOT NULL,
	"title" text NOT NULL,
	"preview" text NOT NULL,
	"prompt" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"genre" text,
	"narrative_style" text,
	"setting" text,
	"target_audience" text,
	"main_character" text,
	"chapter_length" text DEFAULT '100-200' NOT NULL,
	"temperature" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "continuation_options" ADD CONSTRAINT "continuation_options_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE no action ON UPDATE no action;