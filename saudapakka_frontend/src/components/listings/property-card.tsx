import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Bed, Bath, Maximize, Heart, Share2, CheckCircle, Copy } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";

export interface Property {
  id: string;
  title: string;
  total_price: number;
  property_type: string;
  listing_type: string;
  address_line: string;
  locality: string;
  city: string;
  bhk_config: number;
  bathrooms: number;
  carpet_area: string;
  verification_status: string;
  images: { id: string; image: string }[];
  has_7_12: boolean;
  has_mojani: boolean;
  created_at: string;
  property_status?: string;
  is_hot_deal?: boolean;
  is_new?: boolean;
  is_saved?: boolean; // In case backend provides it later
}

export default function PropertyCard({ property, onDelete }: { property: Property; onDelete?: (id: string) => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(property.is_saved || false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const mainImage = property.images && property.images.length > 0
    ? property.images[0].image
    : "https://placehold.co/600x400?text=SaudaPakka+Property";

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(0)} Lac`;
    }
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const isVerified = property.verification_status === "VERIFIED";

  // --- ACTIONS ---

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking buttons/links (though buttons have stopPropagation, good practice)
    router.push(`/property/${property.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      setIsDeleting(true);
      await onDelete(property.id);
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push("/login");
      return;
    }

    try {
      setLoadingSave(true);
      // Toggle logic
      await api.post(`/api/properties/${property.id}/save_property/`);
      setIsSaved(!isSaved);
      // Optional: Toast message here
    } catch (error) {
      console.error("Failed to save property", error);
      // Fallback in case auth check failed or token expired
      // alert("Please login to save properties."); 
    } finally {
      setLoadingSave(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/property/${property.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out this property on SaudaPakka: ${property.title}`,
          url: url,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        alert("Property link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy", err);
      }
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group border border-gray-100 relative cursor-pointer ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Image Section */}
      <div className="relative overflow-hidden">
        {/* We keep Link here for SEO, but onClick on parent handles click too. 
            Clicking this inner Link might bubble or Navigate twice if not careful. 
            Next.js Link usually handles onClick. To be safe, let's allow bubbling (router.push handles it) 
            OR remove Link and rely on parent onClick. 
            Removing Link wrapper here to avoid nesting issues since parent has onClick. */}
        <img
          src={mainImage}
          alt={property.title}
          className="h-52 w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isVerified && (
            <div className="bg-white/95 backdrop-blur-sm text-[#2D5F3F] px-2.5 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-sm">
              <CheckCircle className="w-3.5 h-3.5" />
              Verified
            </div>
          )}
          {property.is_hot_deal && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2.5 py-1.5 rounded-lg font-bold text-xs shadow-lg animate-pulse">
              🔥 HOT DEAL
            </div>
          )}
          {property.is_new && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2.5 py-1.5 rounded-lg font-bold text-xs shadow-lg">
              ✨ NEW
            </div>
          )}
        </div>

        {/* Listing Type Badge - Top Right */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-lg ${property.listing_type === "SALE"
            ? "bg-[#2D5F3F] text-white"
            : "bg-amber-500 text-white"
            }`}>
            For {property.listing_type === "SALE" ? "Sale" : "Rent"}
          </span>
        </div>

        {/* Action Buttons - Bottom Right (on hover) */}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <button
            onClick={handleSave}
            disabled={loadingSave}
            className={`w-9 h-9 backdrop-blur-sm rounded-full flex items-center justify-center transition-all shadow-lg
              ${isSaved ? 'bg-red-50 text-red-500' : 'bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white'}
            `}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:text-blue-500 hover:bg-white transition-all shadow-lg"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all shadow-lg"
              title="Delete Property"
            >
              {/* Inline SVG for Trash/Delete to avoid importing if not available, or use a generic 'X' */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
            </button>
          )}
        </div>

        {/* Image count badge */}
        {property.images && property.images.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {property.images.length}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Price & Property Type */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
              {formatPrice(Number(property.total_price))}
            </h3>
            <span className="text-xs font-medium text-[#4A9B6D] bg-[#E8F5E9] px-2 py-0.5 rounded-md mt-1 inline-block">
              {property.property_type.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-base font-bold text-gray-800 mb-2 line-clamp-1 hover:text-[#2D5F3F] transition-colors">
          {property.title}
        </h4>

        {/* Location */}
        <p className="text-gray-500 mb-4 flex items-center text-sm">
          <MapPin className="w-4 h-4 mr-1.5 text-[#4A9B6D]" />
          <span className="line-clamp-1">{property.locality}, {property.city}</span>
        </p>

        {/* Specs Row - Premium Pills */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full text-sm">
            <Bed className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-700">{property.bhk_config}</span>
            <span className="text-gray-400 text-xs">BHK</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full text-sm">
            <Bath className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-700">{property.bathrooms}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full text-sm">
            <Maximize className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-700">{property.carpet_area}</span>
            <span className="text-gray-400 text-xs">sqft</span>
          </div>
        </div>

        {/* Status & CTA Row */}
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${property.property_status === "READY" || !property.property_status
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
            }`}>
            {property.property_status === "READY" || !property.property_status ? "Ready to Move" : property.property_status}
          </span>
          <button className="flex-1 bg-gradient-to-r from-[#2D5F3F] to-[#4A9B6D] text-white py-2.5 rounded-xl hover:from-[#1B3A2C] hover:to-[#2D5F3F] transition-all duration-300 font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
