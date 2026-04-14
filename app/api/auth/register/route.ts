import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

const UK_BANKS = [
  { name: "Lloyds", color: "#006A4D" },
  { name: "HSBC", color: "#DB0011" },
  { name: "Barclays", color: "#00AEEF" },
  { name: "NatWest", color: "#5A0080" },
  { name: "Monzo", color: "#FF5631" },
  { name: "Starling", color: "#6935D3" },
  { name: "Revolut", color: "#0075EB" },
  { name: "Santander", color: "#EC0000" },
  { name: "Halifax", color: "#005A96" },
  { name: "Metro Bank", color: "#D50032" },
  { name: "Virgin Money", color: "#BE0030" },
  { name: "PayPal", color: "#003087" },
  { name: "Wise", color: "#9FE870" },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, nativeCurrency } = body;

    if (!name || !email || !password || !nativeCurrency) {
      return NextResponse.json(
        { error: "Toate câmpurile sunt obligatorii" },
        { status: 400 }
      );
    }

    if (!["GBP", "RON", "MDL", "EUR", "USD"].includes(nativeCurrency)) {
      return NextResponse.json(
        { error: "Moneda selectată nu este validă" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Eroare la înregistrare" },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Creează utilizatorul în baza de date
    await db.insert(schema.users).values({
      id: userId,
      email,
      name,
      nativeCurrency,
    });

    // Adaugă automat toate băncile UK principale
    await db.insert(schema.banks).values(
      UK_BANKS.map((bank) => ({
        userId,
        name: bank.name,
        color: bank.color,
      }))
    );

    return NextResponse.json(
      { message: "Cont creat cu succes" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
