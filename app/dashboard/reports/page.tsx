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

type Period = "month" | "3months" | "6months" | "all" | `fiscal-${number}`;

const COLORS = [
  "#0d9488", "#f97316", "#6366f1", "#ec4899", "#eab308",
  "#14b8a6", "#8b5cf6", "#ef4444", "#84cc16", "#06b6d4",
  "#f59e0b", "#10b981",
];

// Ani fiscali UK disponibili (2022/2023 → 2025/2026)
const FISCAL_YEARS = Array.from({ length: 2030 - 2022 + 1 }, (_, i) => 2022 + i);

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

function getDateRange(period: Period): { startDate: string; endDate: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  if (period === "all") return { startDate: "0000-00-00", endDate: "9999-12-31" };

  if (period === "month") {
    const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    return { startDate: start, endDate: "9999-12-31" };
  }

  if (period.startsWith("fiscal-")) {
    // An fiscal UK: fiscal-2025 = 2025-04-06 → 2026-04-05
    const y = Number(period.replace("fiscal-", ""));
    return { startDate: `${y}-04-06`, endDate: `${y + 1}-04-05` };
  }

  const months = period === "3months" ? 3 : 6;
  const d = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  return {
    startDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`,
    endDate: "9999-12-31",
  };
}

// Label mare (pie general) — nume + procent cu linie
const renderCustomLabel = ({
  cx, cy, midAngle, outerRadius, name, percent,
}: PieLabelRenderProps) => {
  if ((percent as number) < 0.03) return null;
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
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#9ca3af" fill="none" strokeWidth={1} />
      <circle cx={ex} cy={ey} r={2} fill="#9ca3af" />
      <text x={ex + (cos >= 0 ? 4 : -4)} y={ey} textAnchor={textAnchor} fill="#374151" fontSize={11} fontWeight={500}>
        {name}
      </text>
      <text x={ex + (cos >= 0 ? 4 : -4)} y={ey + 13} textAnchor={textAnchor} fill="#6b7280" fontSize={10}>
        {`${(pct * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

// Label mic (pie lunar) — doar procent, fără nume (spațiu limitat)
const renderSmallLabel = ({
  cx, cy, midAngle, outerRadius, percent,
}: PieLabelRenderProps) => {
  if ((percent as number) < 0.08) return null;
  const RADIAN = Math.PI / 180;
  const cxN = cx as number;
  const cyN = cy as number;
  const outerR = outerRadius as number;
  const angle = midAngle as number;
  const pct = percent as number;

  const sin = Math.sin(-RADIAN * angle);
  const cos = Math.cos(-RADIAN * angle);
  const sx = cxN + (outerR + 4) * cos;
  const sy = cyN + (outerR + 4) * sin;
  const ex = cxN + (outerR + 20) * cos;
  const ey = cyN + (outerR + 20) * sin;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#9ca3af" strokeWidth={1} />
      <text x={ex + (cos >= 0 ? 3 : -3)} y={ey + 4} textAnchor={textAnchor} fill="#6b7280" fontSize={9}>
        {`${(pct * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("fiscal-2025");
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

  const { startDate, endDate } = getDateRange(period);
  const filtered = transactions
    .filter((t) => t.date >= startDate && t.date <= endDate)
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

  // Date pie chart per lună — 12 luni fiscale fixe (Apr startYear → Mar startYear+1)
  // Pentru perioade non-fiscale, folosim lunile din tranzacții
  const fiscalMonths: string[] = (() => {
    if (period.startsWith("fiscal-")) {
      const y = Number(period.replace("fiscal-", ""));
      const pad = (n: number) => String(n).padStart(2, "0");
      const ms: string[] = [];
      // Apr(y) → Dec(y)
      for (let m = 4; m <= 12; m++) ms.push(`${y}-${pad(m)}`);
      // Ian(y+1) → Mar(y+1)
      for (let m = 1; m <= 3; m++) ms.push(`${y + 1}-${pad(m)}`);
      // Apr(y+1) — ultima lună fiscală, doar 1-5 apr
      ms.push(`${y + 1}-04`);
      return ms;
    }
    return Array.from(new Set(filtered.map((t) => t.date.slice(0, 7)))).sort();
  })();

  const piePerMonth = fiscalMonths.map((ym) => {
    // Filtru exact pentru prima și ultima lună fiscală
    const isFirstFiscalMonth = period.startsWith("fiscal-") && ym.endsWith("-04") && ym === startDate.slice(0, 7);
    const isLastFiscalMonth = period.startsWith("fiscal-") && ym.endsWith("-04") && ym === endDate.slice(0, 7);

    const monthExpenses = expenses.filter((t) => {
      if (!t.date.startsWith(ym)) return false;
      if (isFirstFiscalMonth && t.date < startDate) return false;
      if (isLastFiscalMonth && t.date > endDate) return false;
      return true;
    });
    const monthIncome = income.filter((t) => {
      if (!t.date.startsWith(ym)) return false;
      if (isFirstFiscalMonth && t.date < startDate) return false;
      if (isLastFiscalMonth && t.date > endDate) return false;
      return true;
    });
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
        >
          <optgroup label="Perioade">
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </optgroup>
          <optgroup label="An fiscal UK (6 apr → 5 apr)">
            {FISCAL_YEARS.map((y) => (
              <option key={y} value={`fiscal-${y}`}>{y}/{y + 1}</option>
            ))}
          </optgroup>
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
            style={{ color: sold >= 0 ? "#2563eb" : "#ef4444" }}
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
                  <PieChart margin={{ top: 15, right: 30, bottom: 15, left: 30 }}>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={25}
                      dataKey="value"
                      label={data.length > 0 ? renderSmallLabel : undefined}
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
