import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const utapi = new UTApi();
    const uploadResult = await utapi.uploadFiles([file]);

    if (!uploadResult || !uploadResult[0] || uploadResult[0].error || !uploadResult[0].data) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    return NextResponse.json({ url: uploadResult[0].data.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}