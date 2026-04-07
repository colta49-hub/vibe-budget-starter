import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, gte, lte, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const userRows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, authUser.id))
    .limit(1);

  const user = userRows[0];

  if (!user) {
    redirect("/login");
  }

  const currencySymbol = (code: string) => {
    const map: Record<string, string> = { GBP: "£", EUR: "€", USD: "$", RON: "RON", MDL: "MDL" };
    return map[code] ?? code;
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const firstDay = `${year}-${month}-01`;
  const lastDayDate = new Date(year, now.getMonth() + 1, 0).getDate();
  const lastDay = `${year}-${month}-${String(lastDayDate).padStart(2, "0")}`;

  const [totalResult, monthlyTransactions] = await Promise.all([
    db.select({ count: count() }).from(schema.transactions).where(eq(schema.transactions.userId, user.id)),
    db.select({ amount: schema.transactions.amount }).from(schema.transactions).where(
      and(
        eq(schema.transactions.userId, user.id),
        gte(schema.transactions.date, firstDay),
        lte(schema.transactions.date, lastDay)
      )
    ),
  ]);

  const totalTransactions = totalResult[0]?.count ?? 0;

  const totalExpenses = monthlyTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalIncome = monthlyTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthNames = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
  const currentMonth = monthNames[now.getMonth()];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bună ziua, {user.name}! 👋
        </h1>
        <p className="text-gray-600 mt-1">Rezumatul tău financiar pentru {currentMonth} {year}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <p className="text-sm text-gray-500 font-medium">Total Tranzacții</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalTransactions}</p>
          <p className="text-xs text-gray-400 mt-1">toate timpurile</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <p className="text-sm text-gray-500 font-medium">Venituri {currentMonth}</p>
          <p className="text-3xl font-bold text-teal-600 mt-2">
            {currencySymbol(user.nativeCurrency)}{totalIncome.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">luna curentă</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <p className="text-sm text-gray-500 font-medium">Cheltuieli {currentMonth}</p>
          <p className="text-3xl font-bold text-orange-500 mt-2">
            -{currencySymbol(user.nativeCurrency)}{totalExpenses.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">luna curentă</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Grafic Cheltuieli</h2>
        <div className="h-48 bg-gradient-to-br from-teal-50 to-orange-50 rounded-xl flex items-center justify-center border border-dashed border-teal-200">
          <div className="text-center">
            <span className="text-4xl">📊</span>
            <p className="text-gray-500 mt-2 text-sm">Graficul va fi adăugat în curând</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/transactions" className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow flex items-center gap-4">
          <span className="text-3xl">📊</span>
          <div>
            <h3 className="font-semibold text-gray-900">Tranzacții</h3>
            <p className="text-sm text-gray-500">Gestionează tranzacțiile</p>
          </div>
        </Link>

        <Link href="/dashboard/banks" className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow flex items-center gap-4">
          <span className="text-3xl">🏦</span>
          <div>
            <h3 className="font-semibold text-gray-900">Bănci</h3>
            <p className="text-sm text-gray-500">Conturile tale bancare</p>
          </div>
        </Link>

        <Link href="/dashboard/categories" className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow flex items-center gap-4">
          <span className="text-3xl">📁</span>
          <div>
            <h3 className="font-semibold text-gray-900">Categorii</h3>
            <p className="text-sm text-gray-500">Organizează cheltuielile</p>
          </div>
        </Link>

        <Link href="/dashboard/currencies" className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow flex items-center gap-4">
          <span className="text-3xl">💱</span>
          <div>
            <h3 className="font-semibold text-gray-900">Valute</h3>
            <p className="text-sm text-gray-500">Gestionează valutele</p>
          </div>
        </Link>

        <Link href="/dashboard/upload" className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow flex items-center gap-4">
          <span className="text-3xl">📂</span>
          <div>
            <h3 className="font-semibold text-gray-900">Upload</h3>
            <p className="text-sm text-gray-500">Importă din CSV / Excel</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
