import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await db
      .select({
        id: schema.transactions.id,
        userId: schema.transactions.userId,
        bankId: schema.transactions.bankId,
        categoryId: schema.transactions.categoryId,
        date: schema.transactions.date,
        description: schema.transactions.description,
        amount: schema.transactions.amount,
        currency: schema.transactions.currency,
        createdAt: schema.transactions.createdAt,
        updatedAt: schema.transactions.updatedAt,
        bankName: schema.banks.name,
        bankColor: schema.banks.color,
        categoryName: schema.categories.name,
        categoryIcon: schema.categories.icon,
        categoryType: schema.categories.type,
      })
      .from(schema.transactions)
      .leftJoin(schema.banks, eq(schema.transactions.bankId, schema.banks.id))
      .leftJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
      .where(eq(schema.transactions.userId, user.id))
      .orderBy(desc(schema.transactions.date));

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("[TRANSACTIONS_GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, description, amount, currency, bankId, categoryId } = body;

    if (!date || !description || amount === undefined || amount === null || amount === "") {
      return NextResponse.json(
        { error: "Data, descrierea și suma sunt obligatorii" },
        { status: 400 }
      );
    }

    const [transaction] = await db
      .insert(schema.transactions)
      .values({
        userId: user.id,
        bankId: bankId || null,
        categoryId: categoryId || null,
        date,
        description,
        amount: Number(amount),
        currency: currency || "RON",
      })
      .returning();

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("[TRANSACTIONS_POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
