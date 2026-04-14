"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

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

type Period = "month" | "3months" | "6months" | "12months" | "all";

const COLORS = [
  "#0d9488", "#f97316", "#6366f1", "#ec4899", "#eab308",
  "#14b8a6", "#8b5cf6", "#ef4444", "#84cc16", "#06b6d4",
  "#f59e0b", "#10b981",
];

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "month", label: "Luna curentă" },
  { value: "3months", label: "Ultimele 3 luni" },
  { value: "6months", label: "Ultimele 6 luni" },
  { value: "12months", label: "Ultimul an" },
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
  const months = period === "3months" ? 3 : period === "12months" ? 12 : 6;
  const d = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// Label cu linie de conexiune pe pie chart
const renderCustomLabel = ({
  cx, cy, midAngle, outerRadius, name, percent,
}: PieLabelRenderProps) => {
  if ((percent as number) < 0.03) return null; // ascunde feliile prea mici
  const RADIAN = Math.PI / 180;
  const cxN = cx as number;
  const cyN = cy as number;
  const outerR = outerRadius as number;
  const angle = midAngle as number;
  const pct = percent as number;

  const sin = Math.sin(-RADIAN * angle);
  const cos = Math.cos(-RADIAN * angle);
  const sx = cxN + (outerR + 6) * cos;
  const sy = cyN + (outerR + 6) * sin;
  const mx = cxN + (outerR + 22) * cos;
  const my = cyN + (outerR + 22) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 18;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke="#9ca3af"
        fill="none"
        strokeWidth={1}
      />
      <circle cx={ex} cy={ey} r={2} fill="#9ca3af" />
      <text
        x={ex + (cos >= 0 ? 4 : -4)}
        y={ey}
        textAnchor={textAnchor}
        fill="#374151"
        fontSize={11}
        fontWeight={500}
      >
        {name}
      </text>
      <text
        x={ex + (cos >= 0 ? 4 : -4)}
        y={ey + 13}
        textAnchor={textAnchor}
        fill="#6b7280"
        fontSize={10}
      >
        {`${(pct * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

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

  // Date pie chart per lună
  const allMonths = Array.from(new Set(filtered.map((t) => t.date.slice(0, 7)))).sort();
  const piePerMonth = allMonths.map((ym) => {
    const monthExpenses = expenses.filter((t) => t.date.startsWith(ym));
    const monthIncome = income.filter((t) => t.date.startsWith(ym));
    const catMap = monthExpenses.reduce((acc, t) => {
      const key = t.categoryName || "Necategorizat";
      acc[key] = (acc[key] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);
    const data = Object.entries(catMap)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
    const totalCh = monthExpenses.reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalVen = monthIncome.reduce((s, t) => s + t.amount, 0);
    const soldLuna = totalVen - totalCh;
    return { ym, label: formatMonth(ym), data, totalCh, totalVen, soldLuna };
  });

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
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-500 font-medium whitespace-nowrap">Perioadă:</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="text-sm border border-gray-200 rounded-xl px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 bg-white cursor-pointer"
          style={{ focusRingColor: "#0d9488" } as React.CSSProperties}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
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
              <ResponsiveContainer width="100%" height={400}>
                <PieChart margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={35}
                    dataKey="value"
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`£${value.toFixed(2)}`, name]}
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

      {/* Grafice cheltuieli per lună */}
      {piePerMonth.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cheltuieli pe categorii — per lună</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {piePerMonth.map(({ ym, label, data, totalCh, totalVen, soldLuna }) => (
              <div key={ym} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5">
                <h3 className="font-semibold text-gray-800 mb-3">{label}</h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Venituri</p>
                    <p className="text-sm font-bold" style={{ color: "#16a34a" }}>+£{totalVen.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Cheltuieli</p>
                    <p className="text-sm font-bold" style={{ color: "#ef4444" }}>-£{totalCh.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Net</p>
                    <p className="text-sm font-bold" style={{ color: soldLuna >= 0 ? "#2563eb" : "#ef4444" }}>
                      {soldLuna >= 0 ? "+" : ""}£{soldLuna.toFixed(2)}
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={25}
                      dataKey="value"
                      label={renderCustomLabel}
                      labelLine={false}
                    >
                      {data.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`£${value.toFixed(2)}`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ))}
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
