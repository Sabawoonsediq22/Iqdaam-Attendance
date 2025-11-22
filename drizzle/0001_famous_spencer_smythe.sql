CREATE TABLE "report_attendance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" varchar NOT NULL,
	"attendance_id" varchar NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"generated_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_student_id_students_id_fk";
--> statement-breakpoint
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_class_id_classes_id_fk";
--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "teacher" text NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "time" text NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "start_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "father_name" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "report_attendance" ADD CONSTRAINT "report_attendance_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_attendance" ADD CONSTRAINT "report_attendance_attendance_id_attendance_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_students_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN "subject";--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_email_unique" UNIQUE("email");