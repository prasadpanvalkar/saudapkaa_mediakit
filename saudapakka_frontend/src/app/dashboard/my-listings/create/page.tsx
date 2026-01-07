"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Home, MapPin, IndianRupee, Image as ImageIcon, FileText,
  Bed, Bath, Ruler, Building, Calendar, CheckCircle, Upload,
  Sparkles, ArrowLeft, ArrowRight, Save, Check, X, Info, Camera,
  ChevronRight, AlertCircle
} from "lucide-react";

// --- Dynamic Imports ---
const LocationPicker = dynamic(() => import("@/components/location-picker"), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-xl" />
});

// --- Constants ---
const DOCUMENTS_CONFIG = [
  { key: 'building_commencement_certificate', label: 'Commencement Certificate', required: true },
  { key: 'building_completion_certificate', label: 'Completion Certificate', required: true },
  { key: 'layout_sanction', label: 'Layout Sanction', required: true },
  { key: 'layout_order', label: 'Layout Order', required: true },
  { key: 'na_order_or_gunthewari', label: 'NA/Gunthewari Order', required: true },
  { key: 'mojani_nakasha', label: 'Mojani Nakasha', required: true },
  { key: 'doc_7_12_or_pr_card', label: '7/12 / P.R. Card', required: true },
  { key: 'title_search_report', label: 'Title Search Report', required: true },
  { key: 'rera_project_certificate', label: 'RERA Certificate', required: false },
  { key: 'gst_registration', label: 'G.S.T. Registration', required: false },
  { key: 'sale_deed_registration_copy', label: 'Sale Deed Copy', required: false },
];

const PROPERTY_TYPES = [
  { value: 'FLAT', label: 'Flat', icon: '🏢' },
  { value: 'VILLA_BUNGALOW', label: 'Villa/Bungalow', icon: '🏡' },
  { value: 'PLOT', label: 'Plot', icon: '🏞️' },
  { value: 'LAND', label: 'Land', icon: '🚜' },
  { value: 'COMMERCIAL_UNIT', label: 'Commercial', icon: '💼' }
];

const SUB_TYPE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  VILLA_BUNGALOW: [
    { value: 'BUNGALOW', label: 'Bungalow' },
    { value: 'TWIN_BUNGALOW', label: 'Twin Bungalow' },
    { value: 'ROWHOUSE', label: 'Rowhouse' },
    { value: 'VILLA', label: 'Villa' },
  ],
  PLOT: [
    { value: 'RES_PLOT', label: 'Residential Plot' },
    { value: 'COM_PLOT', label: 'Commercial Plot' },
  ],
  LAND: [
    { value: 'AGRI_LAND', label: 'Agricultural Land' },
    { value: 'IND_LAND', label: 'Industrial Land' },
  ],
  COMMERCIAL_UNIT: [
    { value: 'SHOP', label: 'Shop' },
    { value: 'OFFICE', label: 'Office' },
    { value: 'SHOWROOM', label: 'Showroom' },
  ],
};

const AMENITIES = [
  { key: 'has_power_backup', label: 'Power Backup' },
  { key: 'has_lift', label: 'Lift' },
  { key: 'has_swimming_pool', label: 'Swimming Pool' },
  { key: 'has_club_house', label: 'Club House' },
  { key: 'has_gym', label: 'Gymnasium' },
  { key: 'has_park', label: 'Garden/Park' },
  { key: 'has_reserved_parking', label: 'Parking' },
  { key: 'has_security', label: '24/7 Security' },
  { key: 'is_vastu_compliant', label: 'Vastu' },
  { key: 'has_intercom', label: 'Intercom' },
  { key: 'has_piped_gas', label: 'Piped Gas' },
  { key: 'has_wifi', label: 'WiFi' },
];

export default function CreatePropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const totalSteps = 5;

  // --- State Management ---
  const [formData, setFormData] = useState({
    title: "", description: "", listing_type: "SALE", property_type: "FLAT",
    sub_type: "", bhk_config: 1, bathrooms: 1, balconies: 0,
    super_builtup_area: "", carpet_area: "", plot_area: "",
    furnishing_status: "UNFURNISHED", total_price: "",
    maintenance_charges: "0", maintenance_interval: "MONTHLY",
    project_name: "", locality: "", city: "", pincode: "",
    latitude: 19.8762, longitude: 75.3433,
    landmarks: "", specific_floor: "", total_floors: "", facing: "",
    availability_status: "READY", possession_date: "", age_of_construction: 0,
    listed_by: "OWNER", whatsapp_number: "", video_url: "",
    has_power_backup: false, has_lift: false, has_swimming_pool: false,
    has_club_house: false, has_gym: false, has_park: false,
    has_reserved_parking: false, has_security: false, is_vastu_compliant: false,
    has_intercom: false, has_piped_gas: false, has_wifi: false,
  });

  const [addressLines, setAddressLines] = useState({ line1: "", line2: "", line3: "" });
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [floorPlan, setFloorPlan] = useState<File | null>(null);
  const [legalDocuments, setLegalDocuments] = useState<Record<string, File | null>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Auth Check ---
  useEffect(() => {
    if (!mounted) return;
    const token = Cookies.get('access_token');
    if (!token) {
      router.push('/login');
    }
  }, [router, mounted]);

  if (!mounted) return null;

  const progress = (step / totalSteps) * 100;

  // --- Validation ---
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.title.trim()) newErrors.title = "Title is required";
      if (!formData.description.trim()) newErrors.description = "Description is required";
    }

    if (currentStep === 2) {
      if (!formData.total_price || parseFloat(formData.total_price) <= 0) {
        newErrors.total_price = "Valid price is required";
      }
      if (!formData.super_builtup_area || parseFloat(formData.super_builtup_area) <= 0) {
        newErrors.super_builtup_area = "Super built-up area is required";
      }
      if (!formData.carpet_area || parseFloat(formData.carpet_area) <= 0) {
        newErrors.carpet_area = "Carpet area is required";
      }
    }

    if (currentStep === 3) {
      if (!addressLines.line1.trim()) newErrors.line1 = "Building/House info required";
      if (!formData.locality.trim()) newErrors.locality = "Locality is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";
    }

    if (currentStep === 4) {
      if (galleryImages.length === 0) {
        newErrors.gallery = "At least one property image is required";
      }
    }

    if (currentStep === 5) {
      const requiredDocs = DOCUMENTS_CONFIG.filter(d => d.required);
      const missingDocs = requiredDocs.filter(d => !legalDocuments[d.key]);
      if (missingDocs.length > 0) {
        newErrors.documents = `Missing: ${missingDocs.map(d => d.label).join(', ')}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddressLinesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressLines(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, totalSteps));
    }
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(5)) {
      return;
    }

    setLoading(true);

    // Combine address lines
    const fullAddress = [addressLines.line1, addressLines.line2, addressLines.line3]
      .filter(line => line.trim() !== "")
      .join(", ");

    try {
      const data = new FormData();

      // Basic fields mapping & type casting
      Object.entries(formData).forEach(([key, val]) => {
        if (val !== "" && val !== null && val !== undefined) {
          const numericFields = ['bhk_config', 'bathrooms', 'balconies', 'age_of_construction'];
          const decimalFields = ['total_price', 'super_builtup_area', 'carpet_area', 'plot_area', 'maintenance_charges'];
          const integerFields = ['specific_floor', 'total_floors'];

          if (numericFields.includes(key) || decimalFields.includes(key) || integerFields.includes(key)) {
            data.append(key, val.toString());
          } else if (typeof val === 'boolean') {
            data.append(key, val ? 'true' : 'false');
          } else {
            data.append(key, val.toString());
          }
        }
      });

      // Address
      data.append('address_line', fullAddress || formData.locality || "Address not provided");

      // Documents
      Object.entries(legalDocuments).forEach(([key, file]) => {
        if (file) data.append(key, file);
      });

      // Floor Plan
      if (floorPlan) {
        data.append('floor_plan', floorPlan);
      }

      const res = await api.post("/api/properties/", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // Gallery upload
      if (galleryImages.length > 0) {
        await Promise.all(galleryImages.map((file, i) => {
          const imgData = new FormData();
          imgData.append("image", file);
          imgData.append("is_thumbnail", i === 0 ? "true" : "false");
          return api.post(`/api/properties/${res.data.id}/upload_image/`, imgData);
        }));
      }

      router.push("/dashboard/my-listings");
    } catch (err: any) {
      console.error("Submission error:", err.response?.data);
      const errorMsg = err.response?.data
        ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join('\n')
        : "Check all required fields and documents.";
      alert("Error creating listing:\n" + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* --- Progress Header --- */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Exit
            </Button>
            <span className="text-sm font-bold text-[#2D5F3F]">Step {step} of {totalSteps}</span>
          </div>
          <Progress value={progress} className="h-2 bg-gray-100" />
        </div>
      </div>

      {/* --- Main Form Body --- */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* STEP 1: CATEGORY & TITLE */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D5F3F]">What are you listing?</h2>
                  <p className="text-gray-500 text-base sm:text-lg">Select the property type to customize your listing journey.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  {PROPERTY_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, property_type: type.value, sub_type: "" }))}
                      className={`group p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-2 sm:gap-3 shadow-sm hover:shadow-md ${formData.property_type === type.value
                        ? 'border-[#4A9B6D] bg-[#E8F5E9] text-[#2D5F3F] scale-[1.02]'
                        : 'border-white bg-white hover:border-gray-200'
                        }`}
                    >
                      <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform">{type.icon}</span>
                      <span className="text-xs sm:text-sm font-bold tracking-tight text-center">{type.label}</span>
                    </button>
                  ))}
                </div>

                {SUB_TYPE_OPTIONS[formData.property_type] && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-100"
                  >
                    <Label className="text-sm font-bold uppercase tracking-widest text-[#2D5F3F] mb-4 block">Specific Category</Label>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {SUB_TYPE_OPTIONS[formData.property_type].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, sub_type: opt.value }))}
                          className={`py-3 sm:py-4 px-4 sm:px-5 rounded-xl sm:rounded-2xl border-2 text-sm font-bold transition-all ${formData.sub_type === opt.value
                            ? 'border-[#4A9B6D] bg-[#E8F5E9] text-[#2D5F3F]'
                            : 'border-gray-50 bg-gray-50/50 hover:bg-gray-100'
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-100 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-bold tracking-wide">Catchy Title *</Label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Modern 3BHK with Panoramic City Views"
                      className="rounded-xl border-gray-200 bg-gray-50/30 p-4 h-12 sm:h-14"
                    />
                    {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-bold tracking-wide">Detailed Description *</Label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Tell potential buyers what makes this place special..."
                      className="rounded-xl border-gray-200 bg-gray-50/30 p-4 h-32 sm:h-40 resize-none"
                    />
                    {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PRICING & CONFIG */}
            {step === 2 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D5F3F]">Pricing & Details</h2>
                  <p className="text-gray-500 text-base sm:text-lg">Set a competitive price and share technical details.</p>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-100 space-y-8">
                  <div className="relative">
                    <Label className="text-base sm:text-lg font-bold text-gray-800 mb-2 block">Total Price *</Label>
                    <div className="relative group">
                      <div className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 bg-[#2D5F3F] p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-white shadow-lg shadow-green-200">
                        <IndianRupee className="w-4 h-4 sm:w-6 sm:h-6" />
                      </div>
                      <Input
                        name="total_price"
                        type="number"
                        value={formData.total_price}
                        onChange={handleChange}
                        className="pl-14 sm:pl-20 py-6 sm:py-8 text-2xl sm:text-3xl font-black rounded-xl sm:rounded-2xl border-2 border-gray-100 focus:border-[#4A9B6D] focus:ring-4 focus:ring-green-50 transition-all"
                        placeholder="0"
                      />
                    </div>
                    {errors.total_price && <p className="text-red-500 text-sm mt-2">{errors.total_price}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3">
                      <Label className="font-bold text-sm text-gray-700">Super Built-up (sq.ft) *</Label>
                      <Input
                        name="super_builtup_area"
                        type="number"
                        value={formData.super_builtup_area}
                        onChange={handleChange}
                        className="rounded-xl border-gray-200 bg-gray-50/30 font-bold"
                      />
                      {errors.super_builtup_area && <p className="text-red-500 text-sm">{errors.super_builtup_area}</p>}
                    </div>
                    <div className="space-y-3">
                      <Label className="font-bold text-sm text-gray-700">Carpet Area (sq.ft) *</Label>
                      <Input
                        name="carpet_area"
                        type="number"
                        value={formData.carpet_area}
                        onChange={handleChange}
                        className="rounded-xl border-gray-200 bg-gray-50/30 font-bold"
                      />
                      {errors.carpet_area && <p className="text-red-500 text-sm">{errors.carpet_area}</p>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
                    <Label className="font-bold text-xs uppercase text-gray-400 mb-3">BHK Configuration</Label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, bhk_config: Math.max(1, p.bhk_config - 1) }))}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xl"
                      >
                        -
                      </button>
                      <span className="text-2xl font-black text-[#2D5F3F] w-12 text-center">{formData.bhk_config}</span>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, bhk_config: Math.min(5, p.bhk_config + 1) }))}
                        className="w-10 h-10 rounded-full bg-[#2D5F3F] text-white flex items-center justify-center font-bold text-xl"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
                    <Label className="font-bold text-xs uppercase text-gray-400 mb-3">Bathrooms</Label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, bathrooms: Math.max(1, p.bathrooms - 1) }))}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xl"
                      >
                        -
                      </button>
                      <span className="text-2xl font-black text-[#2D5F3F] w-12 text-center">{formData.bathrooms}</span>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, bathrooms: p.bathrooms + 1 }))}
                        className="w-10 h-10 rounded-full bg-[#2D5F3F] text-white flex items-center justify-center font-bold text-xl"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
                    <Label className="font-bold text-xs uppercase text-gray-400 mb-3">Balconies</Label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, balconies: Math.max(0, p.balconies - 1) }))}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xl"
                      >
                        -
                      </button>
                      <span className="text-2xl font-black text-[#2D5F3F] w-12 text-center">{formData.balconies}</span>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, balconies: p.balconies + 1 }))}
                        className="w-10 h-10 rounded-full bg-[#2D5F3F] text-white flex items-center justify-center font-bold text-xl"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <Label className="font-bold text-sm">Age (Years)</Label>
                    <Input
                      name="age_of_construction"
                      type="number"
                      value={formData.age_of_construction}
                      onChange={handleChange}
                      className="rounded-xl border-gray-200 bg-gray-50/30 font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-sm">Possession Date</Label>
                    <Input
                      name="possession_date"
                      type="date"
                      value={formData.possession_date}
                      onChange={handleChange}
                      className="rounded-xl border-gray-200 bg-gray-50/30 font-bold h-10 px-3"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: LOCATION */}
            {step === 3 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D5F3F]">Pin the Location</h2>
                  <p className="text-gray-500 text-base sm:text-lg">Precise location helps buyers find your property 50% faster.</p>
                </div>

                <div className="bg-white p-2 rounded-2xl sm:rounded-[2.5rem] shadow-2xl shadow-gray-200 border-2 sm:border-4 border-white overflow-hidden h-64 sm:h-96 relative">
                  <LocationPicker
                    initialLat={formData.latitude}
                    initialLng={formData.longitude}
                    onLocationSelect={(lat, lng) => setFormData(p => ({ ...p, latitude: lat, longitude: lng }))}
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg border border-gray-100 flex items-center gap-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-[#2D5F3F]" />
                    <span className="text-[10px] sm:text-xs font-bold text-gray-700">Drag to Adjust</span>
                  </div>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-100 space-y-5">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Input
                        name="line1"
                        value={addressLines.line1}
                        onChange={handleAddressLinesChange}
                        placeholder="House/Flat No, Building Name *"
                        className="rounded-xl border-gray-200 bg-gray-50/30 h-12"
                      />
                      {errors.line1 && <p className="text-red-500 text-sm mt-1">{errors.line1}</p>}
                    </div>
                    <Input
                      name="line2"
                      value={addressLines.line2}
                      onChange={handleAddressLinesChange}
                      placeholder="Street / Area Name"
                      className="rounded-xl border-gray-200 bg-gray-50/30 h-12"
                    />
                    <Input
                      name="line3"
                      value={addressLines.line3}
                      onChange={handleAddressLinesChange}
                      placeholder="Additional Address Details (Optional)"
                      className="rounded-xl border-gray-200 bg-gray-50/30 h-12"
                    />
                  </div>
                  <div>
                    <Input
                      name="locality"
                      value={formData.locality}
                      onChange={handleChange}
                      placeholder="Locality / Area *"
                      className="rounded-xl border-gray-200 bg-gray-50/30 h-12 font-bold"
                    />
                    {errors.locality && <p className="text-red-500 text-sm mt-1">{errors.locality}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City *"
                        className="rounded-xl border-gray-200 bg-gray-50/30 h-12"
                      />
                      {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <Input
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="Pincode *"
                        className="rounded-xl border-gray-200 bg-gray-50/30 h-12"
                      />
                      {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: AMENITIES & PHOTOS */}
            {step === 4 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D5F3F]">Photos & Features</h2>
                  <p className="text-gray-500 text-base sm:text-lg">Properties with 5+ photos receive 3x more inquiries.</p>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-100">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 block">Select Amenities</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {AMENITIES.map(a => (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, [a.key]: !p[a.key as keyof typeof p] }))}
                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-xs sm:text-sm font-bold transition-all flex items-center justify-between group ${formData[a.key as keyof typeof formData]
                          ? 'border-[#4A9B6D] bg-[#E8F5E9] text-[#2D5F3F]'
                          : 'border-gray-50 bg-gray-50/50 hover:bg-gray-100'
                          }`}
                      >
                        <span className="truncate">{a.label}</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ml-2 ${formData[a.key as keyof typeof formData]
                          ? 'bg-[#2D5F3F] text-white'
                          : 'bg-gray-200 group-hover:bg-gray-300'
                          }`}>
                          {formData[a.key as keyof typeof formData] && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-100">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 block">Property Gallery *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                    {galleryImages.map((file, i) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={i}
                        className="relative aspect-square rounded-xl sm:rounded-[1.5rem] overflow-hidden bg-gray-100 shadow-md group"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Property ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <button
                          type="button"
                          onClick={() => setGalleryImages(p => p.filter((_, idx) => idx !== i))}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 sm:p-2 shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0 duration-300"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-2 left-2 bg-[#2D5F3F] text-white text-[10px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest shadow-lg">
                            Cover
                          </span>
                        )}
                      </motion.div>
                    ))}
                    {galleryImages.length < 15 && (
                      <label className="aspect-square border-2 sm:border-4 border-dashed border-gray-100 rounded-xl sm:rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#4A9B6D]/30 transition-all group">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-green-50 group-hover:text-[#2D5F3F] transition-colors">
                          <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-bold text-gray-500 group-hover:text-gray-700 text-center px-2">
                          Add Photos
                        </p>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              setGalleryImages(p => [...p, ...Array.from(e.target.files!)]);
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.gallery;
                                return newErrors;
                              });
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {errors.gallery && <p className="text-red-500 text-sm mt-2">{errors.gallery}</p>}
                  <p className="text-xs text-center text-gray-400 font-medium">
                    Drag and drop photos or click to upload. Maximum 15 photos.
                  </p>
                </div>

                {/* Floor Plan Upload */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Floor Plan</Label>
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">
                      Recommended
                    </span>
                  </div>

                  {floorPlan ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative w-full h-48 sm:h-64 rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-50 border-2 border-[#4A9B6D] group"
                    >
                      <img
                        src={URL.createObjectURL(floorPlan)}
                        alt="Floor plan"
                        className="w-full h-full object-contain p-4"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      <button
                        type="button"
                        onClick={() => setFloorPlan(null)}
                        className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-all"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                        <div className="p-2 bg-green-50 text-[#2D5F3F] rounded-xl font-black text-[10px] uppercase tracking-widest">
                          Selected
                        </div>
                        <p className="text-xs font-bold text-gray-700 truncate flex-1">{floorPlan.name}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <label className="w-full h-48 sm:h-64 border-2 sm:border-4 border-dashed border-gray-100 rounded-2xl sm:rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#4A9B6D]/30 transition-all group">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                        <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <h4 className="mt-4 text-base sm:text-lg font-black text-gray-800">Upload Floor Plan</h4>
                      <p className="mt-1 text-xs sm:text-sm font-bold text-gray-400 text-center px-8">
                        Clear architectural drawing helps buyers visualize their future home.
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setFloorPlan(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: LEGAL DOCS */}
            {step === 5 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D5F3F]">Verify Your Property</h2>
                  <p className="text-gray-500 text-base sm:text-lg">
                    Upload official documents to earn the "Verified" badge and build trust.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] text-white shadow-xl shadow-blue-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 relative overflow-hidden">
                  <div className="absolute top-[-20%] right-[-10%] w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                  <div className="bg-white/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-md">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black mb-1">Boost Your Listing</h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      Properties with complete documentation are 70% more likely to be featured on our homepage.
                    </p>
                  </div>
                </div>

                {errors.documents && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{errors.documents}</p>
                  </div>
                )}

                <div className="grid gap-3 sm:gap-4">
                  {DOCUMENTS_CONFIG.map(doc => (
                    <label
                      key={doc.key}
                      className={`group flex items-center justify-between p-4 sm:p-6 bg-white border-2 rounded-2xl sm:rounded-3xl cursor-pointer transition-all duration-300 ${legalDocuments[doc.key]
                        ? 'border-[#4A9B6D] bg-[#F1F8F4]'
                        : 'border-gray-50 hover:border-gray-200 hover:shadow-lg'
                        }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${legalDocuments[doc.key]
                          ? 'bg-[#2D5F3F] text-white shadow-lg shadow-green-100'
                          : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                          }`}>
                          <FileText className="w-5 h-5 sm:w-7 sm:h-7" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <p className={`font-black text-xs sm:text-sm tracking-tight truncate ${legalDocuments[doc.key] ? 'text-[#2D5F3F]' : 'text-gray-800'
                            }`}>
                            {doc.label} {doc.required && <span className="text-red-500">*</span>}
                          </p>
                          <p className="text-[11px] font-bold text-gray-400 truncate">
                            {legalDocuments[doc.key]?.name || 'Format: PDF, JPG, PNG'}
                          </p>
                        </div>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setLegalDocuments(p => ({ ...p, [doc.key]: e.target.files![0] }));
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.documents;
                              return newErrors;
                            });
                          }
                        }}
                      />
                      {legalDocuments[doc.key] ? (
                        <div className="flex items-center gap-2 bg-[#2D5F3F] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-in zoom-in-50 duration-300">
                          <Check className="w-3 h-3" /> Ready
                        </div>
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-white group-hover:text-gray-500 transition-all border border-transparent group-hover:border-gray-100">
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* --- Sticky Action Bar --- */}
      <footer className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 sm:p-6 z-[60]">
        <div className="max-w-5xl mx-auto flex items-center gap-3 sm:gap-4">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 sm:px-8 py-4 sm:py-5 rounded-xl sm:rounded-[1.5rem] font-black text-gray-500 hover:bg-gray-100 transition-all active:scale-95"
            >
              Back
            </button>
          )}
          {step < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 py-4 sm:py-5 rounded-xl sm:rounded-[1.5rem] bg-[#2D5F3F] text-white font-black text-base sm:text-lg shadow-xl shadow-green-100 hover:bg-[#1B3A26] hover:shadow-2xl hover:shadow-green-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              Continue <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`flex-1 py-4 sm:py-5 rounded-xl sm:rounded-[1.5rem] bg-gradient-to-r from-[#2D5F3F] to-[#4A9B6D] text-white font-black text-base sm:text-lg shadow-xl shadow-green-100 transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-2xl hover:shadow-green-200 active:scale-[0.98]'
                }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Publishing Listing...</span>
                  <span className="sm:hidden">Publishing...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Publish Property</span>
                  <span className="sm:hidden">Publish</span>
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
