"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

interface TransactionRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  bankId: string | null;
  categoryId: string | null;
  bankName: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
}

interface Bank {
  id: string;
  name: string;
  color: string | null;
}

type Period = "month" | "3months" | "6months" | "all";

const COLORS = [
  "#0d9488", "#f97316", "#6366f1", "#ec4899", "#eab308",
  "#14b8a6", "#8b5cf6", "#ef4444", "#84cc16", "#06b6d4",
  "#f59e0b", "#10b981",
];

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "month", label: "Luna curentă" },
  { value: "3months", label: "Ultimele 3 luni" },
  { value: "6months", label: "Ultimele 6 luni" },
  { value: "all", label: "Tot" },
];

const MONTH_NAMES: Record<string, string> = {
  "01": "Ian", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "Mai", "06": "Iun", "07": "Iul", "08": "Aug",
  "09": "Sep", "10": "Oct", "11": "Noi", "12": "Dec",
};

function formatMonth(ym: string): string {
  const [year, month] = ym.split("-");
  return `${MONTH_NAMES[month] || month} ${year}`;
}

function getStartDate(period: Period): string {
  const now = new Date();
  if (period === "all") return "0000-00-00";
  if (period === "month") {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  }
  const months = period === "3months" ? 3 : 6;
  const d = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");
  const [filterBank, setFilterBank] = useState<string>("");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetchTransactions(), fetchBanks()]);
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch {
      toast.error("Eroare la încărcarea tranzacțiilor.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch("/api/banks");
      const data = await res.json();
      setBanks(data.banks || []);
    } catch {
      // ignorăm eroarea pentru bănci
    }
  };

  const handleAnalyzeAI = async () => {
    setAiLoading(true);
    setAiAnalysis("");
    try {
      const categorii = Object.entries(byCategoryMap).map(([category, total]) => ({
        category,
        total,
        count: expenses.filter((t) => (t.categoryName || "Necategorizat") === category).length,
      }));

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalCheltuieli,
          totalVenituri,
          sold,
          period,
          categorii,
          nrTranzactii: filtered.length,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiAnalysis(data.analysis);
    } catch {
      toast.error("Eroare la analiza AI. Verifică API key-ul.");
    } finally {
      setAiLoading(false);
    }
  };

  const startDate = getStartDate(period);
  const filtered = transactions
    .filter((t) => t.date >= startDate)
    .filter((t) => !filterBank || t.bankId === filterBank);
  const expenses = filtered.filter((t) => t.amount < 0);
  const income = filtered.filter((t) => t.amount > 0);

  const totalCheltuieli = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalVenituri = income.reduce((s, t) => s + t.amount, 0);
  const sold = totalVenituri - totalCheltuieli;

  // Date pie chart — cheltuieli pe categorii
  const byCategoryMap = expenses.reduce((acc, t) => {
    const key = t.categoryName || "Necategorizat";
    acc[key] = (acc[key] || 0) + Math.abs(t.amount);
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(byCategoryMap)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);

  // Date bar chart — cheltuieli pe luni
  const byMonthMap = expenses.reduce((acc, t) => {
    const month = t.date.slice(0, 7);
    acc[month] = (acc[month] || 0) + Math.abs(t.amount);
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(byMonthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({
      month: formatMonth(month),
      total: parseFloat(total.toFixed(2)),
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Se încarcă...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapoarte 📊</h1>
          <p className="text-gray-600 mt-1">Analiză vizuală a veniturilor și cheltuielilor</p>
          <a
            href="/dashboard/reports/pivot"
            className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-teal-600 hover:underline"
          >
            📅 Vezi raport pivot pe luni / ani →
          </a>
        </div>
        <button
          onClick={handleAnalyzeAI}
          disabled={aiLoading || transactions.length === 0}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#6366f1", color: "#fff" }}
        >
          {aiLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              Analizează...
            </>
          ) : (
            <>
              ✨ Analizează cheltuielile
            </>
          )}
        </button>
      </div>

      {/* Filtre perioadă */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
            style={
              period === opt.value
                ? { backgroundColor: "#0d9488", color: "#fff" }
                : { backgroundColor: "#f1f5f9", color: "#475569" }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filtre per bancă */}
      {banks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setFilterBank("")}
            className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
            style={
              !filterBank
                ? { backgroundColor: "#0d9488", color: "#fff" }
                : { backgroundColor: "#f1f5f9", color: "#475569" }
            }
          >
            Toate băncile
          </button>
          {banks.map((b) => (
            <button
              key={b.id}
              onClick={() => setFilterBank(filterBank === b.id ? "" : b.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              style={
                filterBank === b.id
                  ? { backgroundColor: b.color || "#6366f1", color: "#fff" }
                  : { backgroundColor: "#f1f5f9", color: "#475569" }
              }
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: b.color || "#6366f1" }}
              />
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Carduri sumar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5">
          <p className="text-xs text-gray-500 mb-1">Cheltuieli</p>
          <p className="text-2xl font-bold" style={{ color: "#ef4444" }}>
            £{totalCheltuieli.toFixed(2)}
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5">
          <p className="text-xs text-gray-500 mb-1">Venituri</p>
          <p className="text-2xl font-bold" style={{ color: "#16a34a" }}>
            £{totalVenituri.toFixed(2)}
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5">
          <p className="text-xs text-gray-500 mb-1">Sold net</p>
          <p
            className="text-2xl font-bold"
            style={{ color: sold >= 0 ? "#16a34a" : "#ef4444" }}
          >
            {sold >= 0 ? "+" : ""}£{sold.toFixed(2)}
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5">
          <p className="text-xs text-gray-500 mb-1">Tranzacții</p>
          <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
          <span className="text-5xl block mb-4">📊</span>
          <p className="text-gray-500 text-sm">
            Nicio tranzacție pentru perioada selectată.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart — cheltuieli pe categorii */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Cheltuieli pe categorii
            </h2>
            {pieData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">
                Nicio cheltuială în această perioadă.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={40}
                    dataKey="value"
                    label={(props: Record<string, unknown>) => {
                      const name = props.name as string;
                      const percent = (props.percent as number) ?? 0;
                      return percent > 0.04 ? `${name} ${(percent * 100).toFixed(0)}%` : "";
                    }}
                    labelLine={true}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`£${value.toFixed(2)}`, name]}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ fontSize: "12px", color: "#374151" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar Chart — cheltuieli pe luni */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Cheltuieli pe luni
            </h2>
            {barData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">
                Nicio cheltuială în această perioadă.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `£${v}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`£${value.toFixed(2)}`, "Cheltuieli"]}
                    cursor={{ fill: "#f0fdfa" }}
                  />
                  <Bar dataKey="total" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* AI Financial Coach rezultat */}
      {aiAnalysis && (
        <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-l-4" style={{ borderColor: "#6366f1" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🤖</span>
            <h2 className="text-lg font-semibold text-gray-900">AI Financial Coach</h2>
          </div>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {aiAnalysis}
          </div>
        </div>
      )}
    </div>
  );
}
