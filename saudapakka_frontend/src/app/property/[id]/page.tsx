"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/axios";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notification } from "@/components/ui/notification";
import {
  MapPin, Phone, Bed, Bath, Ruler, Building, Shield, Zap,
  Wifi, Droplet, Trees, Users, MessageCircle, Heart, Eye,
  ArrowLeft, CheckCircle, Clock, Layers, Compass, Sofa,
  Maximize, PlayCircle, FileText, ChevronLeft, ChevronRight, X, Loader2, Navigation, Share2, ExternalLink, Gavel
} from "lucide-react";

// --- Types (Synced with Django Model) ---
interface PropertyDetail {
  id: string;
  title: string;
  description: string;
  listing_type: 'SALE' | 'RENT';
  property_type: string;
  sub_type: string;
  sub_type_display?: string;

  // Config
  bhk_config?: number;
  bathrooms?: number;
  balconies?: number;
  furnishing_status?: string;

  // Areas
  super_builtup_area?: string;
  carpet_area?: string;
  plot_area?: string;

  // Price
  total_price: number;
  price_per_sqft?: number;
  maintenance_charges?: number;
  maintenance_interval?: 'MONTHLY' | 'YEARLY';

  // Location
  project_name?: string;
  address_line: string;
  locality: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  landmarks?: string;

  // Building
  specific_floor?: string;
  total_floors?: number;
  facing?: string;
  age_of_construction?: number;
  availability_status: string;
  possession_date?: string;

  // Amenities & Tech
  has_power_backup: boolean;
  has_lift: boolean;
  has_swimming_pool: boolean;
  has_gym: boolean;
  has_park: boolean;
  has_security: boolean;
  has_wifi: boolean;
  has_water_line: boolean;
  has_drainage_line: boolean;

  // Media & Docs
  images: { id: number; image: string }[];
  floor_plans?: { id: number; image: string; floor_number?: string; floor_name?: string; order: number }[];
  video_url?: string;

  // Verification Docs
  building_commencement_certificate?: string;
  building_completion_certificate?: string;
  layout_sanction?: string;
  doc_7_12_or_pr_card?: string;
  title_search_report?: string;
  rera_project_certificate?: string;
  electricity_bill?: string;
  sale_deed?: string;

  // Meta
  owner_details?: { full_name: string; id: string; profile_picture?: string };
  listed_by_display?: string;
  verification_status: string;
  whatsapp_number?: string; // Direct property contact

  // User Interaction
  is_saved?: boolean;
  has_active_mandate?: boolean;
  views_count?: number;
}

// --- Dynamic Imports ---
const MapViewer = dynamic(() => import("@/components/maps/MapViewer"), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Loading Map...</div>
});

import { ShareModal } from "@/components/modals/share-modal";

// --- Helper Functions ---
const formatCurrency = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
};

const formatPricePerSqFt = (price: number | undefined, area: string | undefined, totalPrice: number) => {
  if (price) return `₹${price.toLocaleString("en-IN")} / sq.ft`;

  // Fallback calculation if backend doesn't send it but we have area
  if (area && totalPrice) {
    const areaNum = parseFloat(area);
    if (!isNaN(areaNum) && areaNum > 0) {
      return `₹${Math.round(totalPrice / areaNum).toLocaleString("en-IN")} / sq.ft`;
    }
  }
  return null;
};

const formatText = (text?: string) => {
  if (!text) return "N/A";
  return text.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

const formatBHK = (bhk: number | undefined | null) => {
  if (bhk === undefined || bhk === null || bhk === 0) return null;
  const val = Number(bhk);
  if (val === 0.5) return "1 RK (0.5 BHK)";
  return `${Number.isInteger(val) ? val : val.toFixed(1)} BHK`;
};

// --- Sub-Components ---

// 1. Key Highlights Bar
const PropertyHighlights = ({ property }: { property: PropertyDetail }) => {
  const specs = [
    { icon: Bed, label: "Bedrooms", value: formatBHK(property.bhk_config) },
    { icon: Bath, label: "Bathrooms", value: property.bathrooms },
    { icon: Maximize, label: "Balconies", value: property.balconies },
    { icon: Sofa, label: "Furnishing", value: formatText(property.furnishing_status) },
    { icon: Ruler, label: "Carpet Area", value: property.carpet_area ? `${property.carpet_area} sq.ft` : null },
    { icon: Layers, label: "Floor", value: property.specific_floor && property.total_floors ? `${property.specific_floor} of ${property.total_floors}` : null },
    { icon: Compass, label: "Facing", value: formatText(property.facing) },
    { icon: Clock, label: "Age", value: property.age_of_construction ? `${property.age_of_construction} Years` : "New" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
      {specs.filter(s => s.value).map((spec, idx) => (
        <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[#2D5F3F]">
            <spec.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{spec.value}</p>
            <p className="text-xs text-gray-500">{spec.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// 2. Comprehensive Data Grid
const DataGrid = ({ property }: { property: PropertyDetail }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-[#4A9B6D]" />
        Property Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 text-sm">
        <Row label="Property Type" value={`${formatText(property.property_type)} (${formatText(property.sub_type_display || property.sub_type)})`} />
        <Row label="Listing Type" value={property.listing_type === 'SALE' ? 'For Sale' : 'For Rent'} />
        <Row label="Super Built-up Area" value={property.super_builtup_area ? `${property.super_builtup_area} sq.ft` : "-"} />
        <Row label="Carpet Area" value={property.carpet_area ? `${property.carpet_area} sq.ft` : "-"} />
        <Row label="Plot Area" value={property.plot_area ? `${property.plot_area} sq.ft` : "-"} />
        <Row label="Price per Sq. Ft" value={formatPricePerSqFt(property.price_per_sqft, property.carpet_area || property.super_builtup_area, property.total_price) || "-"} />
        <Row label="Possession Status" value={formatText(property.availability_status)} />
        <Row label="Maintenance" value={property.maintenance_charges ? `₹${property.maintenance_charges} / ${property.maintenance_interval?.toLowerCase()}` : "Not Specified"} />
        <Row label="Project Name" value={property.project_name || "-"} />
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string, value: string | number }) => (
  <div className="flex justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900 text-right">{value}</span>
  </div>
);

// 3. Verification Vault
const VerificationVault = ({ property }: { property: PropertyDetail }) => {
  const docs = [
    { key: 'building_commencement_certificate', label: 'Commencement Cert' },
    { key: 'building_completion_certificate', label: 'Completion Cert' },
    { key: 'doc_7_12_or_pr_card', label: '7/12 / PR Card' },
    { key: 'title_search_report', label: 'Title Search Report' },
    { key: 'rera_project_certificate', label: 'RERA Certificate' },
    { key: 'layout_sanction', label: 'Layout Sanction' },
    { key: 'electricity_bill', label: 'Electricity Bill' },
    { key: 'sale_deed', label: 'Sale Deed' },
  ];

  const availableDocs = docs.filter(d => property[d.key as keyof PropertyDetail]);

  if (availableDocs.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 border border-green-100 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-600 rounded-lg text-white">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Verification Vault</h3>
          <p className="text-xs text-gray-600">Documents verified by SaudaPakka</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {availableDocs.map((doc) => (
          <div key={doc.key} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-green-100 shadow-sm">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 truncate">{doc.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Component ---
export default function PropertyDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false); // New State

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactDetails, setContactDetails] = useState<any>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [notification, setNotification] = useState({ show: false, message: "", type: "info" as "info" | "success" | "error" });
  const showNotify = (message: string, type: "info" | "success" | "error" = "info") => setNotification({ show: true, message, type });


  const viewRecorded = useRef(false);

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();

      // Record view in background (only once)
      if (!viewRecorded.current) {
        api.get(`/api/properties/${id}/record_view/`)
          .catch(err => console.error("View record failed", err));
        viewRecorded.current = true;
      }
    }
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      const res = await api.get(`/api/properties/${id}/`);
      setProperty(res.data);
      if (res.data.images?.length > 0) {
        setActiveImage(res.data.images[0].image);
        setActiveImageIndex(0);
      }
      setIsSaved(res.data.is_saved || false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async () => {
    if (!user) return router.push(`/login?redirect=${window.location.pathname}`);
    try {
      await api.post(`/api/properties/${id}/save_property/`);
      setIsSaved(!isSaved);
      showNotify(isSaved ? "Removed from saved" : "Property saved!", "success");
    } catch (e) { showNotify("Action failed", "error"); }
  };

  const handleContactOwner = async () => {
    if (!user) return router.push(`/login?redirect=${window.location.pathname}`);

    // If we already have details, just show modal
    if (contactDetails) { setShowContactModal(true); return; }

    setContactLoading(true);
    try {
      const res = await api.get(`/api/properties/${id}/get_contact_details/`);
      setContactDetails(res.data);
      setShowContactModal(true);
    } catch (e) { showNotify("Could not fetch contact details", "error"); }
    finally { setContactLoading(false); }
  };

  // WhatsApp Logic
  const handleWhatsAppChat = () => {
    // Require authentication before allowing WhatsApp chat
    if (!user) return router.push(`/login?redirect=${window.location.pathname}`);

    if (!property) return;

    // Use contactDetails if revealed, otherwise check if property has public whatsapp
    // Fallback: If neither, we force user to click "Contact Owner" first to reveal info
    const targetNumber = contactDetails?.whatsapp_number || property.whatsapp_number;

    if (!targetNumber) {
      // If no number is available, trigger the contact flow to fetch it
      handleContactOwner();
      return;
    }

    const cleanNumber = targetNumber.replace(/\D/g, ''); // Remove non-digits
    const message = `Hi, I am interested in your property listed on SaudaPakka: ${property.title}. \nLink: ${window.location.href}`;
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Google Maps Directions Logic
  const handleGetDirections = () => {
    if (!property) return;
    let destination = "";
    if (property.latitude && property.longitude) {
      destination = `${property.latitude},${property.longitude}`;
    } else {
      destination = `${property.address_line}, ${property.locality}, ${property.city}`;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    window.open(url, '_blank');
  };

  // Image Navigation
  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!property?.images) return;
    const nextIdx = (activeImageIndex + 1) % property.images.length;
    setActiveImage(property.images[nextIdx].image);
    setActiveImageIndex(nextIdx);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!property?.images) return;
    const prevIdx = (activeImageIndex - 1 + property.images.length) % property.images.length;
    setActiveImage(property.images[prevIdx].image);
    setActiveImageIndex(prevIdx);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#4A9B6D]" /></div>;
  if (!property) return <div className="text-center pt-20">Property not found</div>;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 pb-24 sm:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Top Bar: Back & Share */}
          <div className="flex justify-between items-center mb-4">
            <Button variant="ghost" onClick={() => router.back()} className="-ml-2 hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Search
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              // If owner, go to Marketing Kit
              if (user && property && user.id === property.owner_details?.id) {
                router.push(`/dashboard/my-listings/${property.id}/marketing`);
              } else {
                setShowShareModal(true);
              }
            }}>
              <Share2 className="w-4 h-4 mr-2" /> {user && property && user.id === property.owner_details?.id ? "Create Marketing Kit" : "Share"}
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: Content */}
            <div className="lg:col-span-2">

              {/* 1. Gallery Section (Improved) */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6 relative group border border-gray-100">
                <div
                  className="h-[300px] sm:h-[450px] md:h-[550px] bg-gray-200 relative cursor-zoom-in"
                  onClick={() => setShowImageModal(true)}
                >
                  <img src={activeImage || "https://placehold.co/800x600?text=No+Image"} className="w-full h-full object-cover" alt="Main Property" />

                  {/* Arrows */}
                  {property.images.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {activeImageIndex + 1} / {property.images.length} Photos
                  </div>
                </div>

                {/* Thumbnails Scroll */}
                {property.images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto bg-white border-t border-gray-100">
                    {property.images.map((img, idx) => (
                      <div key={img.id} onClick={() => { setActiveImage(img.image); setActiveImageIndex(idx); }}
                        className={`h-16 w-24 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${activeImage === img.image ? 'border-[#4A9B6D] opacity-100' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                        <img src={img.image} className="w-full h-full object-cover" alt="thumb" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Floor Plans Section */}
              {property.floor_plans && property.floor_plans.length > 0 && (
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6 border border-gray-100">
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#4A9B6D]" />
                      Floor Plans
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {property.floor_plans.map((plan) => (
                        <div key={plan.id} className="group relative">
                          <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-[#4A9B6D] transition-colors cursor-pointer"
                            onClick={() => { setActiveImage(plan.image); setShowImageModal(true); }}>
                            <img
                              src={plan.image}
                              alt={plan.floor_name || `Floor ${plan.floor_number || ''}`}
                              className="w-full h-full object-contain hover:scale-105 transition-transform"
                            />
                          </div>
                          {(plan.floor_name || plan.floor_number) && (
                            <div className="mt-2 text-sm font-medium text-gray-700 text-center">
                              {plan.floor_name || `Floor ${plan.floor_number}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Header Info */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300">
                        {formatText(property.property_type)}
                      </Badge>
                      {property.verification_status === 'VERIFIED' && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{property.title}</h1>
                    <div className="flex items-center text-gray-600 mt-2 text-sm sm:text-base">
                      <MapPin className="w-4 h-4 mr-1 text-[#4A9B6D] flex-shrink-0" />
                      <span>{property.locality}, {property.city}</span>
                    </div>
                  </div>

                  {/* Desktop Price Block */}
                  {/* <div className="text-right hidden sm:block bg-green-50/50 p-4 rounded-xl border border-green-100">
                    <div className="text-3xl font-extrabold text-[#2D5F3F]">{formatCurrency(property.total_price)}</div>
                    <div className="text-sm font-medium text-gray-500 mt-1">
                      {formatPricePerSqFt(property.price_per_sqft, property.carpet_area || property.super_builtup_area, property.total_price)}
                    </div>
                  </div> */}
                </div>
              </div>

              {/* 3. Key Highlights */}
              <PropertyHighlights property={property} />

              {/* 4. Description */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-bold mb-3 text-gray-900">About this Property</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{property.description || "No description provided."}</p>
                {property.video_url && (
                  <a href={property.video_url} target="_blank" className="inline-flex items-center gap-2 mt-4 text-red-600 font-bold hover:underline bg-red-50 px-4 py-2 rounded-lg">
                    <PlayCircle className="w-5 h-5" /> Watch Video Tour
                  </a>
                )}
              </div>

              {/* 5. Comprehensive Data Grid */}
              <DataGrid property={property} />

              {/* 6. Amenities */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                  {[
                    ['has_power_backup', Zap, 'Power Backup'],
                    ['has_lift', Layers, 'Lift'],
                    ['has_swimming_pool', Droplet, 'Swimming Pool'],
                    ['has_gym', Users, 'Gymnasium'],
                    ['has_park', Trees, 'Garden / Park'],
                    ['has_security', Shield, '24x7 Security'],
                    ['has_wifi', Wifi, 'Wi-Fi Connectivity'],
                    ['has_water_line', Droplet, 'Water Connection'],
                    ['has_drainage_line', Droplet, 'Drainage Line'],
                  ].map(([key, Icon, label]) => (
                    property[key as keyof PropertyDetail] && (
                      <div key={key as string} className="flex items-center gap-3 text-gray-700 bg-gray-50 p-3 rounded-xl">
                        <Icon className="w-5 h-5 text-[#4A9B6D]" />
                        <span className="font-medium text-sm">{label as string}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* 7. Verification & Legal */}
              <VerificationVault property={property} />

              {/* 8. Map & Location */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Location</h3>
                  <Button onClick={handleGetDirections} size="sm" className="bg-[#4285F4] hover:bg-[#3367d6] text-white">
                    <Navigation className="w-4 h-4 mr-2" /> Get Directions
                  </Button>
                </div>
                <div className="rounded-xl overflow-hidden h-64 border border-gray-200 relative">
                  <MapViewer lat={property.latitude} lng={property.longitude} address={property.address_line} />
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <p className="font-semibold text-gray-900 mb-1">Address:</p>
                  {property.address_line}, {property.locality}, {property.city} - {property.pincode}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Sticky Sidebar (Desktop) */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-6">

                {/* Main Action Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 ring-1 ring-gray-100">
                  <div className="mb-6 border-b border-gray-100 pb-6">
                    <p className="text-sm text-gray-500 mb-1">Total Price</p>
                    <div className="text-4xl font-extrabold text-[#2D5F3F]">{formatCurrency(property.total_price)}</div>
                    <p className="text-sm font-medium text-gray-500 mt-2 flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      {formatPricePerSqFt(property.price_per_sqft, property.carpet_area || property.super_builtup_area, property.total_price)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleContactOwner}
                      className="w-full h-12 text-lg font-bold bg-[#2D5F3F] hover:bg-[#1B3A2C] shadow-md hover:shadow-lg transition-all"
                      disabled={contactLoading}
                    >
                      {contactLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Phone className="w-5 h-5 mr-2" />}
                      Contact Owner
                    </Button>

                    <Button
                      onClick={handleWhatsAppChat}
                      className="w-full h-12 text-lg font-bold bg-[#25D366] hover:bg-[#1DA851] text-white shadow-md hover:shadow-lg transition-all border-none"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" /> Chat on WhatsApp
                    </Button>

                    <Button
                      onClick={toggleSave}
                      variant="outline"
                      className={`w-full h-12 font-semibold ${isSaved ? "text-red-600 border-red-200 bg-red-50" : "text-gray-700 border-gray-300"}`}
                    >
                      <Heart className={`w-5 h-5 mr-2 ${isSaved ? "fill-current" : ""}`} />
                      {isSaved ? "Property Saved" : "Save Property"}
                    </Button>

                    {/* Mandate Button & Status (Broker Only) */}
                    {user?.is_active_broker && (
                      <>
                        {property.has_active_mandate ? (
                          <div className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                            <div className="flex items-center gap-2 text-blue-700">
                              <Gavel className="w-5 h-5" />
                              <span className="font-semibold">Mandate Active</span>
                            </div>

                          </div>
                        ) : (
                          <Button
                            onClick={() => router.push(`/dashboard/mandates/create?property=${property.id}`)}
                            className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                          >
                            <Gavel className="w-5 h-5 mr-2" />
                            Request Mandate
                          </Button>
                        )}
                      </>
                    )}

                    {/* View Count (Owner Only) */}
                    {((user?.id === property.owner_details?.id) || user?.role === 'ADMIN') && property.views_count !== undefined && (
                      <div className="flex items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-600 font-medium">
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5 text-gray-900" />
                          <span>{property.views_count} Views</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Owner Brief */}
                  <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-4">
                    {property.owner_details?.profile_picture ? (
                      <img src={property.owner_details.profile_picture} alt={property.owner_details.full_name} className="w-12 h-12 rounded-full border border-green-100 object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#E8F5E9] border border-green-100 flex items-center justify-center font-bold text-xl text-[#2D5F3F]">
                        {property.owner_details?.full_name?.[0] || "U"}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Listed By</p>
                      <p className="font-bold text-gray-900 truncate max-w-[150px]">{property.owner_details?.full_name}</p>
                      <Badge variant="secondary" className="text-[10px] h-5 mt-1">{formatText(property.listed_by_display)}</Badge>
                    </div>
                  </div>
                </div>

                {/* Safety Tips */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Safety Tips
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside opacity-80">
                    <li>Never make payments before verifying documents.</li>
                    <li>Visit the property physically.</li>
                    <li>Check RERA registration.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 lg:hidden z-50 flex flex-col gap-3 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">

        {/* Price Tag Mobile */}
        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-gray-500 text-xs">Total Price</span>
            <div className="text-xl font-bold text-[#2D5F3F]">{formatCurrency(property.total_price)}</div>
          </div>
          <div className="text-right">
            <span className="text-gray-500 text-xs">Rate</span>
            <div className="font-medium text-gray-900">{formatPricePerSqFt(property.price_per_sqft, property.carpet_area || property.super_builtup_area, property.total_price)}</div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleWhatsAppChat} className="flex-1 h-12 rounded-xl bg-[#25D366] hover:bg-[#1DA851] text-white">
            <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
          </Button>
          <Button onClick={handleContactOwner} className="flex-1 h-12 rounded-xl bg-[#2D5F3F] hover:bg-[#1B3A2C]">
            <Phone className="w-5 h-5 mr-2" /> Call
          </Button>
        </div>

        {/* Request Mandate Button for Brokers (Mobile) */}
        {user?.is_active_broker && !property.has_active_mandate && (
          <Button
            onClick={() => router.push(`/dashboard/mandates/create?property=${property.id}`)}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            <Gavel className="w-5 h-5 mr-2" />
            Request Mandate
          </Button>
        )}
      </div>

      {/* Image Modal (Zoom) */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/95 z-[2000] flex items-center justify-center p-0 sm:p-4">
          <button onClick={() => setShowImageModal(false)} className="absolute top-4 right-4 text-white z-50 p-2 bg-black/50 rounded-full">
            <X className="w-8 h-8" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center">
            <button onClick={prevImage} className="absolute left-2 sm:left-8 text-white p-3 rounded-full bg-black/50 hover:bg-white/20 transition-all">
              <ChevronLeft className="w-8 h-8" />
            </button>

            <img src={activeImage} className="max-w-full max-h-[90vh] object-contain" alt="Full view" />

            <button onClick={nextImage} className="absolute right-2 sm:right-8 text-white p-3 rounded-full bg-black/50 hover:bg-white/20 transition-all">
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}

      {/* Contact Owner Details Modal */}
      {showContactModal && contactDetails && (
        <div className="fixed inset-0 bg-black/60 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowContactModal(false)}>
          <div className="bg-white w-full sm:w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>

            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-gray-900">Contact Owner</h3>
              <button onClick={() => setShowContactModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>

            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-14 h-14 bg-[#2D5F3F] rounded-full flex items-center justify-center text-2xl font-bold text-white">
                {contactDetails.full_name?.charAt(0)}
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">{contactDetails.full_name}</h4>
                <Badge variant="secondary" className="mt-1">Property Owner</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <a href={`tel:${contactDetails.phone_number}`} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-[#2D5F3F] transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-[#2D5F3F] group-hover:bg-[#2D5F3F] group-hover:text-white transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Mobile Number</p>
                    <p className="font-bold text-gray-900">{contactDetails.phone_number}</p>
                  </div>
                </div>
                <span className="text-[#2D5F3F] font-bold text-sm">Call Now</span>
              </a>

              {contactDetails.whatsapp_number && (
                <button onClick={handleWhatsAppChat} className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-[#25D366] transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500">WhatsApp</p>
                      <p className="font-bold text-gray-900">{contactDetails.whatsapp_number}</p>
                    </div>
                  </div>
                  <span className="text-[#25D366] font-bold text-sm">Chat</span>
                </button>
              )}
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              By contacting, you agree to SaudaPakka's Terms of Service.
            </p>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={typeof window !== 'undefined' ? window.location.href : ""}
        title={property.title}
      />

      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />
      <Footer />
    </>
  );
}
