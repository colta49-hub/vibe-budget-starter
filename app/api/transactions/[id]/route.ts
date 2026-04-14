import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { date, description, amount, currency, bankId, categoryId, notes } = body;

    if (!date || !description || amount === undefined || amount === null || amount === "") {
      return NextResponse.json(
        { error: "Data, descrierea și suma sunt obligatorii" },
        { status: 400 }
      );
    }

    const [transaction] = await db
      .update(schema.transactions)
      .set({
        date,
        description,
        amount: Number(amount),
        currency: currency || "RON",
        bankId: bankId || null,
        categoryId: categoryId || null,
        notes: notes || null,
      })
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.userId, user.id)))
      .returning();

    if (!transaction) {
      return NextResponse.json({ error: "Tranzacția nu a fost găsită" }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("[TRANSACTIONS_PUT] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { categoryId } = body;

    const [transaction] = await db
      .update(schema.transactions)
      .set({ categoryId: categoryId || null })
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.userId, user.id)))
      .returning();

    if (!transaction) {
      return NextResponse.json({ error: "Tranzacția nu a fost găsită" }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("[TRANSACTIONS_PATCH] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const [transaction] = await db
      .delete(schema.transactions)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.userId, user.id)))
      .returning();

    if (!transaction) {
      return NextResponse.json({ error: "Tranzacția nu a fost găsită" }, { status: 404 });
    }

    return NextResponse.json({ message: "Tranzacție ștearsă cu succes" });
  } catch (error) {
    console.error("[TRANSACTIONS_DELETE] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
