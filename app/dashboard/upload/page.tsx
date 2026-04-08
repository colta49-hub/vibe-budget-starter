"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Bank } from "@/lib/db/schema";
import { parseCSV, parseExcel } from "@/lib/utils/file-parser";
import type { ParsedTransaction } from "@/lib/utils/file-parser";

interface ImportResult {
  imported: number;
  categorized: number;
  message: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setParseError(null);
    setImportError(null);
    setImportResult(null);
    setParsedTransactions([]);

    if (!file) return;

    setParsing(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let result;

      if (ext === "csv") {
        result = await parseCSV(file);
      } else if (ext === "xlsx" || ext === "xls") {
        result = await parseExcel(file);
      } else {
        setParseError("Format nesuportat. Folosește CSV sau Excel (.xlsx, .xls).");
        return;
      }

      if (!result.success) {
        setParseError(result.error || "Eroare la citirea fișierului.");
        return;
      }

      setParsedTransactions(result.transactions);
      toast.success(`${result.transactions.length} tranzacții detectate.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Eroare necunoscută la citirea fișierului.";
      setParseError(message);
    } finally {
      setParsing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedBank || parsedTransactions.length === 0) return;

    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const transactions = parsedTransactions.map((tx) => ({
        bankId: selectedBank,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        currency: tx.currency || "GBP",
      }));

      const res = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions }),
      });

      const data = await res.json();

      if (!res.ok) {
        setImportError(data.error || "Eroare la import.");
        return;
      }

      setImportResult(data);
      toast.success(data.message);
    } catch {
      setImportError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSelectedBank("");
    setParsedTransactions([]);
    setParseError(null);
    setImportError(null);
    setImportResult(null);
  };

  const selectedBankName = banks.find((b) => b.id === selectedBank)?.name ?? "Fără bancă";
  const previewRows = parsedTransactions.slice(0, 10);
  const remaining = parsedTransactions.length - 10;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Tranzacții 📂</h1>
        <p className="text-gray-600 mt-1">Importă tranzacții din fișiere CSV sau Excel</p>
      </div>

      {/* Card principal */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col gap-5">
          {/* Selectare fișier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selectează fișier
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={parsing}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 disabled:opacity-50"
            />
            {parsing ? (
              <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
                <span className="inline-block w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                Se procesează fișierul...
              </p>
            ) : selectedFile ? (
              <p className="text-xs text-teal-600 mt-1">
                Fișier selectat: <span className="font-medium">{selectedFile.name}</span>
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Formate acceptate: CSV, Excel (.xlsx, .xls)</p>
            )}
          </div>

          {/* Eroare parsare */}
          {parseError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              ❌ {parseError}
            </div>
          )}

          {/* Dropdown bancă */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bancă <span className="text-gray-400 font-normal">(opțional)</span>
            </label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Fără bancă</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Eroare import */}
          {importError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              ❌ {importError}
            </div>
          )}

          {/* Succes import */}
          {importResult && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-green-800 text-sm font-medium">✅ {importResult.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Încarcă alt fișier
                </button>
                <button
                  onClick={() => router.push("/dashboard/transactions")}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Vezi tranzacțiile
                </button>
              </div>
            </div>
          )}

          {/* Buton import */}
          {!importResult && (
            <div>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || parsing || importing || parsedTransactions.length === 0 || !selectedBank}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {importing && (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {importing
                  ? "Se importă..."
                  : parsedTransactions.length > 0
                  ? `Importă ${parsedTransactions.length} tranzacții`
                  : "Importă tranzacții"}
              </button>
              {parsedTransactions.length > 0 && !selectedBank && (
                <p className="text-xs text-amber-600 mt-2">Selectează o bancă pentru a activa importul.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Preview tranzacții</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Dată</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Descriere</th>
                <th className="text-right text-sm font-medium text-gray-500 px-6 py-4">Sumă</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Valută</th>
              </tr>
            </thead>
            <tbody>
              {parsing ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-gray-500 text-sm">Se procesează fișierul...</p>
                    </div>
                  </td>
                </tr>
              ) : previewRows.length > 0 ? (
                previewRows.map((tx, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">{tx.date}</td>
                    <td className="px-6 py-3 text-sm text-gray-700 max-w-xs truncate">{tx.description}</td>
                    <td className="px-6 py-3 text-sm text-right">
                      <span
                        className="font-bold"
                        style={{ color: tx.amount >= 0 ? "#16a34a" : "#ef4444" }}
                      >
                        {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">{tx.currency || "RON"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <span className="text-5xl block mb-4">📄</span>
                    <p className="text-gray-500 text-sm">
                      Niciun fișier încărcat. Preview-ul va apărea aici după upload.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer tabel */}
        {parsedTransactions.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-1">
            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold">{parsedTransactions.length} tranzacții</span> găsite în fișier
            </p>
            {remaining > 0 && (
              <p className="text-xs text-gray-400">...și încă {remaining} tranzacții</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
