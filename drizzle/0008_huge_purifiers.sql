ALTER TABLE "classes" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" DROP COLUMN "day";--> statement-breakpoint
ALTER TABLE "attendance" DROP COLUMN "month";--> statement-breakpoint
ALTER TABLE "attendance" DROP COLUMN "year";--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "unique_attendance_class_student_date" UNIQUE("class_id","student_id","date");