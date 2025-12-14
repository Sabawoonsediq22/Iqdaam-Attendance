import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fees, students, classes, notifications } from "@/lib/schema";
import { insertFeeSchema } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

type FeeWithDetails = {
  id: string;
  studentId: string;
  classId: string;
  feeToBePaid: string;
  feePaid: string | null;
  feeUnpaid: string | null;
  paymentDate: Date | null;
  createdAt: Date;
  studentName: string;
  fatherName: string;
  className: string;
  teacherName: string;
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");

    let data;

    const baseQuery = db
      .select({
        id: fees.id,
        studentId: fees.studentId,
        classId: fees.classId,
        feeToBePaid: fees.feeToBePaid,
        feePaid: fees.feePaid,
        feeUnpaid: fees.feeUnpaid,
        paymentDate: fees.paymentDate,
        createdAt: fees.createdAt,
        studentName: students.name,
        fatherName: students.fatherName,
        className: classes.name,
        teacherName: classes.teacher,
      })
      .from(fees)
      .innerJoin(students, eq(fees.studentId, students.id))
      .innerJoin(classes, eq(fees.classId, classes.id));

    if (studentId && classId) {
      data = (await baseQuery.where(
        and(eq(fees.studentId, studentId), eq(fees.classId, classId))
      )) as FeeWithDetails[];
    } else if (studentId) {
      data = (await baseQuery.where(
        eq(fees.studentId, studentId)
      )) as FeeWithDetails[];
    } else if (classId) {
      data = (await baseQuery.where(
        eq(fees.classId, classId)
      )) as FeeWithDetails[];
    } else {
      data = (await baseQuery) as FeeWithDetails[];
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get fees error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fees" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = insertFeeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    const { studentId, classId, feeToBePaid, feePaid, feeUnpaid, paymentDate } =
      result.data;

    // Calculate feeUnpaid if not provided
    const calculatedFeeUnpaid =
      feeUnpaid !== undefined && feeUnpaid !== ""
        ? feeUnpaid
        : feePaid
        ? (parseFloat(feeToBePaid) - parseFloat(feePaid)).toFixed(2)
        : feeToBePaid;

    // Check if fee already exists for this student and class
    const existingFee = await db
      .select()
      .from(fees)
      .where(and(eq(fees.studentId, studentId), eq(fees.classId, classId)))
      .limit(1);

    if (existingFee.length > 0) {
      // Update existing fee by adding to feeToBePaid
      const currentFee = existingFee[0];
      const newFeeToBePaid =
        parseFloat(currentFee.feeToBePaid) + parseFloat(feeToBePaid);
      const newFeePaid = feePaid
        ? parseFloat(currentFee.feePaid || "0") + parseFloat(feePaid)
        : parseFloat(currentFee.feePaid || "0");
      const newFeeUnpaid =
        calculatedFeeUnpaid !== undefined
          ? calculatedFeeUnpaid
          : (newFeeToBePaid - newFeePaid).toFixed(2);

      const updatedFee = await db
        .update(fees)
        .set({
          feeToBePaid: newFeeToBePaid.toFixed(2),
          ...(feePaid && { feePaid: newFeePaid.toFixed(2) }),
          feeUnpaid: newFeeUnpaid,
          ...(paymentDate && { paymentDate }),
        })
        .where(eq(fees.id, existingFee[0].id))
        .returning();

      // Get student and class names for notification
      const feeDetails = await db
        .select({
          studentName: students.name,
          className: classes.name,
        })
        .from(fees)
        .innerJoin(students, eq(fees.studentId, students.id))
        .innerJoin(classes, eq(fees.classId, classes.id))
        .where(eq(fees.id, updatedFee[0].id))
        .limit(1);

      if (feeDetails.length > 0) {
        await db.insert(notifications).values({
          title: "Fee Updated",
          message: `Fee updated for student **${
            feeDetails[0].studentName
          }** in class **${
            feeDetails[0].className
          }**. New amount: ${newFeeToBePaid.toFixed(2)}؋`,
          type: "fee",
          entityType: "fee",
          entityId: updatedFee[0].id,
        });
      }

      return NextResponse.json(updatedFee[0], { status: 200 });
    } else {
      // Create new fee
      const newFee = await db
        .insert(fees)
        .values({
          ...result.data,
          feeUnpaid: calculatedFeeUnpaid,
        })
        .returning();

      if (newFee.length === 0) {
        return NextResponse.json(
          { error: "Failed to create fee" },
          { status: 500 }
        );
      }

      // Get student and class names for notification
      const feeDetails = await db
        .select({
          studentName: students.name,
          className: classes.name,
        })
        .from(fees)
        .innerJoin(students, eq(fees.studentId, students.id))
        .innerJoin(classes, eq(fees.classId, classes.id))
        .where(eq(fees.id, newFee[0].id))
        .limit(1);

      if (feeDetails.length > 0) {
        await db.insert(notifications).values({
          title: "Fee Added",
          message: `Fee added for student **${feeDetails[0].studentName}** in class **${feeDetails[0].className}**. Amount: ${feeToBePaid}؋`,
          type: "fee",
          entityType: "fee",
          entityId: newFee[0].id,
        });
      }

      return NextResponse.json(newFee[0], { status: 201 });
    }
  } catch (error) {
    console.error("Create fee error:", error);
    return NextResponse.json(
      { error: "Failed to create fee" },
      { status: 500 }
    );
  }
}
