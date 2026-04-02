"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Deconectat cu succes!");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Eroare la deconectare.");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      Deconectează-te
    </button>
  );
}
