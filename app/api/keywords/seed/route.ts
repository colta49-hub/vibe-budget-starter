import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

// Keywords predefinite pentru fiecare categorie (după nume)
// Bazate pe tranzacții reale din UK: Lloyds, Monzo, HSBC
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // VENITURI
  "Venituri Clienți": [
    "payment from", "transfer from", "faster payment", "sent from",
    "bacs credit", "online banking transfer",
  ],
  "Venituri Universeoftware": [
    "universeoftware", "universe of software", "booking app", "programari",
  ],
  "Venituri": [
    "salary", "salariu", "wages", "payroll", "dividend", "freelance",
    "income", "credit", "hmrc", "universal credit", "tax credit",
  ],

  // CHELTUIELI SALON
  "Chirie Salon": [
    "rent", "chirie", "landlord", "property", "studio rent", "salon rent",
    "lease",
  ],
  "Produse Salon": [
    "lash", "beauty supply", "extensii", "gene", "glue", "eyelash",
    "salon supplies", "beauty wholesale", "nouveau lashes", "lashbase",
    "beautify", "salon direct",
  ],
  "Produse Estetică": [
    "syringe", "acid hyaluronic", "botox", "filler", "dermal", "aesthetic",
    "mesoestetic", "revolax", "juvederm", "restylane", "teosyal",
    "hyaluronic", "cannula", "needle", "seringă",
  ],
  "Farmacie": [
    "pharmacy", "boots", "chemist", "lloyds pharmacy", "superdrug",
    "well pharmacy", "rowlands", "apotek", "farmacie", "medicamente",
  ],
  "eBay": [
    "ebay", "paypal ebay",
  ],
  "AliExpress": [
    "aliexpress", "alipay", "ali express",
  ],
  "Gunoi Medical": [
    "365 waste", "medical waste", "waste collection", "clinical waste",
    "sharps disposal", "biomedical", "stericycle", "deseuri", "gunoi",
  ],
  "Software & Apps": [
    "google", "apple", "microsoft", "adobe", "dropbox", "zoom",
    "icloud", "google workspace", "google one", "app store", "play store",
    "spotify premium", "notion", "slack", "github",
  ],
  "Aplicație Booking": [
    "universeoftware", "fresha", "treatwell", "timely", "booksy",
    "acuity", "square appointments", "vagaro", "phorest", "booking system",
  ],
  "Abonamente Lunare": [
    "netflix", "amazon prime", "disney+", "disney plus", "apple tv",
    "hbo", "paramount", "now tv", "sky", "subscription", "monthly plan",
    "recurring payment", "direct debit",
  ],
  "Colectare Deșeuri": [
    "waste", "recycling", "biffa", "suez", "veolia", "collection",
    "refuse", "dustbin",
  ],
  "Contabilitate": [
    "accountant", "accounting", "contabil", "hmrc", "self assessment",
    "tax return", "bookkeeping", "xero", "quickbooks", "sage",
    "companies house", "vat return",
  ],

  // CHELTUIELI PERSONALE
  "Utilități": [
    "council tax", "british gas", "edf", "eon", "npower", "octopus energy",
    "bulb", "thames water", "severn trent", "southern water",
    "electricity", "gas", "water", "utiliti", "energy",
    "bt broadband", "virgin media", "sky broadband", "internet",
  ],
  "Telefon & Mobile": [
    "giffgaff", "giff gaff", "o2", "ee", "vodafone", "three", "sky mobile",
    "tesco mobile", "talktalk", "bt mobile", "lebara", "lyca",
    "phone", "mobile", "sim",
  ],
  "Transport": [
    "uber", "bolt", "taxi", "cab", "tfl", "transport for london",
    "train", "national rail", "avanti", "gwr", "southern", "thameslink",
    "bus", "coach", "petrol", "shell", "bp", "esso", "texaco",
    "parking", "ncp", "ringgo", "paybyphone", "congestion",
  ],
  "Mâncare & Băuturi": [
    "tesco", "sainsbury", "sainsburys", "asda", "morrisons", "lidl",
    "aldi", "waitrose", "marks spencer", "m&s food", "co-op",
    "mcdonalds", "mcdonald", "kfc", "subway", "greggs", "costa",
    "starbucks", "pret", "itsu", "leon", "nando", "dominos",
    "deliveroo", "just eat", "uber eats",
    "restaurant", "cafe", "takeaway", "supermarket",
  ],
  "Sănătate": [
    "nhs", "gp", "doctor", "dentist", "hospital", "clinic",
    "optician", "specsavers", "vision express", "physio",
    "private health", "bupa", "axa health",
  ],
  "Educație": [
    "udemy", "coursera", "skillshare", "masterclass", "linkedin learning",
    "amazon books", "book", "curs", "training", "course",
    "college", "university", "tutoring",
  ],
  "Cash": [
    "atm", "cash machine", "withdrawal", "cashpoint", "cash", "retragere",
  ],
  "Taxe și Impozite": [
    "hmrc", "self assessment", "national insurance", "ni contribution",
    "vat", "income tax", "council tax", "stamp duty",
    "companies house", "corporation tax",
  ],
  "Alte Cheltuieli": [
    "amazon", "amzn", "etsy", "ikea", "argos", "next", "primark",
    "h&m", "zara", "currys", "john lewis", "dunelm", "b&q",
    "paypal",
  ],

  // TRANSFERURI
  "Transfer Intern": [
    "transfer to", "transfer from", "own account", "monzo", "revolut transfer",
    "starling", "internal transfer", "move money",
  ],
  "Transferuri": [
    "sent to", "transfer to", "bank transfer", "faster payment out",
    "standing order", "direct debit",
  ],
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Ia toate categoriile userului
    const userCategories = await db
      .select({ id: schema.categories.id, name: schema.categories.name })
      .from(schema.categories)
      .where(eq(schema.categories.userId, user.id));

    if (userCategories.length === 0) {
      return NextResponse.json({ message: "Nu ai categorii. Fă resync mai întâi.", added: 0 });
    }

    // 2. Ia keywords existente ca să nu duplicăm
    const existingKeywords = await db
      .select({ keyword: schema.userKeywords.keyword, categoryId: schema.userKeywords.categoryId })
      .from(schema.userKeywords)
      .where(eq(schema.userKeywords.userId, user.id));

    const existingSet = new Set(
      existingKeywords.map((k) => `${k.categoryId}::${k.keyword}`)
    );

    // 3. Construiește lista de keywords de inserat
    const toInsert: { userId: string; keyword: string; categoryId: string }[] = [];

    for (const category of userCategories) {
      const keywords = CATEGORY_KEYWORDS[category.name];
      if (!keywords) continue;

      for (const kw of keywords) {
        const key = `${category.id}::${kw}`;
        if (!existingSet.has(key)) {
          toInsert.push({
            userId: user.id,
            keyword: kw,
            categoryId: category.id,
          });
        }
      }
    }

    // 4. Inserează în batch
    if (toInsert.length > 0) {
      await db.insert(schema.userKeywords).values(toInsert);
    }

    return NextResponse.json({
      success: true,
      added: toInsert.length,
      message: `${toInsert.length} keywords adăugate automat.`,
    });
  } catch (error) {
    console.error("[KEYWORDS_SEED] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
