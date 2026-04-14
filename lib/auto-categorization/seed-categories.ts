/**
 * SEED CATEGORII PREDEFINITE
 *
 * Funcție apelată automat când un utilizator nu are nicio categorie.
 * Creează toate cele 12 categorii implicite cu isSystemCategory: true.
 */

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAllCategories } from "./categories-rules";

export async function seedDefaultCategories(userId: string): Promise<void> {
  const existing = await db
    .select({ id: schema.categories.id })
    .from(schema.categories)
    .where(eq(schema.categories.userId, userId))
    .limit(1);

  if (existing.length > 0) return;

  const defaultCategories = getAllCategories();

  await db.insert(schema.categories).values(
    defaultCategories.map((cat) => ({
      userId,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      description: cat.description,
      isSystemCategory: true,
    }))
  );
}

// Șterge categoriile de sistem vechi și le recreează cu lista actualizată
export async function resyncSystemCategories(userId: string): Promise<void> {
  await db
    .delete(schema.categories)
    .where(
      and(
        eq(schema.categories.userId, userId),
        eq(schema.categories.isSystemCategory, true)
      )
    );

  const defaultCategories = getAllCategories();

  await db.insert(schema.categories).values(
    defaultCategories.map((cat) => ({
      userId,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      description: cat.description,
      isSystemCategory: true,
    }))
  );
}
