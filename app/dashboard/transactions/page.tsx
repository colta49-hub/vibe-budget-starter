"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Bank, Category } from "@/lib/db/schema";

interface TransactionRow {
  id: string;
  userId: string;
  bankId: string | null;
  categoryId: string | null;
  date: string;
  description: string;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  bankName: string | null;
  bankColor: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryType: string | null;
  notes: string | null;
}

interface TransactionForm {
  date: string;
  description: string;
  amount: string;
  currency: string;
  bankId: string;
  categoryId: string;
  notes: string;
}

const today = () => new Date().toISOString().split("T")[0];

function getCategoryColor(type: string | null | undefined): string {
  if (type === "income") return "#16a34a";
  if (type === "transfer") return "#2563eb";
  if (type === "expense") return "#ef4444";
  return "#6b7280";
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [recategorizing, setRecategorizing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);

  const [form, setForm] = useState<TransactionForm>({
    date: today(),
    description: "",
    amount: "",
    currency: "RON",
    bankId: "",
    categoryId: "",
    notes: "",
  });

  const [search, setSearch] = useState("");
  const [filterBank, setFilterBank] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [tRes, bRes, cRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/banks"),
        fetch("/api/categories"),
      ]);

      const [tData, bData, cData] = await Promise.all([
        tRes.json(),
        bRes.json(),
        cRes.json(),
      ]);

      setTransactions(tData.transactions || []);
      setBanks(bData.banks || []);
      setCategories(cData.categories || []);
    } catch {
      toast.error("Eroare la încărcarea datelor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          description: form.description,
          amount: Number(form.amount),
          currency: form.currency,
          bankId: form.bankId || null,
          categoryId: form.categoryId || null,
          notes: form.notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la salvare.");
        return;
      }

      await fetchAll();
      toast.success("Tranzacție adăugată cu succes!");
      handleCancel();
    } catch {
      toast.error("Eroare de conexiune. Încearcă din nou.");
    } finally {
      setSaving(false);
    }
  };

  const handleRecategorize = async () => {
    setRecategorizing(true);
    try {
      const res = await fetch("/api/transactions/recategorize", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      await fetchAll();
    } catch {
      toast.error("Eroare la recategorizare.");
    } finally {
      setRecategorizing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ești sigur că vrei să ștergi această tranzacție?")) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la ștergere.");
        return;
      }

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tranzacție ștearsă cu succes!");
    } catch {
      toast.error("Eroare de conexiune. Încearcă din nou.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Ești sigur că vrei să ștergi ${selectedIds.size} tranzacții selectate?`)) return;
    setDeletingSelected(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/transactions/${id}`, { method: "DELETE" })
        )
      );
      setTransactions((prev) => prev.filter((t) => !selectedIds.has(t.id)));
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} tranzacții șterse.`);
    } catch {
      toast.error("Eroare la ștergere.");
    } finally {
      setDeletingSelected(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((t) => t.id)));
    }
  };

  const handleEdit = (t: TransactionRow) => {
    setEditingTransaction(t);
    setForm({
      date: t.date,
      description: t.description,
      amount: String(t.amount),
      currency: t.currency,
      bankId: t.bankId || "",
      categoryId: t.categoryId || "",
      notes: t.notes || "",
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          description: form.description,
          amount: Number(form.amount),
          currency: form.currency,
          bankId: form.bankId || null,
          categoryId: form.categoryId || null,
          notes: form.notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la salvare.");
        return;
      }

      await fetchAll();
      toast.success("Tranzacție actualizată cu succes!");
      handleCancel();
    } catch {
      toast.error("Eroare de conexiune. Încearcă din nou.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
    setForm({ date: today(), description: "", amount: "", currency: "RON", bankId: "", categoryId: "", notes: "" });
  };

  const hasFilters = !!(search || filterBank || filterCategory || filterDateFrom || filterDateTo);

  const filtered = transactions
    .filter((t) => !search || t.description.toLowerCase().includes(search.toLowerCase()))
    .filter((t) => !filterBank || t.bankId === filterBank)
    .filter((t) => !filterCategory || t.categoryId === filterCategory)
    .filter((t) => !filterDateFrom || t.date >= filterDateFrom)
    .filter((t) => !filterDateTo || t.date <= filterDateTo);

  const totalVenituri = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalCheltuieli = filtered.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const sold = totalVenituri - totalCheltuieli;

  const setFiscalYear = (year: number) => {
    setFilterDateFrom(`${year}-04-06`);
    setFilterDateTo(`${year + 1}-04-05`);
  };

  const exportCSV = () => {
    const header = ["Data", "Descriere", "Categorie", "Banca", "Suma", "Valuta"];
    const rows = filtered.map((t) => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.categoryName || "",
      t.bankName || "",
      t.amount.toFixed(2),
      t.currency,
    ]);
    const totalVenituri = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalCheltuieli = filtered.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const soldNet = totalVenituri - totalCheltuieli;
    // Valuta majoritară din tranzacțiile filtrate
    const currencyCount: Record<string, number> = {};
    filtered.forEach((t) => { currencyCount[t.currency] = (currencyCount[t.currency] || 0) + 1; });
    const dominantCurrency = Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "RON";
    const summary = [
      [],
      ["SUMAR", "", "", "", "", ""],
      ["Total venituri", "", "", "", totalVenituri.toFixed(2), dominantCurrency],
      ["Total cheltuieli", "", "", "", `-${totalCheltuieli.toFixed(2)}`, dominantCurrency],
      ["Sold net", "", "", "", soldNet.toFixed(2), dominantCurrency],
    ];
    const csv = [header, ...rows, ...summary].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tranzactii-${filterDateFrom || "toate"}-${filterDateTo || ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Tranzacții");

    // Header
    sheet.columns = [
      { header: "Data", key: "date", width: 14 },
      { header: "Descriere", key: "description", width: 40 },
      { header: "Categorie", key: "category", width: 20 },
      { header: "Bancă", key: "bank", width: 14 },
      { header: "Sumă", key: "amount", width: 14 },
      { header: "Valută", key: "currency", width: 10 },
    ];

    // Header styling
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D9488" } };
    });

    // Rows
    filtered.forEach((t) => {
      const row = sheet.addRow({
        date: t.date,
        description: t.description,
        category: t.categoryName || "",
        bank: t.bankName || "",
        amount: t.amount,
        currency: t.currency,
      });
      const amountCell = row.getCell("amount");
      if (t.amount > 0) {
        amountCell.font = { bold: true, color: { argb: "FF16A34A" } };
      } else {
        amountCell.font = { bold: true, color: { argb: "FFEF4444" } };
      }
    });

    // Sumar
    const totalVenituri = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalCheltuieli = filtered.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const soldNet = totalVenituri - totalCheltuieli;
    // Valuta majoritară din tranzacțiile filtrate
    const currencyCount: Record<string, number> = {};
    filtered.forEach((t) => { currencyCount[t.currency] = (currencyCount[t.currency] || 0) + 1; });
    const dominantCurrency = Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "RON";

    sheet.addRow([]);
    const r1 = sheet.addRow(["Total venituri", "", "", "", totalVenituri, dominantCurrency]);
    r1.getCell(1).font = { bold: true };
    r1.getCell(5).font = { bold: true, color: { argb: "FF16A34A" } };

    const r2 = sheet.addRow(["Total cheltuieli", "", "", "", -totalCheltuieli, dominantCurrency]);
    r2.getCell(1).font = { bold: true };
    r2.getCell(5).font = { bold: true, color: { argb: "FFEF4444" } };

    const r3 = sheet.addRow(["Sold net", "", "", "", soldNet, dominantCurrency]);
    r3.getCell(1).font = { bold: true };
    r3.getCell(5).font = { bold: true, color: { argb: "FF2563EB" } }; // albastru pentru sold net

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tranzactii-${filterDateFrom || "toate"}-${filterDateTo || ""}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Se încarcă...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tranzacții 📊</h1>
          <p className="text-gray-600 mt-1">Istoricul și gestionarea tranzacțiilor</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deletingSelected}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" }}
            >
              {deletingSelected ? "⏳ Se șterge..." : `🗑️ Șterge ${selectedIds.size} selectate`}
            </button>
          )}
          <button
            onClick={handleRecategorize}
            disabled={recategorizing}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac" }}
          >
            {recategorizing ? "⏳ Se procesează..." : "🔄 Recategorizează automat"}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Adaugă tranzacție
          </button>
        </div>
      </div>

      {/* Filtrare rapidă per bancă */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setFilterBank("")}
          className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
          style={!filterBank ? { backgroundColor: "#0d9488", color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#475569" }}
        >
          Toate băncile
        </button>
        {banks.map((b) => (
          <button
            key={b.id}
            onClick={() => setFilterBank(filterBank === b.id ? "" : b.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            style={filterBank === b.id
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

      {/* Filtre */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
        {/* Shortcut-uri an fiscal UK */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-medium">An fiscal UK:</span>
          <select
            onChange={(e) => e.target.value && setFiscalYear(Number(e.target.value))}
            defaultValue=""
            className="text-xs border border-teal-300 text-teal-700 px-3 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white cursor-pointer"
          >
            <option value="" disabled>Alege anul...</option>
            {Array.from({ length: 2030 - 2022 + 1 }, (_, i) => 2022 + i).map((y) => (
              <option key={y} value={y}>{y}/{y + 1}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400">(6 Apr — 5 Apr)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută după descriere..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          <select
            value={filterBank}
            onChange={(e) => setFilterBank(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Toate băncile</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Toate categoriile</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 shrink-0">De la</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 shrink-0">Până la</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            onClick={() => { setSearch(""); setFilterBank(""); setFilterCategory(""); setFilterDateFrom(""); setFilterDateTo(""); }}
            className="border border-gray-300 hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ✕ Resetează filtre
          </button>
        </div>
      </div>

      {/* Modal editare */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={handleCancel} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Editează tranzacție</h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="px-6 py-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valută</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="RON">RON</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ex: Mega Image, Salariu..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sumă <span className="text-gray-400 font-normal">(negativ = cheltuială)</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="-45.50 sau 500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bancă <span className="text-gray-400 font-normal">(opț.)</span></label>
                  <select
                    value={form.bankId}
                    onChange={(e) => setForm({ ...form, bankId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Fără bancă</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categorie <span className="text-gray-400 font-normal">(opț.)</span></label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Fără categorie</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notițe <span className="text-gray-400 font-normal">(opț.)</span></label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ex: factură curent electric, client X, abonament..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100 mt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? "Se salvează..." : "Salvează modificările"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Anulează
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal adăugare */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={handleCancel} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Adaugă tranzacție</h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valută</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="RON">RON</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ex: Mega Image, Salariu..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sumă <span className="text-gray-400 font-normal">(negativ = cheltuială)</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="-45.50 sau 500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bancă <span className="text-gray-400 font-normal">(opț.)</span></label>
                  <select
                    value={form.bankId}
                    onChange={(e) => setForm({ ...form, bankId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Fără bancă</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categorie <span className="text-gray-400 font-normal">(opț.)</span></label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Fără categorie</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notițe <span className="text-gray-400 font-normal">(opț.)</span></label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ex: factură curent electric, client X, abonament..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100 mt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? "Se salvează..." : "Salvează"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Anulează
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sumar + Export */}
      {filtered.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Venituri</p>
                <p className="text-lg font-bold" style={{ color: "#16a34a" }}>+£{totalVenituri.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Cheltuieli</p>
                <p className="text-lg font-bold" style={{ color: "#ef4444" }}>-£{totalCheltuieli.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Sold net</p>
                <p className="text-lg font-bold" style={{ color: sold >= 0 ? "#16a34a" : "#ef4444" }}>
                  {sold >= 0 ? "+" : ""}£{sold.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Tranzacții</p>
                <p className="text-lg font-bold text-gray-900">{filtered.length}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportExcel}
                className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                style={{ backgroundColor: "#16a34a" }}
              >
                📊 Exportă Excel
              </button>
              <button
                onClick={exportCSV}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                📥 Exportă CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabel */}
      {filtered.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
          <span className="text-5xl">📊</span>
          <p className="text-gray-600 mt-4 text-lg">
            {hasFilters ? "Nicio tranzacție găsită pentru filtrele selectate." : "Nu ai nicio tranzacție încă."}
          </p>
          {!hasFilters && (
            <p className="text-gray-400 text-sm mt-1">Apasă "+ Adaugă tranzacție" pentru a începe.</p>
          )}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {filtered.length} tranzacț{filtered.length === 1 ? "ie" : "ii"}
              {hasFilters && transactions.length !== filtered.length && ` din ${transactions.length}`}
              {selectedIds.size > 0 && ` · ${selectedIds.size} selectate`}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedIds(new Set(filtered.map((t) => t.id)))}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                Selectează toate {filtered.length}
              </button>
              <span className="text-gray-200">|</span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
              >
                Deselectează toate
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 accent-teal-600 cursor-pointer"
                    />
                  </th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4 w-32">Data</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Descriere</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Categorie</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Bancă</th>
                  <th className="text-right text-sm font-medium text-gray-500 px-6 py-4 w-36">Sumă</th>
                  <th className="text-right text-sm font-medium text-gray-500 px-6 py-4 w-36">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className={`border-b border-gray-50 transition-colors ${selectedIds.has(t.id) ? "bg-red-50/50" : "hover:bg-gray-50/50"}`}>
                    <td className="px-4 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleSelect(t.id)}
                        className="w-4 h-4 rounded border-gray-300 accent-teal-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 w-32">
                      <span className="text-sm text-gray-600">{t.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{t.description}</span>
                      {t.notes && (
                        <span title={t.notes} className="ml-1 cursor-help text-xs">📝</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {t.categoryName ? (
                        <select
                          value={t.categoryId || ""}
                          onChange={async (e) => {
                            const categoryId = e.target.value || null;
                            const cat = categories.find((c) => c.id === categoryId);
                            try {
                              await fetch(`/api/transactions/${t.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ categoryId }),
                              });
                              setTransactions((prev) =>
                                prev.map((tx) =>
                                  tx.id === t.id
                                    ? {
                                        ...tx,
                                        categoryId,
                                        categoryName: cat?.name || null,
                                        categoryIcon: cat?.icon || null,
                                        categoryType: cat?.type || null,
                                      }
                                    : tx
                                )
                              );
                            } catch {
                              toast.error("Eroare la salvarea categoriei.");
                            }
                          }}
                          style={{ color: getCategoryColor(t.categoryType), fontWeight: 600, borderColor: getCategoryColor(t.categoryType) }}
                          className="text-sm border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                        >
                          <option value="">— fără categorie —</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.icon} {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value=""
                          onChange={async (e) => {
                            const categoryId = e.target.value || null;
                            if (!categoryId) return;
                            const cat = categories.find((c) => c.id === categoryId);
                            try {
                              await fetch(`/api/transactions/${t.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ categoryId }),
                              });
                              setTransactions((prev) =>
                                prev.map((tx) =>
                                  tx.id === t.id
                                    ? {
                                        ...tx,
                                        categoryId,
                                        categoryName: cat?.name || null,
                                        categoryIcon: cat?.icon || null,
                                        categoryType: cat?.type || null,
                                      }
                                    : tx
                                )
                              );
                            } catch {
                              toast.error("Eroare la salvarea categoriei.");
                            }
                          }}
                          className="text-sm text-gray-400 border border-dashed border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white cursor-pointer"
                        >
                          <option value="">+ Adaugă</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.icon} {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {t.bankName ? (
                        <span className="flex items-center gap-2 text-sm text-gray-700">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.bankColor || "#6366f1" }}
                          />
                          {t.bankName}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right w-36">
                      <span
                        className="font-bold text-sm"
                        style={{ color: t.amount >= 0 ? "#16a34a" : "#ef4444" }}
                      >
                        {t.amount >= 0 ? "+" : ""}{t.amount.toFixed(2)} {t.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right w-36">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(t)}
                          className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          Editează
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          Șterge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
