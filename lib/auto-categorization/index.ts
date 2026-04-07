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
    if (normalizedDesc.includes(kw.keyword.toLowerCase())) {
      return kw.categoryId;
    }
  }

  return null;
}
