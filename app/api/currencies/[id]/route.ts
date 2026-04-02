import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [currency] = await db
      .delete(schema.currencies)
      .where(and(eq(schema.currencies.id, id), eq(schema.currencies.userId, user.id)))
      .returning();

    if (!currency) {
      return NextResponse.json({ error: "Valuta nu a fost găsită" }, { status: 404 });
    }

    return NextResponse.json({ message: "Valută ștearsă cu succes" });
  } catch (error) {
    console.error("[CURRENCIES_DELETE] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
