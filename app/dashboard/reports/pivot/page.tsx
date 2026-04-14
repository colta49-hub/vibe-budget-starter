"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

interface TransactionRow {
  id: string;
  date: string;
  amount: number;
  currency: string;
  bankId: string | null;
  categoryId: string | null;
  bankName: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryType: string | null;
}

// Ani fiscali disponibili (2022 → 2030)
const FISCAL_YEARS = Array.from({ length: 2030 - 2022 + 1 }, (_, i) => 2022 + i);

// Generează lunile unui an fiscal UK: 6 apr year → 5 apr (year+1)
// Returnează ["year-04", "year-05", ..., "year-12", "(year+1)-01", ..., "(year+1)-03"]
function getFiscalYearMonths(startYear: number): string[] {
  const months: string[] = [];
  const pad = (n: number) => String(n).padStart(2, "0");
  // Apr → Dec din startYear
  for (let m = 4; m <= 12; m++) {
    months.push(`${startYear}-${pad(m)}`);
  }
  // Ian → Mar din startYear+1
  for (let m = 1; m <= 3; m++) {
    months.push(`${startYear + 1}-${pad(m)}`);
  }
  return months;
}

// An fiscal curent (cel mai recent cu date)
function getCurrentFiscalYear(): number {
  const now = new Date();
  return now.getMonth() > 3 || (now.getMonth() === 3 && now.getDate() >= 6)
    ? now.getFullYear() - 1
    : now.getFullYear() - 2;
}

function formatMonthLabel(ym: string): string {
  const MONTHS = ["Ian","Feb","Mar","Apr","Mai","Iun","Iul","Aug","Sep","Oct","Noi","Dec"];
  const [year, month] = ym.split("-");
  return `${MONTHS[parseInt(month) - 1]} ${year}`;
}

function fmt(value: number): string {
  return `£${Math.round(Math.abs(value)).toLocaleString()}`;
}

// Color coding bazat pe medie — 5 niveluri
function getHeatStyle(value: number, mean: number): { bg: string; color: string; label: string } {
  if (value === 0) return { bg: "transparent", color: "#d1d5db", label: "none" };
  if (mean === 0) return { bg: "rgba(239,68,68,0.1)", color: "#dc2626", label: "normal" };
  const ratio = value / mean;
  if (ratio > 1.5) return { bg: "rgba(239,68,68,0.18)", color: "#dc2626", label: "critic" };
  if (ratio > 1.2) return { bg: "rgba(251,146,60,0.18)", color: "#ea580c", label: "ridicat" };
  if (ratio >= 0.8) return { bg: "rgba(251,191,36,0.15)", color: "#ca8a04", label: "normal" };
  return { bg: "rgba(134,239,172,0.2)", color: "#16a34a", label: "sub" };
}

export default function PivotPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fiscalYear, setFiscalYear] = useState<number>(getCurrentFiscalYear());
  const [showPct, setShowPct] = useState(false);

  useEffect(() => {
    fetch("/api/transactions")
      .then((r) => r.json())
      .then((data) => setTransactions(data.transactions || []))
      .catch(() => toast.error("Eroare la încărcarea tranzacțiilor."))
      .finally(() => setLoading(false));
  }, []);

  const months = useMemo(() => getFiscalYearMonths(fiscalYear), [fiscalYear]);

  // Construiește matricea: pivot[categorie][luna] = { cheltuieli, count }
  // Reținem și icon-ul per categorie
  const { pivot, categories, categoryMeta } = useMemo(() => {
    const pivotMap: Record<string, Record<string, { cheltuieli: number; count: number }>> = {};
    const metaMap: Record<string, { icon: string | null; type: string | null }> = {};
    const monthSet = new Set(months);

    for (const t of transactions) {
      const ym = t.date.slice(0, 7);
      if (!monthSet.has(ym)) continue;
      if (t.amount >= 0) continue; // doar cheltuieli

      const cat = t.categoryName || "Necategorizat";
      if (!metaMap[cat]) {
        metaMap[cat] = { icon: t.categoryIcon, type: t.categoryType };
      }
      if (!pivotMap[cat]) {
        pivotMap[cat] = {};
        for (const m of months) {
          pivotMap[cat][m] = { cheltuieli: 0, count: 0 };
        }
      }
      pivotMap[cat][ym].cheltuieli += Math.abs(t.amount);
      pivotMap[cat][ym].count++;
    }

    // Sortează după total cheltuieli desc
    const cats = Object.keys(pivotMap).sort((a, b) => {
      const totalA = months.reduce((s, m) => s + (pivotMap[a][m]?.cheltuieli ?? 0), 0);
      const totalB = months.reduce((s, m) => s + (pivotMap[b][m]?.cheltuieli ?? 0), 0);
      return totalB - totalA;
    });

    return { pivot: pivotMap, categories: cats, categoryMeta: metaMap };
  }, [transactions, months]);

  // Media per categorie (pentru heat map)
  const categoryMeans = useMemo(() => {
    const means: Record<string, number> = {};
    for (const cat of categories) {
      const vals = months.map((m) => pivot[cat]?.[m]?.cheltuieli ?? 0).filter((v) => v > 0);
      means[cat] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }
    return means;
  }, [pivot, categories, months]);

  // Total + Medie per categorie
  const categoryTotals = useMemo(() => {
    return categories.map((cat) => {
      const total = months.reduce((s, m) => s + (pivot[cat]?.[m]?.cheltuieli ?? 0), 0);
      const totalCount = months.reduce((s, m) => s + (pivot[cat]?.[m]?.count ?? 0), 0);
      const activeMonths = months.filter((m) => (pivot[cat]?.[m]?.count ?? 0) > 0).length || 1;
      return { total, mean: total / activeMonths, totalCount };
    });
  }, [pivot, categories, months]);

  // Grand totals per lună
  const monthTotals = useMemo(() => {
    return months.map((m) => {
      let cheltuieli = 0, count = 0;
      for (const cat of categories) {
        cheltuieli += pivot[cat]?.[m]?.cheltuieli ?? 0;
        count += pivot[cat]?.[m]?.count ?? 0;
      }
      return { cheltuieli, count };
    });
  }, [pivot, categories, months]);

  const grandTotal = useMemo(
    () => monthTotals.reduce((s, t) => s + t.cheltuieli, 0),
    [monthTotals]
  );

  // Top creșteri / scăderi lună-peste-lună (ultimele 2 luni)
  const { topCresteri, topScaderi } = useMemo(() => {
    if (months.length < 2) return { topCresteri: [], topScaderi: [] };

    const lastM = months[months.length - 1];
    const prevM = months[months.length - 2];

    const changes = categories.map((cat) => {
      const prev = pivot[cat]?.[prevM]?.cheltuieli ?? 0;
      const curr = pivot[cat]?.[lastM]?.cheltuieli ?? 0;
      const pct = prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;
      return {
        cat,
        icon: categoryMeta[cat]?.icon ?? null,
        month: formatMonthLabel(lastM),
        pct,
        prev,
        curr,
      };
    }).filter((x) => x.prev > 0 || x.curr > 0);

    const sorted = [...changes].sort((a, b) => b.pct - a.pct);
    return {
      topCresteri: sorted.filter((x) => x.pct > 5).slice(0, 5),
      topScaderi: sorted.filter((x) => x.pct < -5).slice(0, 5),
    };
  }, [pivot, categories, months, categoryMeta]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Se încarcă...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
        <span className="text-5xl block mb-4">📊</span>
        <p className="text-gray-500 text-sm">Nu există tranzacții pentru raport.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raport Pivot - Categorii x Luni</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Selector luni */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 font-medium whitespace-nowrap">An fiscal:</label>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-xl px-4 py-2 text-gray-700 focus:outline-none bg-white cursor-pointer font-semibold"
              style={{ color: "#0d9488" }}
            >
              {FISCAL_YEARS.map((y) => (
                <option key={y} value={y}>{y}/{y + 1}</option>
              ))}
            </select>
          </div>

          {/* Toggle % */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setShowPct(!showPct)}
              className="w-10 h-5 rounded-full relative transition-colors cursor-pointer"
              style={{ backgroundColor: showPct ? "#6366f1" : "#d1d5db" }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: showPct ? "translateX(20px)" : "translateX(2px)" }}
              />
            </div>
            <span className="text-sm text-gray-600">Arată % față de luna anterioară</span>
          </label>

          <a href="/dashboard/reports" className="text-sm text-teal-600 hover:underline font-medium">
            ← Rapoarte
          </a>
        </div>
      </div>

      {/* Legendă color */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {[
          { bg: "rgba(239,68,68,0.18)", border: "#fca5a5", label: "Critic (>150%)" },
          { bg: "rgba(251,146,60,0.18)", border: "#fdba74", label: "Ridicat (120-150%)" },
          { bg: "rgba(251,191,36,0.15)", border: "#fde68a", label: "Normal (80-120%)" },
          { bg: "rgba(134,239,172,0.2)", border: "#86efac", label: "Sub medie (<80%)" },
          { bg: "#f9fafb", border: "#e5e7eb", label: "Fără cheltuieli" },
        ].map(({ bg, border, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-5 h-4 rounded"
              style={{ backgroundColor: bg, border: `1px solid ${border}` }}
            />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Tabel pivot */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-full" style={{ minWidth: `${200 + months.length * 120 + 200}px` }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th
                  className="sticky left-0 z-20 px-5 py-4 text-left font-semibold text-gray-600"
                  style={{ backgroundColor: "#f8fafc", minWidth: "190px", borderRight: "1px solid #e2e8f0" }}
                >
                  Categorie
                </th>
                {months.map((m) => (
                  <th
                    key={m}
                    className="px-4 py-4 text-center font-semibold text-gray-700"
                    style={{ minWidth: "110px" }}
                  >
                    {formatMonthLabel(m)}
                  </th>
                ))}
                <th
                  className="px-4 py-4 text-center font-bold text-gray-800"
                  style={{ minWidth: "100px", borderLeft: "2px solid #e2e8f0" }}
                >
                  Total
                </th>
                <th
                  className="px-4 py-4 text-center font-bold"
                  style={{ minWidth: "100px", color: "#6366f1" }}
                >
                  Medie/lună
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, catIdx) => {
                const meta = categoryMeta[cat];
                const mean = categoryMeans[cat];
                const totals = categoryTotals[catIdx];

                return (
                  <tr
                    key={cat}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Categorie */}
                    <td
                      className="sticky left-0 z-10 px-5 py-3"
                      style={{ backgroundColor: "#fff", borderRight: "1px solid #f1f5f9" }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {meta?.icon || "?"}
                        </span>
                        <span className="font-medium text-gray-800 text-sm truncate" style={{ maxWidth: "130px" }}>
                          {cat}
                        </span>
                      </div>
                    </td>

                    {/* Celule per lună */}
                    {months.map((m, mIdx) => {
                      const cell = pivot[cat]?.[m] ?? { cheltuieli: 0, count: 0 };
                      const { bg, color } = getHeatStyle(cell.cheltuieli, mean);

                      // % față de luna anterioară
                      let pctEl = null;
                      if (showPct && mIdx > 0) {
                        const prevVal = pivot[cat]?.[months[mIdx - 1]]?.cheltuieli ?? 0;
                        if (prevVal > 0 && cell.cheltuieli > 0) {
                          const pct = ((cell.cheltuieli - prevVal) / prevVal) * 100;
                          const isPos = pct > 0;
                          pctEl = (
                            <div
                              className="text-xs font-semibold mt-0.5"
                              style={{ color: isPos ? "#dc2626" : "#16a34a" }}
                            >
                              {isPos ? "+" : ""}{pct.toFixed(0)}%
                            </div>
                          );
                        }
                      }

                      return (
                        <td
                          key={m}
                          className="px-4 py-3 text-center"
                          style={{ backgroundColor: bg }}
                        >
                          {cell.cheltuieli > 0 ? (
                            <div>
                              <div className="font-bold" style={{ color, fontSize: "13px" }}>
                                {Math.round(cell.cheltuieli).toLocaleString()}
                              </div>
                              <div className="text-xs" style={{ color: "#94a3b8" }}>
                                {cell.count} tx
                              </div>
                              {pctEl}
                            </div>
                          ) : (
                            <span style={{ color: "#e5e7eb" }}>-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total */}
                    <td
                      className="px-4 py-3 text-center font-bold"
                      style={{
                        borderLeft: "2px solid #e2e8f0",
                        color: "#374151",
                        backgroundColor: "#f8fafc",
                        fontSize: "13px",
                      }}
                    >
                      {totals.total > 0 ? (
                        <div>
                          <div>£{Math.round(totals.total).toLocaleString()}</div>
                          <div className="text-xs font-normal" style={{ color: "#94a3b8" }}>
                            {totals.totalCount} tx
                          </div>
                        </div>
                      ) : "—"}
                    </td>

                    {/* Medie */}
                    <td
                      className="px-4 py-3 text-center font-semibold"
                      style={{ color: "#6366f1", backgroundColor: "#faf5ff", fontSize: "13px" }}
                    >
                      {totals.mean > 0 ? `£${Math.round(totals.mean).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                );
              })}

              {/* Rând TOTAL */}
              <tr style={{ borderTop: "2px solid #e2e8f0", backgroundColor: "#1e293b" }}>
                <td
                  className="sticky left-0 z-10 px-5 py-4 font-bold text-white"
                  style={{ backgroundColor: "#1e293b", borderRight: "1px solid #374151" }}
                >
                  TOTAL
                </td>
                {monthTotals.map((t, i) => (
                  <td key={months[i]} className="px-4 py-4 text-center" style={{ borderRight: "1px solid #334155" }}>
                    {t.cheltuieli > 0 ? (
                      <div>
                        <div className="font-bold text-red-300" style={{ fontSize: "13px" }}>
                          {Math.round(t.cheltuieli).toLocaleString()}
                        </div>
                        <div className="text-xs" style={{ color: "#64748b" }}>
                          {t.count} tx
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: "#475569" }}>—</span>
                    )}
                  </td>
                ))}
                <td
                  className="px-4 py-4 text-center font-bold text-red-300"
                  style={{ borderLeft: "2px solid #374151", backgroundColor: "#0f172a", fontSize: "14px" }}
                >
                  £{Math.round(grandTotal).toLocaleString()}
                </td>
                <td style={{ backgroundColor: "#0f172a" }} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Creșteri + Top Scăderi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Creșteri */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Top Creșteri Lunare</h3>
          {topCresteri.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nicio creștere semnificativă</p>
          ) : (
            <div className="space-y-3">
              {topCresteri.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 rounded-xl"
                  style={{ backgroundColor: "#f8fafc" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon || "?"}</span>
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{item.cat}</div>
                      <div className="text-xs text-gray-400">{item.month}</div>
                    </div>
                  </div>
                  <span
                    className="font-bold text-sm px-3 py-1 rounded-full"
                    style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                  >
                    +{item.pct.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Scăderi */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Top Scăderi Lunare</h3>
          {topScaderi.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nicio scădere semnificativă</p>
          ) : (
            <div className="space-y-3">
              {topScaderi.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 rounded-xl"
                  style={{ backgroundColor: "#f8fafc" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon || "?"}</span>
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{item.cat}</div>
                      <div className="text-xs text-gray-400">{item.month}</div>
                    </div>
                  </div>
                  <span
                    className="font-bold text-sm px-3 py-1 rounded-full"
                    style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}
                  >
                    {item.pct.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
