"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Transaction } from "@/lib/db/schema";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions");
      if (!res.ok) {
        setTransactions([]);
        return;
      }
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch {
      toast.error("Eroare la încărcarea tranzacțiilor.");
    } finally {
      setLoading(false);
    }
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
          <p className="text-gray-600 mt-1">Istoricul tranzacțiilor tale</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
          <span className="text-5xl">📊</span>
          <p className="text-gray-600 mt-4 text-lg">Nu ai nicio tranzacție încă.</p>
          <p className="text-gray-400 text-sm mt-1">Tranzacțiile vor apărea aici după ce le adaugi.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Data</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Descriere</th>
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4">Valută</th>
                <th className="text-right text-sm font-medium text-gray-500 px-6 py-4">Sumă</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{transaction.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{transaction.description}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{transaction.currency}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${transaction.amount >= 0 ? "text-teal-600" : "text-orange-500"}`}>
                      {transaction.amount >= 0 ? "+" : ""}{transaction.amount.toFixed(2)}
                    </span>
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
