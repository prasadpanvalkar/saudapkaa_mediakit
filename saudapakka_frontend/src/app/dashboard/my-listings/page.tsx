"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/axios";
import { Plus, Home, Heart, Edit, Trash2, Eye, AlertCircle, Loader2, Share2 } from "lucide-react";
import PropertyCard from "@/components/listings/property-card";

export default function MyListingsPage() {
  const router = useRouter();
  const [myListings, setMyListings] = useState<any[]>([]);
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"my" | "saved">("my");

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      // Check authentication first
      const token = Cookies.get("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch my listings with fallback
        let myListingsData = [];
        try {
          const myRes = await api.get("/api/properties/my_listings/");
          myListingsData = myRes.data || [];
        } catch (err: any) {
          const allRes = await api.get("/api/properties/");
          const userRes = await api.get("/api/auth/user/");
          const userId = userRes.data.id;
          myListingsData = (allRes.data || []).filter(
            (p: any) => p.owner?.id === userId || p.owner === userId
          );
        }

        // Fetch saved listings (optional feature)
        let savedListingsData = [];
        try {
          const savedRes = await api.get("/api/properties/my_saved/");
          savedListingsData = savedRes.data || [];
        } catch {
        }

        if (isMounted) {
          setMyListings(myListingsData);
          setSavedListings(savedListingsData);
        }
      } catch (error: any) {
        console.error("=== FETCH ERROR ===", error);

        if (isMounted) {
          let errorMessage = "Failed to load listings. ";

          if (error.response?.status === 401) {
            errorMessage = "Session expired. Please log in again.";
            setTimeout(() => router.push("/login"), 2000);
          } else if (error.response?.status === 500) {
            errorMessage = "Server error. Please try again later.";
          } else if (error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
          }

          setError(errorMessage);
          setMyListings([]);
          setSavedListings([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      await api.delete(`/api/properties/${id}/`);
      setMyListings(prev => prev.filter(p => p.id !== id));
      alert("Property deleted successfully");
    } catch (error: any) {
      console.error("Delete error:", error);
      alert("Failed to delete property: " + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
            <p className="text-gray-500 mt-1">Manage your properties</p>
          </div>
          <Link
            href="/dashboard/my-listings/create"
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Property
          </Link>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-900">Error Loading Listings</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("my")}
            className={`pb-3 px-2 font-medium transition-colors ${activeTab === "my"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <Home className="w-4 h-4 inline mr-2" />
            My Properties ({myListings.length})
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`pb-3 px-2 font-medium transition-colors ${activeTab === "saved"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <Heart className="w-4 h-4 inline mr-2" />
            Saved Properties ({savedListings.length})
          </button>
        </div>

        {/* Listings Grid */}
        {activeTab === "my" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myListings.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No properties listed yet</p>
                <Link
                  href="/dashboard/my-listings/create"
                  className="inline-block mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Your First Listing
                </Link>
              </div>
            ) : (
              myListings.map(property => (
                <div key={property.id} className="bg-white rounded-xl shadow-sm border p-4">
                  <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden relative group">
                    <Link href={`/property/${property.id}`} className="block h-full">
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 z-10">
                        <Eye className="w-3.5 h-3.5" />
                        {property.views_count || 0} Views
                      </div>
                      {property.thumbnail_image || (property.images && property.images.length > 0 && property.images[0].image) ? (
                        <img src={property.thumbnail_image || property.images[0].image} alt={property.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Home className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </Link>
                  </div>
                  <Link href={`/property/${property.id}`}>
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 hover:text-green-600 transition-colors">{property.title}</h3>
                  </Link>
                  <p className="text-2xl font-bold text-green-600 mb-4">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(property.total_price))}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/my-listings/${property.id}/marketing`}
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center justify-center"
                      title="Create Marketing Kit"
                    >
                      <Share2 className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/dashboard/my-listings/edit/${property.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(property.id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "saved" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedListings.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No saved properties yet</p>
              </div>
            ) : (
              savedListings.map(property => (
                <PropertyCard
                  key={property.id}
                  property={{ ...property, is_saved: true }}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

