import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

export async function POST(request: NextRequest) {
  try {
    const { fileKey }: { fileKey: string } = await request.json();

    if (!fileKey) {
      return NextResponse.json({ error: "No file key provided" }, { status: 400 });
    }

    const utapi = new UTApi();
    await utapi.deleteFiles([fileKey]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}