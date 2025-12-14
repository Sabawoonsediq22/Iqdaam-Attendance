CREATE TABLE "fees" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"class_id" varchar NOT NULL,
	"fee_to_be_paid" numeric(10, 2) NOT NULL,
	"fee_paid" numeric(10, 2),
	"payment_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_student_class_fee" UNIQUE("student_id","class_id")
);
--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "fee" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "fees" ADD CONSTRAINT "fees_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "fees" ADD CONSTRAINT "fees_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE cascade;