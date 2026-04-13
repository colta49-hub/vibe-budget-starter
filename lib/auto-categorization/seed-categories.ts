/**
 * SEED CATEGORII PREDEFINITE
 *
 * Funcție apelată automat când un utilizator nu are nicio categorie.
 * Creează toate cele 12 categorii implicite cu isSystemCategory: true.
 */

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAllCategories } from "./categories-rules";

export async function seedDefaultCategories(userId: string): Promise<void> {
  // Verificare finală: nu duplicăm dacă userul are deja categorii
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
