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
}

interface TransactionForm {
  date: string;
  description: string;
  amount: string;
  currency: string;
  bankId: string;
  categoryId: string;
}

const today = () => new Date().toISOString().split("T")[0];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<TransactionForm>({
    date: today(),
    description: "",
    amount: "",
    currency: "RON",
    bankId: "",
    categoryId: "",
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

  const handleEdit = (t: TransactionRow) => {
    setEditingTransaction(t);
    setForm({
      date: t.date,
      description: t.description,
      amount: String(t.amount),
      currency: t.currency,
      bankId: t.bankId || "",
      categoryId: t.categoryId || "",
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
    setForm({ date: today(), description: "", amount: "", currency: "RON", bankId: "", categoryId: "" });
  };

  const hasFilters = search || filterBank || filterCategory || filterDateFrom || filterDateTo;

  const filtered = transactions
    .filter((t) => !search || t.description.toLowerCase().includes(search.toLowerCase()))
    .filter((t) => !filterBank || t.bankId === filterBank)
    .filter((t) => !filterCategory || t.categoryId === filterCategory)
    .filter((t) => !filterDateFrom || t.date >= filterDateFrom)
    .filter((t) => !filterDateTo || t.date <= filterDateTo);

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
        <button
          onClick={() => setShowForm(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Adaugă tranzacție
        </button>
      </div>

      {/* Filtre */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
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

          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setFilterBank(""); setFilterCategory(""); setFilterDateFrom(""); setFilterDateTo(""); }}
              className="border border-gray-300 hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ✕ Resetează filtre
            </button>
          )}
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
          <div className="px-6 py-3 border-b border-gray-100 text-xs text-gray-400">
            {filtered.length} tranzacț{filtered.length === 1 ? "ie" : "ii"}
            {hasFilters && transactions.length !== filtered.length && ` din ${transactions.length}`}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
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
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 w-32">
                      <span className="text-sm text-gray-600">{t.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{t.description}</span>
                    </td>
                    <td className="px-6 py-4">
                      {t.categoryName ? (
                        <span className="text-sm text-gray-700">
                          {t.categoryIcon} {t.categoryName}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
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
