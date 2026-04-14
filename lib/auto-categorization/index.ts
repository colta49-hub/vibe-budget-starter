import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function autoCategorize(
  description: string,
  userId: string
): Promise<string | null> {
  const keywords = await db
    .select()
    .from(schema.userKeywords)
    .where(eq(schema.userKeywords.userId, userId));

  const normalizedDesc = description.toLowerCase().trim();

  for (const kw of keywords) {
    const cleanKeyword = kw.keyword.toLowerCase().replace(/[,;]+$/g, "").trim();
    if (cleanKeyword && normalizedDesc.includes(cleanKeyword)) {
      return kw.categoryId;
    }
  }

  return null;
}
