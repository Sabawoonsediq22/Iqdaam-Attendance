import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  try {
    const avatarMap: { [key: string]: string } = {
      "1": "Asian_female_student_portrait_502d59e0.png",
      "2": "Hispanic_male_student_portrait_ed15762a.png",
      "3": "Black_female_student_portrait_d03e1376.png",
      "4": "Caucasian_male_student_portrait_5b888aac.png",
      "5": "Middle_Eastern_female_student_portrait_0f011387.png",
    };

    const avatarFile = avatarMap[id];
    if (!avatarFile) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    const avatarPath = path.join(
      process.cwd(),
      "public",
      "avatars",
      avatarFile
    );

    if (!fs.existsSync(avatarPath)) {
      return NextResponse.json(
        { error: "Avatar file not found" },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(avatarPath);
    const response = new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000",
      },
    });

    return response;
   } catch {
     return NextResponse.json(
       { error: "Failed to fetch avatar" },
       { status: 500 }
     );
   }
}
