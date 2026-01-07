// src/app/dashboard/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Building2, ShieldCheck, LogOut, Menu, X, Heart, Home, UserCircle } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, checkUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // STEP 1: Wait for mounting and rehydration
  useEffect(() => {
    const init = async () => {
      await useAuth.persist.rehydrate();
      setMounted(true);
    };
    init();
  }, []);

  // STEP 2: Verify Auth only after mounting
  useEffect(() => {
    if (!mounted) return;

    const verify = async () => {
      try {
        await checkUser();
        setAuthReady(true);
      } catch (err) {
        router.replace("/login?expired=true");
      }
    };
    verify();
  }, [mounted, checkUser, router]);

  // STEP 3: Handle Final Redirects
  useEffect(() => {
    if (authReady && !user) {
      router.replace("/login");
    }
  }, [authReady, user, router]);

  // HYDRATION SHIELD: 
  // If not mounted or auth isn't verified, render a plain loading div.
  // This MUST be the same on server and client initial pass.
  if (!mounted || !authReady || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white" suppressHydrationWarning>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-[#4A9B6D] rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-medium">Synchronizing SaudaPakka...</p>
        </div>
      </div>
    );
  }

  // Final Dashboard UI
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#1B3A2C] text-white z-[1000] transform transition-transform lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6">
          <div className="text-xl font-bold italic">saudapakka</div>
          {/* Close button for mobile */}
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-300 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard/overview" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === '/dashboard/overview' ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Overview</span>
          </Link>

          {(user?.is_active_seller || user?.is_active_broker) ? (
            <Link href="/dashboard/my-listings" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname.includes('/my-listings') ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
              <Building2 className="w-5 h-5" />
              <span>My Listings</span>
            </Link>
          ) : (
            <Link href="/dashboard/saved" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname.includes('/saved') ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
              <Heart className="w-5 h-5" />
              <span>Saved Properties</span>
            </Link>
          )}

          <Link href="/dashboard/kyc" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname.includes('/kyc') ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
            <ShieldCheck className="w-5 h-5" />
            <span>Identity Verification</span>
          </Link>

          <Link href="/dashboard/profile" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === '/dashboard/profile' ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
            <UserCircle className="w-5 h-5" />
            <span>My Profile</span>
          </Link>

          <div className="pt-8 mt-8 border-t border-white/10 space-y-2">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
              <Home className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>

            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors text-left"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 lg:ml-64 bg-gray-50 min-h-screen flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-30">
          <div className="font-bold text-xl italic text-[#1B3A2C]">saudapakka</div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}