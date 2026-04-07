import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    const keywords = await db
      .select()
      .from(schema.userKeywords)
      .where(
        categoryId
          ? and(
              eq(schema.userKeywords.userId, user.id),
              eq(schema.userKeywords.categoryId, categoryId)
            )
          : eq(schema.userKeywords.userId, user.id)
      );

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("[KEYWORDS_GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, categoryId } = body as { keyword: string; categoryId: string };

    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: "Keyword-ul este obligatoriu" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Categoria este obligatorie" }, { status: 400 });
    }

    const [newKeyword] = await db
      .insert(schema.userKeywords)
      .values({
        userId: user.id,
        keyword: keyword.trim().toLowerCase(),
        categoryId,
      })
      .returning();

    return NextResponse.json({ keyword: newKeyword }, { status: 201 });
  } catch (error) {
    console.error("[KEYWORDS_POST] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
