"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Link from "next/link";
import { MapPin, Bed, Bath, ArrowRight, Heart } from "lucide-react";

export default function SavedPropertiesPage() {
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState([]);

    useEffect(() => {
        const fetchSaved = async () => {
            try {
                const res = await api.get("/api/properties/my_saved/");
                setProperties(res.data);
            } catch (error) {
                console.error("Failed to fetch saved properties", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSaved();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading saved properties...</div>;
    }

    if (properties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <Heart className="w-10 h-10 text-gray-300" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Saved Properties</h2>
                <p className="text-gray-500 max-w-md mb-8">
                    You have not saved any properties yet. Browse listings to find your dream home.
                </p>
                <Link href="/search">
                    <button className="bg-[#2D5F3F] text-white px-8 py-3 rounded-xl font-medium hover:bg-[#1B3A2C] transition-colors">
                        Browse Properties
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Saved Properties</h1>
                <p className="text-gray-500 mt-2">Manage your shortlist of potential homes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property: any) => (
                    <div key={property.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group">
                        {/* Image */}
                        <div className="h-48 bg-gray-200 relative">
                            {property.images && property.images.length > 0 ? (
                                <img
                                    src={property.images[0].image}
                                    alt={property.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                    <span className="text-sm">No Image</span>
                                </div>
                            )}
                            <div className="absolute top-4 right-4">
                                <button className="bg-white/90 p-2 rounded-full text-red-500 shadow-sm hover:scale-110 transition-transform">
                                    <Heart className="w-5 h-5 fill-current" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-[#2D5F3F] transition-colors">
                                    {property.title}
                                </h3>
                                <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                    {property.verification_status}
                                </span>
                            </div>

                            <div className="flex items-center text-gray-500 text-sm mb-4">
                                <MapPin className="w-4 h-4 mr-1" />
                                {property.city}, {property.state}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 border-y border-gray-50 py-3">
                                <div className="flex items-center gap-1">
                                    <Bed className="w-4 h-4" />
                                    <span>{property.bhk_config?.split('_')[0] || ''} BHK</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Bath className="w-4 h-4" />
                                    <span>{property.bathrooms} Bath</span>
                                </div>
                                <div className="ml-auto font-bold text-lg text-gray-900">
                                    ₹{property.price > 10000000 ? `${(property.price / 10000000).toFixed(2)} Cr` : `${(property.price / 100000).toFixed(2)} L`}
                                </div>
                            </div>

                            <Link href={`/property/${property.id}`} className="block">
                                <button className="w-full bg-gray-50 hover:bg-[#2D5F3F] hover:text-white text-gray-900 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group-hover:bg-[#2D5F3F] group-hover:text-white">
                                    View Details <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
