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
    const { name, icon } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Numele categoriei este obligatoriu" },
        { status: 400 }
      );
    }

    const [category] = await db
      .update(schema.categories)
      .set({ name, icon, updatedAt: new Date() })
      .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, user.id)))
      .returning();

    if (!category) {
      return NextResponse.json({ error: "Categoria nu a fost găsită" }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("[CATEGORIES_PUT] Error:", error);
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

    const [existing] = await db
      .select()
      .from(schema.categories)
      .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, user.id)));

    if (!existing) {
      return NextResponse.json({ error: "Categoria nu a fost găsită" }, { status: 404 });
    }

    if (existing.isSystemCategory) {
      return NextResponse.json(
        { error: "Categoriile sistem nu pot fi șterse" },
        { status: 403 }
      );
    }

    await db
      .delete(schema.categories)
      .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, user.id)));

    return NextResponse.json({ message: "Categorie ștearsă cu succes" });
  } catch (error) {
    console.error("[CATEGORIES_DELETE] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
