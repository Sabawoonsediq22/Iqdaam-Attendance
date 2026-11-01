ALTER TABLE "classes" ADD COLUMN "end_time" text;--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN IF EXISTS "status";
