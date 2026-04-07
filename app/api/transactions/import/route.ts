import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { autoCategorize } from "@/lib/auto-categorization";

interface ImportTransaction {
  bankId?: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  type?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transactions } = body as { transactions: ImportTransaction[] };

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: "Array-ul de tranzacții este gol sau lipsește" },
        { status: 400 }
      );
    }

    let categorizedCount = 0;

    const values = await Promise.all(
      transactions.map(async (tx) => {
        const categoryId = await autoCategorize(tx.description, user.id);
        if (categoryId) categorizedCount++;

        return {
          userId: user.id,
          bankId: tx.bankId || null,
          categoryId,
          date: tx.date,
          description: tx.description,
          amount: Number(tx.amount),
          currency: tx.currency || "RON",
        };
      })
    );

    await db.insert(schema.transactions).values(values);

    return NextResponse.json(
      {
        message: `${values.length} tranzacții importate, ${categorizedCount} categorizate automat`,
        imported: values.length,
        categorized: categorizedCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[TRANSACTIONS_IMPORT] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
