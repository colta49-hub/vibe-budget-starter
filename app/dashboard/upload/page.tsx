"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Bank } from "@/lib/db/schema";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleUpload = () => {
    toast.info("Upload va fi funcțional în Săptămâna 5, Lecția 5.1");
  };

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
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
            {selectedFile ? (
              <p className="text-xs text-teal-600 mt-1">
                Fișier selectat: <span className="font-medium">{selectedFile.name}</span>
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Formate acceptate: CSV, Excel (.xlsx, .xls)</p>
            )}
          </div>

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

          {/* Buton upload */}
          <div>
            <button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Încarcă fișier
            </button>
          </div>
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
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Data</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Descriere</th>
                <th className="text-right text-sm font-medium text-gray-500 px-6 py-4">Sumă</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Valută</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Bancă</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <span className="text-5xl block mb-4">📄</span>
                  <p className="text-gray-500 text-sm">
                    Niciun fișier încărcat. Preview-ul va apărea aici după upload.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
