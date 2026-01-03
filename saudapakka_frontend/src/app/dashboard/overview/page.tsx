"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/axios";
import {
  Building2,
  Heart,
  TrendingUp,
  Plus,
  Search,
  UserCheck,
  FileText,
  Eye,
  ArrowRight
} from "lucide-react";

// --- COMPONENT: STAT CARD ---
function StatCard({ title, value, icon: Icon, colorClass }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

// --- COMPONENT: SELLER / BROKER DASHBOARD ---
function SellerDashboard({ user }: { user: any }) {
  const [stats, setStats] = useState({ totalListings: 0, totalViews: 0, pending: 0 });

  useEffect(() => {
    // Fetch stats specific to seller
    const fetchData = async () => {
      try {
        const res = await api.get("/api/listings/");
        // Filter my listings
        const myListings = res.data.filter((item: any) => item.owner_name === user.full_name);

        setStats({
          totalListings: myListings.length,
          totalViews: myListings.reduce((acc: number, item: any) => acc + (item.views || 0), 0), // Assuming API has views
          pending: myListings.filter((item: any) => item.verification_status === "PENDING").length
        });
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Listings"
          value={stats.totalListings}
          icon={Building2}
          colorClass="bg-primary-green"
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews}
          icon={Eye}
          colorClass="bg-accent-green"
        />
        <StatCard
          title="Pending Approval"
          value={stats.pending}
          icon={FileText}
          colorClass="bg-orange-400"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/my-listings/create" className="group">
          <div className="bg-gradient-to-r from-primary-green to-dark-green rounded-2xl p-8 text-white shadow-lg hover:scale-[1.01] transition-transform relative overflow-hidden">
            <div className="relative z-10">
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Post New Property</h3>
              <p className="text-white/80">List a new flat, villa, or land for sale.</p>
            </div>
            {/* Decorative Circle */}
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          </div>
        </Link>

        <Link href="/dashboard/my-listings" className="group">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:border-primary-green transition-colors relative overflow-hidden">
            <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-primary-green">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Manage Portfolio</h3>
            <p className="text-gray-500">Edit, delete, or check status of your listings.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

// --- COMPONENT: BUYER DASHBOARD ---
function BuyerDashboard({ user }: { user: any }) {
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await api.get("/api/listings/my_saved/");
        setSavedCount(res.data.length);
      } catch (e) { }
    };
    fetchSaved();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-green to-accent-green rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-3xl font-bold mb-4">Find your dream home today</h2>
          <p className="text-white/90 mb-8 text-lg">
            You are browsing as a buyer. Upgrade your account to start selling properties.
          </p>
          <div className="flex gap-4">
            <Link href="/search">
              <button className="bg-white text-primary-green px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Search className="w-4 h-4" /> Browse Properties
              </button>
            </Link>
            <Link href="/dashboard/kyc">
              <button className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-xl font-bold hover:bg-white/30 transition-colors flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Become a Seller
              </button>
            </Link>
          </div>
        </div>
        {/* Background Decor */}
        <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-10 translate-y-10">
          <Building2 className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Stats & Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/saved">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-between group">
            <div>
              <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Saved Items</div>
              <div className="text-3xl font-bold text-gray-900">{savedCount} Properties</div>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 fill-current" />
            </div>
          </div>
        </Link>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Account Status</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
              Active Buyer
            </span>
            {!user.is_active_seller && (
              <Link href="/dashboard/overview/upgrade" className="text-sm text-primary-green hover:underline ml-auto flex items-center">
                Upgrade Account <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function OverviewPage() {
  const { user } = useAuth();

  if (!user) return <div className="p-8">Loading dashboard...</div>;

  const isSellerOrBroker = user.is_active_seller || user.is_active_broker;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, <span className="text-primary-green">{user.full_name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="text-gray-500 mt-2">Here is what is happening with your account today.</p>
        </div>
        <div className="text-sm text-gray-400 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Conditional Dashboard */}
      {isSellerOrBroker ? (
        <SellerDashboard user={user} />
      ) : (
        <BuyerDashboard user={user} />
      )}
    </div>
  );
}