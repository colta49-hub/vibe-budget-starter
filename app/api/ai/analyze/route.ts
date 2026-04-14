import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCurrentUser } from "@/lib/auth/get-current-user";

interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

interface AnalyzeRequest {
  totalCheltuieli: number;
  totalVenituri: number;
  sold: number;
  period: string;
  categorii: CategorySummary[];
  nrTranzactii: number;
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AnalyzeRequest = await request.json();
    const { totalCheltuieli, totalVenituri, sold, period, categorii, nrTranzactii } = body;

    const periodLabel =
      period === "month" ? "luna curentă" :
      period === "3months" ? "ultimele 3 luni" :
      period === "6months" ? "ultimele 6 luni" :
      "toată perioada";

    const categoriiText = categorii
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map((c) => `- ${c.category}: £${c.total.toFixed(2)} (${c.count} tranzacții)`)
      .join("\n");

    const prompt = `Ești un coach financiar personal prietenos și empatic. Analizează datele financiare de mai jos și oferă un raport personalizat în română.

DATE FINANCIARE (${periodLabel}):
- Total cheltuieli: £${totalCheltuieli.toFixed(2)}
- Total venituri: £${totalVenituri.toFixed(2)}
- Sold net: ${sold >= 0 ? "+" : ""}£${sold.toFixed(2)}
- Număr tranzacții: ${nrTranzactii}

CHELTUIELI PE CATEGORII:
${categoriiText || "Nicio categorie disponibilă"}

Oferă un raport structurat cu:

1. **Health Score** (0-100) cu o explicație scurtă de 1-2 propoziții despre ce înseamnă scorul
2. **3 observații** concrete bazate pe datele reale (ce cheltuiești cel mai mult, cum e balanța, trend)
3. **1 observație pozitivă** (ceva bun în datele lor, chiar dacă e mic)
4. **3-5 sfaturi practice** personalizate bazate pe categoriile lor reale

Fii cald, încurajator și specific. Folosește datele reale, nu vorbi generic.
Răspunde DOAR în română. Fii concis (max 300 cuvinte total).`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ analysis: text });
  } catch (error) {
    console.error("[AI_ANALYZE] Error:", error);
    return NextResponse.json(
      { error: "Eroare la analiza AI" },
      { status: 500 }
    );
  }
}
