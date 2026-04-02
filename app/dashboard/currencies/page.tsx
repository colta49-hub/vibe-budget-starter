"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Currency } from "@/lib/db/schema";

const PRESET_CURRENCIES = [
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "GBP", name: "British Pound", symbol: "£" },
];

const KNOWN_CURRENCIES: Record<string, { name: string; symbol: string }> = {
  RON: { name: "Romanian Leu", symbol: "lei" },
  EUR: { name: "Euro", symbol: "€" },
  USD: { name: "US Dollar", symbol: "$" },
  GBP: { name: "British Pound", symbol: "£" },
  MDL: { name: "Moldovan Leu", symbol: "L" },
  CHF: { name: "Swiss Franc", symbol: "CHF" },
  JPY: { name: "Japanese Yen", symbol: "¥" },
  CAD: { name: "Canadian Dollar", symbol: "CA$" },
  AUD: { name: "Australian Dollar", symbol: "A$" },
  SEK: { name: "Swedish Krona", symbol: "kr" },
  NOK: { name: "Norwegian Krone", symbol: "kr" },
  DKK: { name: "Danish Krone", symbol: "kr" },
  PLN: { name: "Polish Złoty", symbol: "zł" },
  HUF: { name: "Hungarian Forint", symbol: "Ft" },
  CZK: { name: "Czech Koruna", symbol: "Kč" },
  BGN: { name: "Bulgarian Lev", symbol: "лв" },
  TRY: { name: "Turkish Lira", symbol: "₺" },
  UAH: { name: "Ukrainian Hryvnia", symbol: "₴" },
  RUB: { name: "Russian Ruble", symbol: "₽" },
};

interface CurrencyForm {
  code: string;
  name: string;
  symbol: string;
}

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CurrencyForm>({ code: "", name: "", symbol: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const res = await fetch("/api/currencies");
      const data = await res.json();
      setCurrencies(data.currencies || []);
    } catch {
      toast.error("Eroare la încărcarea valutelor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la salvare.");
        return;
      }

      setCurrencies((prev) => [...prev, data.currency]);
      toast.success("Valută adăugată cu succes!");
      setShowForm(false);
      setForm({ code: "", name: "", symbol: "" });
    } catch {
      toast.error("Eroare de conexiune. Încearcă din nou.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreset = async (preset: { code: string; name: string; symbol: string }) => {
    try {
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preset),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la salvare.");
        return;
      }

      setCurrencies((prev) => [...prev, data.currency]);
      toast.success(`${preset.code} adăugat cu succes!`);
    } catch {
      toast.error("Eroare de conexiune. Încearcă din nou.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ești sigur că vrei să ștergi această valută?")) return;

    try {
      const res = await fetch(`/api/currencies/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la ștergere.");
        return;
      }

      setCurrencies((prev) => prev.filter((c) => c.id !== id));
      toast.success("Valută ștearsă cu succes!");
    } catch {
      toast.error("Eroare de conexiune. Încearcă din nou.");
    }
  };

  const isAdded = (code: string) => currencies.some((c) => c.code === code);

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
          <h1 className="text-3xl font-bold text-gray-900">Valute 💱</h1>
          <p className="text-gray-600 mt-1">Gestionează valutele folosite în tranzacții</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Adaugă valută
          </button>
        )}
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Adaugă rapid</h2>
        <div className="flex flex-wrap gap-3">
          {PRESET_CURRENCIES.map((preset) => {
            const added = isAdded(preset.code);
            return (
              <button
                key={preset.code}
                onClick={() => !added && handlePreset(preset)}
                disabled={added}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${
                  added
                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border-teal-200 hover:border-teal-500 hover:bg-teal-50 text-teal-700"
                }`}
              >
                {preset.code} ({preset.symbol})
              </button>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Adaugă valută nouă</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cod
                </label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase();
                    const known = KNOWN_CURRENCIES[code];
                    if (known) {
                      setForm({ code, name: known.name, symbol: known.symbol });
                    } else {
                      setForm({ ...form, code });
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="MDL"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nume
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Moldovan Leu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Simbol
                </label>
                <input
                  type="text"
                  required
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="L"
                  maxLength={5}
                />
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
                onClick={() => {
                  setShowForm(false);
                  setForm({ code: "", name: "", symbol: "" });
                }}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Anulează
              </button>
            </div>
          </form>
        </div>
      )}

      {currencies.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
          <span className="text-5xl">💱</span>
          <p className="text-gray-600 mt-4 text-lg">Nu ai adăugat nicio valută încă.</p>
          <p className="text-gray-400 text-sm mt-1">Folosește butoanele de mai sus pentru a adăuga valute.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Cod</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Nume</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Simbol</th>
                <th className="text-right text-sm font-medium text-gray-500 px-6 py-4 w-32">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((currency) => (
                <tr key={currency.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded text-sm">
                      {currency.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{currency.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{currency.symbol}</span>
                  </td>
                  <td className="px-6 py-4 text-right w-32">
                    <button
                      onClick={() => handleDelete(currency.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                    >
                      Șterge
                    </button>
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
