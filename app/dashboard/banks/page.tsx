"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Bank } from "@/lib/db/schema";

interface BankForm {
  name: string;
  color: string;
}

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [form, setForm] = useState<BankForm>({ name: "", color: "#6366f1" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await fetch("/api/banks");
      const data = await res.json();
      setBanks(data.banks || []);
    } catch {
      toast.error("Eroare la încărcarea băncilor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingBank ? `/api/banks/${editingBank.id}` : "/api/banks";
      const method = editingBank ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la salvare.");
        return;
      }

      if (editingBank) {
        setBanks((prev) => prev.map((b) => (b.id === editingBank.id ? data.bank : b)));
        toast.success("Bancă actualizată cu succes!");
      } else {
        setBanks((prev) => [...prev, data.bank]);
        toast.success("Bancă adăugată cu succes!");
      }

      handleCancel();
    } catch {
      toast.error("Eroare de conexiune. Încearcă din nou.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ești sigur că vrei să ștergi această bancă?")) return;

    try {
      const res = await fetch(`/api/banks/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la ștergere.");
        return;
      }

      setBanks((prev) => prev.filter((b) => b.id !== id));
      toast.success("Bancă ștearsă cu succes!");
    } catch {
      toast.error("Eroare de conexiune. Încearcă din nou.");
    }
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setForm({ name: bank.name, color: bank.color || "#6366f1" });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBank(null);
    setForm({ name: "", color: "#6366f1" });
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
          <h1 className="text-3xl font-bold text-gray-900">Bănci 🏦</h1>
          <p className="text-gray-600 mt-1">Gestionează conturile tale bancare</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Adaugă bancă
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingBank ? "Editează bancă" : "Adaugă bancă nouă"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nume bancă
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Ex: ING, BCR, Revolut..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Culoare
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <span className="text-sm text-gray-500">{form.color}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
      )}

      {banks.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
          <span className="text-5xl">🏦</span>
          <p className="text-gray-600 mt-4 text-lg">Nu ai adăugat nicio bancă încă.</p>
          <p className="text-gray-400 text-sm mt-1">Adaugă prima ta bancă pentru a începe.</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Adaugă bancă
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Culoare</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Nume</th>
                <th className="text-right text-sm font-medium text-gray-500 px-6 py-4">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {banks.map((bank) => (
                <tr key={bank.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div
                      className="w-8 h-8 rounded-lg"
                      style={{ backgroundColor: bank.color || "#6366f1" }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{bank.name}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(bank)}
                        className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1 rounded-lg text-sm transition-colors"
                      >
                        Editează
                      </button>
                      <button
                        onClick={() => handleDelete(bank.id)}
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
      )}
    </div>
  );
}
