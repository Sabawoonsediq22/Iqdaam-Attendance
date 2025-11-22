CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"entity_type" text,
	"entity_id" varchar,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar
);
--> statement-breakpoint
ALTER TABLE "students" DROP CONSTRAINT "students_student_id_unique";--> statement-breakpoint
ALTER TABLE "students" DROP CONSTRAINT "students_email_unique";--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "student_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "father_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "day" text NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "month" text NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "year" text NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "gender" text NOT NULL;