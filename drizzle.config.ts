/**
 * CONFIGURAȚIE DRIZZLE KIT
 *
 * EXPLICAȚIE:
 * Drizzle Kit = Unealtă care ne ajută să "construim" tabele în baza de date.
 *
 * PROCES:
 * 1. Scriem schema (lib/db/schema.ts) - planul
 * 2. Drizzle Kit generează "migrări" - comenzi SQL pentru a crea tabelele
 * 3. Rulăm migrările - tabelele sunt create în baza de date
 *
 * E ca și cum ai avea planul casei (schema) și constructorii (migrations).
 */

import type { Config } from "drizzle-kit";

export default {
  // Unde sunt definițiile tabelelor noastre
  schema: "./lib/db/schema.ts",

  // Unde se salvează fișierele de migrare (SQL-ul generat automat)
  out: "./drizzle",

  // Ce tip de bază de date folosim (PostgreSQL - Supabase)
  dialect: "postgresql",

  // Conexiunea la baza de date
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Din .env.local
  },
} satisfies Config;
