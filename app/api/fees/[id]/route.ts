import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fees, students, classes } from "@/lib/schema";
import { updateFeeSchema } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createNotification, notificationTemplates } from "@/lib/notifications";

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

    const { feeToBePaid, feePaid, feeUnpaid, paymentDate } = result.data;

    // Use the provided feeToBePaid or current one
    const finalFeeToBePaid =
      feeToBePaid != null && feeToBePaid !== ""
        ? feeToBePaid
        : currentFee[0].feeToBePaid;

    // Calculate feeUnpaid if not provided
    const calculatedFeeUnpaid =
      feeUnpaid != null && feeUnpaid !== ""
        ? feeUnpaid
        : feePaid != null && feePaid !== ""
        ? (parseFloat(finalFeeToBePaid) - parseFloat(feePaid!)).toFixed(2)
        : currentFee[0].feeUnpaid;

    const updatedFee = await db
      .update(fees)
      .set({
        ...(feeToBePaid != null && { feeToBePaid }),
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
      await createNotification({
        ...notificationTemplates.feeUpdated(
          feeDetails[0].studentName,
          feeDetails[0].className,
          session.user.name
        ),
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
