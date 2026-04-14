import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { resyncSystemCategories } from "@/lib/auto-categorization/seed-categories";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await resyncSystemCategories(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CATEGORIES_RESYNC] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
