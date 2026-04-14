"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  nativeCurrency: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    nativeCurrency: "GBP",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      toast.success("Cont creat! Te poți conecta acum.");
      router.push("/login");
    } catch {
      setError("Eroare de conexiune. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">💰</span>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Vibe Budget</h1>
          <p className="text-gray-600 mt-2">Creează-ți contul gratuit</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nume complet
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Ion Popescu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="email@exemplu.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parolă
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Minimum 6 caractere"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monedă nativă
              </label>
              <select
                value={form.nativeCurrency}
                onChange={(e) => setForm({ ...form, nativeCurrency: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="GBP">GBP — British Pound £</option>
                <option value="EUR">EUR — Euro €</option>
                <option value="USD">USD — US Dollar $</option>
                <option value="RON">RON — Leu românesc</option>
                <option value="MDL">MDL — Leu moldovenesc</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium px-4 py-2 rounded-lg transition-colors mt-2"
            >
              {loading ? "Se creează contul..." : "Creează cont"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Ai deja cont?{" "}
            <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium">
              Conectează-te
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
