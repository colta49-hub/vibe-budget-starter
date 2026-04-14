import Link from "next/link";
import LogoutButton from "./_components/logout-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50">
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <span className="text-xl">💰</span>
              <span className="text-base font-bold text-gray-900">Vibe Budget</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-xs text-gray-600 hover:text-teal-600 font-medium transition-colors">
                Dashboard
              </Link>
              <Link href="/dashboard/transactions" className="text-xs text-gray-600 hover:text-teal-600 font-medium transition-colors">
                Tranzacții
              </Link>
              <Link href="/dashboard/banks" className="text-xs text-gray-600 hover:text-teal-600 font-medium transition-colors">
                Bănci
              </Link>
              <Link href="/dashboard/categories" className="text-xs text-gray-600 hover:text-teal-600 font-medium transition-colors">
                Categorii
              </Link>
              <Link href="/dashboard/currencies" className="text-xs text-gray-600 hover:text-teal-600 font-medium transition-colors">
                Valute
              </Link>
              <Link href="/dashboard/upload" className="text-xs text-gray-600 hover:text-teal-600 font-medium transition-colors">
                Upload
              </Link>
              <Link href="/dashboard/reports" className="text-xs text-gray-600 hover:text-teal-600 font-medium transition-colors">
                Rapoarte
              </Link>
              <Link href="/dashboard/reports/pivot" className="text-xs text-gray-600 hover:text-teal-600 font-medium transition-colors">
                Pivot
              </Link>
            </div>

            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
