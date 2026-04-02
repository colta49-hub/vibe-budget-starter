import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

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

    if (!["RON", "MDL"].includes(nativeCurrency)) {
      return NextResponse.json(
        { error: "Moneda nativă trebuie să fie RON sau MDL" },
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

    await db.insert(schema.users).values({
      id: authData.user.id,
      email,
      name,
      nativeCurrency,
    });

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
