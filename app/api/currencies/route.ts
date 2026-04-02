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

    const currencies = await db
      .select()
      .from(schema.currencies)
      .where(eq(schema.currencies.userId, user.id));

    return NextResponse.json({ currencies });
  } catch (error) {
    console.error("[CURRENCIES_GET] Error:", error);
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
    const { code, name, symbol } = body;

    if (!code || !name || !symbol) {
      return NextResponse.json(
        { error: "Codul, numele și simbolul sunt obligatorii" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(schema.currencies)
      .where(
        and(
          eq(schema.currencies.userId, user.id),
          eq(schema.currencies.code, code.toUpperCase())
        )
      );

    if (existing) {
      return NextResponse.json(
        { error: "Valuta există deja" },
        { status: 409 }
      );
    }

    const [currency] = await db
      .insert(schema.currencies)
      .values({
        userId: user.id,
        code: code.toUpperCase(),
        name,
        symbol,
      })
      .returning();

    return NextResponse.json({ currency }, { status: 201 });
  } catch (error) {
    console.error("[CURRENCIES_POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
