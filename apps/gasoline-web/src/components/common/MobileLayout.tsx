"use client";

import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { LogOut } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "./OfflineBanner";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (!error) {
        router.refresh();
        router.push("/login");
      }
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="min-h-dvh bg-gray-900 flex justify-center w-full overflow-hidden">
      <div className="w-full max-w-md bg-slate-50 flex flex-col h-dvh shadow-2xl relative overflow-hidden">
        <OfflineBanner />
        {isLoginPage ? (
          children
        ) : (
          <>
            <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">⛽</span>
                <h1 className="text-base font-bold text-gray-900 tracking-tight">
                  Gasoline Web Eceran
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold rounded-full">
                  Operator
                </span>
                <button
                  onClick={handleSignOut}
                  className="p-1 hover:bg-slate-100 rounded text-gray-500 hover:text-red-600 transition-colors"
                  title="Keluar (Sign Out)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto pb-24 p-4">
              {children}
            </main>
            <BottomNav />
          </>
        )}
      </div>
    </div>
  );
}
