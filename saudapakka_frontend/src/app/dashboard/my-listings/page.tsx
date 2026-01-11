"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Heart, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import PropertyCard, { Property } from "@/components/listings/property-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MyListingsPage() {
  const [activeTab, setActiveTab] = useState("my-listings");
  const [myListings, setMyListings] = useState<Property[]>([]);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [myRes, savedRes] = await Promise.all([
          api.get("/api/properties/my_listings/"),
          api.get("/api/properties/my_saved/")
        ]);
        setMyListings(myRes.data);
        setSavedProperties(savedRes.data);
      } catch (error) {
        console.error("Failed to fetch properties", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2D5F3F]" />
      </div>
    );
  }

  return (
    <div className="space-y-10 mt-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
          <p className="text-gray-500 mt-1">Manage your listed properties and view saved items.</p>
        </div>

        <Link href="/dashboard/my-listings/create">
          <Button className="bg-[#2D5F3F] hover:bg-[#2D5F3F]/90 text-white shadow-sm transition-all">
            <Plus className="mr-2 h-4 w-4" /> Post New Property
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="my-listings" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="my-listings" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> My Listings
            <span className="ml-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {myListings.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Heart className="h-4 w-4" /> Saved
            <span className="ml-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {savedProperties.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-listings" className="mt-6">
          {myListings.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties listed yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Start your journey by posting your first property listing. It only takes a few minutes.
              </p>
              <Link href="/dashboard/my-listings/create">
                <Button variant="outline" className="border-[#2D5F3F] text-[#2D5F3F] hover:bg-[#E8F5E9]">
                  Create Listing
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onDelete={async (id) => {
                    try {
                      await api.delete(`/api/properties/${id}/`);
                      setMyListings(prev => prev.filter(p => p.id !== id));
                    } catch (error: any) {
                      alert(error.response?.data?.error || "Failed to delete property");
                    }
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          {savedProperties.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Heart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved properties</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Properties you save while browsing will appear here for quick access.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}