import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function autoCategorize(
  description: string,
  userId: string,
  amount?: number
): Promise<string | null> {
  const keywords = await db
    .select()
    .from(schema.userKeywords)
    .where(eq(schema.userKeywords.userId, userId));

  const normalizedDesc = description.toLowerCase().trim();

  // 1. Încearcă matching pe keyword-uri specifice
  for (const kw of keywords) {
    const cleanKeyword = kw.keyword.toLowerCase().replace(/[,;]+$/g, "").trim();
    if (cleanKeyword === "*") continue; // sare peste wildcard-uri, le procesăm la final
    if (cleanKeyword && normalizedDesc.includes(cleanKeyword)) {
      return kw.categoryId;
    }
  }

  // 2. Fallback wildcard: dacă există keyword "*" și suma e pozitivă (venit)
  if (amount !== undefined && amount > 0) {
    const wildcard = keywords.find(
      (kw) => kw.keyword.trim().replace(/[,;]+$/g, "").trim() === "*"
    );
    if (wildcard) {
      return wildcard.categoryId;
    }
  }

  return null;
}
