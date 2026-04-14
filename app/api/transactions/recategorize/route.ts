import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { autoCategorize } from "@/lib/auto-categorization";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ia TOATE tranzacțiile userului (nu doar cele fără categorie)
    const uncategorized = await db
      .select({ id: schema.transactions.id, description: schema.transactions.description, amount: schema.transactions.amount })
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, user.id));

    if (uncategorized.length === 0) {
      return NextResponse.json({ success: true, updated: 0, message: "Nu există tranzacții." });
    }

    let updated = 0;

    for (const tx of uncategorized) {
      const categoryId = await autoCategorize(tx.description, user.id, tx.amount);
      if (categoryId) {
        await db
          .update(schema.transactions)
          .set({ categoryId })
          .where(eq(schema.transactions.id, tx.id));
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      total: uncategorized.length,
      updated,
      skipped: uncategorized.length - updated,
      message: `${updated} din ${uncategorized.length} tranzacții categorizate automat.`,
    });
  } catch (error) {
    console.error("[TRANSACTIONS_RECATEGORIZE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
