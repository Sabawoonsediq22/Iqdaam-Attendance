import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fees, students, classes, notifications } from "@/lib/schema";
import { updateFeeSchema } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context;
  const { id } = await params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await db
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
      .innerJoin(classes, eq(fees.classId, classes.id))
      .where(eq(fees.id, id))
      .limit(1);

    if (data.length === 0) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Get fee error:", error);
    return NextResponse.json({ error: "Failed to fetch fee" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context;
  const { id } = await params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = updateFeeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    // Get current fee to calculate feeUnpaid if needed
    const currentFee = await db
      .select()
      .from(fees)
      .where(eq(fees.id, id))
      .limit(1);

    if (currentFee.length === 0) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    const { feePaid, feeUnpaid, paymentDate } = result.data;

    // Calculate feeUnpaid if not provided
    const calculatedFeeUnpaid =
      feeUnpaid != null && feeUnpaid !== ""
        ? feeUnpaid
        : feePaid != null && feePaid !== ""
        ? (
            parseFloat(currentFee[0].feeToBePaid) - parseFloat(feePaid!)
          ).toFixed(2)
        : currentFee[0].feeUnpaid;

    const updatedFee = await db
      .update(fees)
      .set({
        ...(feePaid != null && { feePaid }),
        ...(feeUnpaid != null && { feeUnpaid: calculatedFeeUnpaid }),
        ...(paymentDate != null && { paymentDate }),
      })
      .where(eq(fees.id, id))
      .returning();

    if (updatedFee.length === 0) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
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
      .where(eq(fees.id, id))
      .limit(1);

    if (feeDetails.length > 0) {
      await db.insert(notifications).values({
        title: "Fee Updated",
        message: `Fee updated for student **${feeDetails[0].studentName}** in class **${feeDetails[0].className}**.`,
        type: "fee",
        entityType: "fee",
        entityId: id,
      });
    }

    return NextResponse.json(updatedFee[0]);
  } catch (error) {
    console.error("Update fee error:", error);
    return NextResponse.json(
      { error: "Failed to update fee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context;
  const { id } = await params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deletedFee = await db.delete(fees).where(eq(fees.id, id)).returning();

    if (deletedFee.length === 0) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Fee deleted successfully" });
  } catch (error) {
    console.error("Delete fee error:", error);
    return NextResponse.json(
      { error: "Failed to delete fee" },
      { status: 500 }
    );
  }
}
