"use client";

import { useState, useEffect, Fragment } from "react";
import { toast } from "sonner";
import type { Category, UserKeyword } from "@/lib/db/schema";

const EMOJI_OPTIONS = [
  "📁", "💰", "💼", "📈", "🎁", "🏆", "🤝",
  "🍔", "🚗", "🏠", "🎮", "📱", "✈️", "🛒",
  "🏥", "📚", "💊", "🎬", "🐾",
];

interface CategoryForm {
  name: string;
  type: "income" | "expense";
  icon: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>({ name: "", type: "expense", icon: "📁" });
  const [saving, setSaving] = useState(false);
  const [keywordsPanelId, setKeywordsPanelId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      toast.error("Eroare la încărcarea categoriilor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const body = editingCategory
        ? { name: form.name, icon: form.icon }
        : { name: form.name, type: form.type, icon: form.icon };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la salvare.");
        return;
      }

      if (editingCategory) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? data.category : c))
        );
        toast.success("Categorie actualizată cu succes!");
      } else {
        setCategories((prev) => [...prev, data.category]);
        toast.success("Categorie adăugată cu succes!");
      }

      handleCancel();
    } catch {
      toast.error("Eroare de conexiune. Încearcă din nou.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, isSystem: boolean | null) => {
    if (isSystem) {
      toast.error("Categoriile sistem nu pot fi șterse.");
      return;
    }

    if (!confirm("Ești sigur că vrei să ștergi această categorie?")) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la ștergere.");
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Categorie ștearsă cu succes!");
    } catch {
      toast.error("Eroare de conexiune. Încearcă din nou.");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setForm({ name: category.name, type: category.type as "income" | "expense", icon: category.icon || "📁" });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setForm({ name: "", type: "expense", icon: "📁" });
  };

  const toggleKeywordsPanel = (categoryId: string) => {
    setKeywordsPanelId((prev) => (prev === categoryId ? null : categoryId));
  };

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

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
          <h1 className="text-3xl font-bold text-gray-900">Categorii 📂</h1>
          <p className="text-gray-600 mt-1">Gestionează categoriile de venituri și cheltuieli</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Adaugă categorie
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingCategory ? "Editează categorie" : "Adaugă categorie nouă"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nume categorie
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Ex: Salariu, Mâncare, Transport..."
              />
            </div>

            {!editingCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tip
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "income" | "expense" })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="income">💚 Venit (Income)</option>
                  <option value="expense">🔴 Cheltuială (Expense)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm({ ...form, icon: emoji })}
                    style={form.icon === emoji ? { outline: "3px solid #0d9488", outlineOffset: "2px", background: "#ccfbf1", transform: "scale(1.2)" } : {}}
                    className={`text-2xl w-11 h-11 rounded-lg transition-all flex items-center justify-center border-2 ${
                      form.icon === emoji
                        ? "border-teal-500"
                        : "border-gray-200 hover:border-teal-400 hover:bg-teal-50 bg-white"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
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

      <div className="flex flex-col gap-6">
        <CategorySection
          title="Venituri"
          type="income"
          categories={incomeCategories}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => {
            setForm({ name: "", type: "income", icon: "💰" });
            setShowForm(true);
          }}
          keywordsPanelId={keywordsPanelId}
          onToggleKeywords={toggleKeywordsPanel}
        />
        <CategorySection
          title="Cheltuieli"
          type="expense"
          categories={expenseCategories}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => {
            setForm({ name: "", type: "expense", icon: "📁" });
            setShowForm(true);
          }}
          keywordsPanelId={keywordsPanelId}
          onToggleKeywords={toggleKeywordsPanel}
        />
      </div>
    </div>
  );
}

interface CategorySectionProps {
  title: string;
  type: "income" | "expense";
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string, isSystem: boolean | null) => void;
  onAdd: () => void;
  keywordsPanelId: string | null;
  onToggleKeywords: (id: string) => void;
}

function CategorySection({ title, type, categories, onEdit, onDelete, onAdd, keywordsPanelId, onToggleKeywords }: CategorySectionProps) {
  const isIncome = type === "income";
  const badgeClass = isIncome ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
  const titleClass = isIncome ? "text-green-700" : "text-red-700";

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className={`text-lg font-semibold ${titleClass}`}>{title}</h2>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeClass}`}>
            {categories.length}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
        >
          + Adaugă
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-gray-400 text-sm">
            Nu ai adăugat nicio categorie de {isIncome ? "venituri" : "cheltuieli"} încă.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4 w-16">Icon</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Nume</th>
                <th className="text-right text-sm font-medium text-gray-500 px-6 py-4 w-52">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <Fragment key={category.id}>
                  <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 w-16">
                      <span className="text-2xl">{category.icon || "📁"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{category.name}</span>
                        {category.isSystemCategory && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            SISTEM
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right w-52">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onToggleKeywords(category.id)}
                          className="border border-teal-300 hover:bg-teal-50 text-teal-700 px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          🔑 Keywords
                        </button>
                        <button
                          onClick={() => onEdit(category)}
                          className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          Editează
                        </button>
                        <button
                          onClick={() => onDelete(category.id, category.isSystemCategory)}
                          disabled={category.isSystemCategory ?? false}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            category.isSystemCategory
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-red-500 hover:bg-red-600 text-white"
                          }`}
                        >
                          Șterge
                        </button>
                      </div>
                    </td>
                  </tr>
                  {keywordsPanelId === category.id && (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 bg-teal-50/50 border-b border-gray-100">
                        <KeywordsPanel categoryId={category.id} categoryName={category.name} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface KeywordsPanelProps {
  categoryId: string;
  categoryName: string;
}

function KeywordsPanel({ categoryId, categoryName }: KeywordsPanelProps) {
  const [keywords, setKeywords] = useState<UserKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchKeywords();
  }, [categoryId]);

  const fetchKeywords = async () => {
    try {
      const res = await fetch(`/api/keywords?categoryId=${categoryId}`);
      const data = await res.json();
      setKeywords(data.keywords || []);
    } catch {
      toast.error("Eroare la încărcarea keyword-urilor.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKeyword, categoryId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la salvare.");
        return;
      }

      setKeywords((prev) => [...prev, data.keyword]);
      setNewKeyword("");
      toast.success(`Keyword "${newKeyword.trim().toLowerCase()}" adăugat!`);
    } catch {
      toast.error("Eroare de conexiune.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, keyword: string) => {
    try {
      const res = await fetch(`/api/keywords/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Eroare la ștergere.");
        return;
      }
      setKeywords((prev) => prev.filter((k) => k.id !== id));
      toast.success(`Keyword "${keyword}" șters.`);
    } catch {
      toast.error("Eroare de conexiune.");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-teal-800">
        Keywords pentru auto-categorizare — <span className="font-semibold">{categoryName}</span>
      </p>
      <p className="text-xs text-teal-600">
        Dacă descrierea unei tranzacții conține unul din aceste cuvinte, va fi categorizată automat.
      </p>

      {loading ? (
        <p className="text-sm text-gray-400">Se încarcă...</p>
      ) : (
        <>
          {keywords.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Niciun keyword adăugat încă.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <span
                  key={kw.id}
                  className="flex items-center gap-1 bg-white border border-teal-200 text-teal-800 text-sm px-3 py-1 rounded-full"
                >
                  {kw.keyword}
                  <button
                    onClick={() => handleDelete(kw.id, kw.keyword)}
                    className="text-teal-400 hover:text-red-500 ml-1 font-bold leading-none transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <form onSubmit={handleAdd} className="flex gap-2 mt-1">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder='Ex: "aliexpress", "tesco", "uber"'
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={saving || !newKeyword.trim()}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? "..." : "Adaugă"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
