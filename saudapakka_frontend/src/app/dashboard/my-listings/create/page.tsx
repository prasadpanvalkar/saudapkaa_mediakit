"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  MapPin, IndianRupee, FileText, Check, X, Upload, Sparkles,
  ArrowLeft, AlertCircle, Home, ChevronRight, CheckCircle, ArrowRight
} from "lucide-react";
import Link from "next/link";

// --- Dynamic Imports ---
const SmartLocationPicker = dynamic(() => import("@/components/maps/SmartLocationPicker"), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-xl" />
});

// --- Constants ---
const DOCUMENTS_CONFIG = [
  { key: "building_commencement_certificate", label: "Commencement Certificate", required: true },
  { key: "building_completion_certificate", label: "Completion Certificate", required: true },
  { key: "layout_sanction", label: "Layout Sanction", required: true },
  { key: "layout_order", label: "Layout Order", required: true },
  { key: "na_order_or_gunthewari", label: "NA/Gunthewari Order", required: true },
  { key: "mojani_nakasha", label: "Mojani / Nakasha", required: true },
  { key: "doc_7_12_or_pr_card", label: "7/12 / P.R. Card", required: true },
  { key: "title_search_report", label: "Title Search Report", required: true },
  { key: "rera_project_certificate", label: "RERA Certificate", required: false },
  { key: "gst_registration", label: "G.S.T. Registration", required: false },
  { key: "sale_deed_registration_copy", label: "Sale Deed Copy", required: false },
];

const PROPERTY_TYPES = [
  { value: "FLAT", label: "Flat", icon: "🏢" },
  { value: "VILLA_BUNGALOW", label: "Villa/Bungalow", icon: "🏡" },
  { value: "PLOT", label: "Plot", icon: "📐" },
  { value: "LAND", label: "Land", icon: "🌾" },
  { value: "COMMERCIAL_UNIT", label: "Commercial", icon: "🏪" }
];

const SUBTYPE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  VILLA_BUNGALOW: [
    { value: "BUNGALOW", label: "Bungalow" },
    { value: "TWIN_BUNGALOW", label: "Twin Bungalow" },
    { value: "ROWHOUSE", label: "Rowhouse" },
    { value: "VILLA", label: "Villa" },
  ],
  PLOT: [
    { value: "RES_PLOT", label: "Residential Plot" },
    { value: "RES_PLOT_GUNTHEWARI", label: "Residential Plot (Gunthewari)" },
    { value: "COM_PLOT", label: "Commercial Plot" },
  ],
  LAND: [
    { value: "AGRI_LAND", label: "Agricultural Land" },
    { value: "IND_LAND", label: "Industrial Land" },
  ],
  COMMERCIAL_UNIT: [
    { value: "SHOP", label: "Shop" },
    { value: "OFFICE", label: "Office" },
    { value: "SHOWROOM", label: "Showroom" },
  ],
};

const RESIDENTIAL_AMENITIES = [
  { key: "has_power_backup", label: "Power Backup" },
  { key: "has_lift", label: "Lift" },
  { key: "has_swimming_pool", label: "Swimming Pool" },
  { key: "has_clubhouse", label: "Club House" },
  { key: "has_gym", label: "Gymnasium" },
  { key: "has_park", label: "Garden/Park" },
  { key: "has_reserved_parking", label: "Parking" },
  { key: "has_security", label: "24/7 Security" },
  { key: "is_vastu_compliant", label: "Vastu" },
  { key: "has_intercom", label: "Intercom" },
  { key: "has_piped_gas", label: "Piped Gas" },
  { key: "has_wifi", label: "WiFi" },
];

const PLOT_AMENITIES = [
  { key: "has_drainage_line", label: "Drainage Line" },
  { key: "has_one_gate_entry", label: "One Gate Entry" },
  { key: "has_jogging_park", label: "Jogging Park" },
  { key: "has_children_park", label: "Children Park" },
  { key: "has_temple", label: "Temple" },
  { key: "has_water_line", label: "Water Line" },
  { key: "has_street_light", label: "Street Light" },
  { key: "has_internal_roads", label: "Internal Roads" },
];
// Keep AMENITIES as a fallback or union if needed, but we'll use conditional logic
const AMENITIES = [...RESIDENTIAL_AMENITIES, ...PLOT_AMENITIES];

const STEP_NAMES = [
  { id: 1, name: 'Classification' },
  { id: 2, name: 'Specifications' },
  { id: 3, name: 'Location' },
  { id: 4, name: 'Media' },
  { id: 5, name: 'Verification' },
  { id: 6, name: 'Review' }
];

export default function CreatePropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const totalSteps = 6;

  // --- State Management ---
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    listing_type: "SALE",
    property_type: "FLAT",
    subtype: "",
    bhk_config: 1,
    bathrooms: 1,
    balconies: 0,
    super_builtup_area: "",
    carpet_area: "",
    plot_area: "",
    furnishing_status: "UNFURNISHED",
    total_price: "",
    maintenance_charges: 0,
    maintenance_interval: "MONTHLY",
    project_name: "",
    locality: "",
    city: "",
    pincode: "",
    latitude: 19.8762,
    longitude: 75.3433,
    landmarks: "",
    specific_floor: "",
    total_floors: "",
    facing: "",
    availability_status: "READY",
    possession_date: "",
    age_of_construction: 0,
    listed_by: "OWNER",
    whatsapp_number: "",
    video_url: "",
    has_power_backup: false,
    has_lift: false,
    has_swimming_pool: false,
    has_clubhouse: false,
    has_gym: false,
    has_park: false,
    has_reserved_parking: false,
    has_security: false,
    is_vastu_compliant: false,
    has_intercom: false,
    has_piped_gas: false,
    has_wifi: false,

    // Plot Amenities
    has_drainage_line: false,
    has_one_gate_entry: false,
    has_jogging_park: false,
    has_children_park: false,
    has_temple: false,
    has_water_line: false,
    has_street_light: false,
    has_internal_roads: false,
    price_per_sqft: "",
  });

  const [addressLines, setAddressLines] = useState({ line1: "", line2: "", line3: "" });
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [floorPlans, setFloorPlans] = useState<File[]>([]);
  const [legalDocuments, setLegalDocuments] = useState<Record<string, File | null>>({});
  const [mounted, setMounted] = useState(false);

  // Auto-generated title and description
  const [autoGeneratedTitle, setAutoGeneratedTitle] = useState("");
  const [autoGeneratedDescription, setAutoGeneratedDescription] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Auth Check ---
  useEffect(() => {
    if (!mounted) return;
    const token = Cookies.get("access_token");
    if (!token) {
      router.push("/login");
    }
  }, [router, mounted]);



  // Auto-generate title and description
  useEffect(() => {
    generateTitleAndDescription();
  }, [formData.property_type, formData.subtype, formData.bhk_config, formData.city, formData.locality, formData.listing_type, formData.bathrooms, formData.balconies, formData.furnishing_status, formData.facing, formData.specific_floor, formData.total_floors, formData.availability_status, formData.possession_date, formData.super_builtup_area, formData.project_name]);

  // Auto-populate description when reaching review step
  useEffect(() => {
    if (step === 6 && !formData.description.trim()) {
      setFormData(prev => ({
        ...prev,
        description: autoGeneratedDescription
      }));
    }
  }, [step, autoGeneratedDescription]);

  const generateTitleAndDescription = () => {
    let title = "";
    let desc = "";

    // Generate Title
    // Generate Title
    if (formData.bhk_config > 0 && ["FLAT", "VILLA_BUNGALOW"].includes(formData.property_type)) {
      if (formData.bhk_config === 0.5) {
        title += "1RK "; // 1 Room Kitchen
      } else {
        title += `${formData.bhk_config} BHK `;
      }
    }

    if (formData.subtype) {
      if (formData.subtype === "RES_PLOT_GUNTHEWARI") {
        title += "Residential Plot (Gunthewari) ";
      } else {
        const subtypeLabel = SUBTYPE_OPTIONS[formData.property_type]?.find(s => s.value === formData.subtype)?.label || "";
        title += `${subtypeLabel} `;
      }
    } else {
      const typeLabel = PROPERTY_TYPES.find(t => t.value === formData.property_type)?.label || "";
      title += `${typeLabel} `;
    }

    title += `for ${formData.listing_type === "SALE" ? "Sale" : "Rent"} `;

    if (formData.locality && formData.city) {
      title += `in ${formData.locality}, ${formData.city}`;
    } else if (formData.city) {
      title += `in ${formData.city}`;
    }

    setAutoGeneratedTitle(title.trim());

    // Generate Description
    if (["FLAT", "VILLA_BUNGALOW"].includes(formData.property_type)) {
      desc += `${formData.bhk_config > 0 ? formData.bhk_config + " BHK" : "Beautiful"} ${formData.subtype ? SUBTYPE_OPTIONS[formData.property_type]?.find(s => s.value === formData.subtype)?.label.toLowerCase() : formData.property_type.toLowerCase()} `;
      desc += `available for ${formData.listing_type.toLowerCase()}`;
      if (formData.locality) desc += ` in ${formData.locality}`;
      desc += ". ";

      const details = [];
      if (formData.bathrooms > 0) details.push(`${formData.bathrooms} bathrooms`);
      if (formData.balconies > 0) details.push(`${formData.balconies} balconies`);
      if (formData.furnishing_status && formData.furnishing_status !== "UNFURNISHED") details.push(`${formData.furnishing_status.toLowerCase().replace('_', ' ')} furnished`);
      if (formData.facing) details.push(`${formData.facing} facing`);

      if (details.length > 0) {
        desc += `This property features ${details.join(", ")}. `;
      }

      if (formData.specific_floor && formData.total_floors) {
        desc += `Located on ${formData.specific_floor} out of ${formData.total_floors} floors. `;
      }

      if (formData.availability_status === "READY") {
        desc += "Ready to move in. ";
      } else if (formData.possession_date) {
        desc += `Possession expected by ${formData.possession_date}. `;
      }

      if (formData.super_builtup_area) {
        desc += `Super built-up area: ${formData.super_builtup_area} sq.ft. `;
      }
    } else {
      // For plots, land, and commercial
      const typeLabel = PROPERTY_TYPES.find(t => t.value === formData.property_type)?.label || "";
      desc += `${typeLabel} available for ${formData.listing_type.toLowerCase()}`;
      if (formData.locality) desc += ` in ${formData.locality}`;
      desc += ". ";

      if (formData.plot_area || formData.super_builtup_area) {
        desc += `Area: ${formData.plot_area || formData.super_builtup_area} sq.ft. `;
      }
    }

    if (formData.project_name) {
      desc += `Part of ${formData.project_name} project. `;
    }

    desc += "Contact us for more details and site visit.";

    setAutoGeneratedDescription(desc.trim());
  };

  const copyAutoTitle = () => {
    setFormData(prev => ({ ...prev, title: autoGeneratedTitle }));
  };

  const copyAutoDescription = () => {
    setFormData(prev => ({ ...prev, description: autoGeneratedDescription }));
  };

  if (!mounted) return null;

  const progress = (step / totalSteps) * 100;

  // --- Validation ---
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.property_type) newErrors.property_type = "Property type is required";
      if (!formData.listing_type) newErrors.listing_type = "Listing type is required";
    }

    if (currentStep === 2) {
      if (!formData.total_price || parseFloat(formData.total_price) <= 0)
        newErrors.total_price = "Valid price is required";

      // REMOVED: Super built-up area and carpet area validation
      // These are now optional fields

      if (formData.availability_status === "UNDER_CONSTRUCTION" && !formData.possession_date) {
        newErrors.possession_date = "Possession date required for under construction";
      }

      if (["FLAT", "VILLA_BUNGALOW"].includes(formData.property_type)) {
        if (!formData.specific_floor)
          newErrors.specific_floor = "Floor number is required";
        if (!formData.total_floors || parseInt(formData.total_floors) <= 0)
          newErrors.total_floors = "Total floors is required";
      }
    }

    if (currentStep === 3) {
      if (!addressLines.line1.trim()) newErrors.line1 = "Building/House info required";
      if (!formData.locality.trim()) newErrors.locality = "Locality is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";
    }

    if (currentStep === 4) {
      if (galleryImages.length === 0) newErrors.gallery = "At least one property image is required";
    }

    if (currentStep === 5) {
      const requiredDocs = DOCUMENTS_CONFIG.filter(d => d.required);
      const missingDocs = requiredDocs.filter(d => !legalDocuments[d.key]);
      if (missingDocs.length > 0) {
        newErrors.documents = `Missing: ${missingDocs.map(d => d.label).join(", ")}`;
      }
    }

    if (currentStep === 6) {
      if (!formData.description.trim()) {
        newErrors.description = "Description is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
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

  const prevStep = () => {
    setStep(s => Math.max(s - 1, 1));
  };

  // Validate based on property type
  const validatePropertyTypeFields = (): boolean => {
    const errors: Record<string, string> = {};

    if (["FLAT", "VILLA_BUNGALOW", "COMMERCIAL_UNIT"].includes(formData.property_type)) {
      // For residential properties, certain fields are required
      // bhk_config can be 0 (for RK/Studio) or 0.5 (for 1RK), so check for undefined/null/empty string explicitly but allow 0
      if (formData.bhk_config === undefined || formData.bhk_config === null || (formData.bhk_config as any) === "") {
        errors.bhk_config = "BHK configuration is required for this property type";
      }
      if (!formData.specific_floor) {
        errors.specific_floor = "Floor number is required for this property type";
      }
      if (!formData.total_floors) {
        errors.total_floors = "Total floors is required for this property type";
      }
    }

    if (["PLOT", "LAND"].includes(formData.property_type)) {
      // For plots/land, plot_area should be filled
      if (!formData.plot_area) {
        errors.plot_area = "Plot area is required for plots and land";
      }
    }

    if (Object.keys(errors).length > 0) {
      alert("Please fix the following errors:\n" + Object.values(errors).join("\n"));
      return false;
    }
    return true;
  };

  // Helper function to get only relevant fields based on property type
  const getRelevantFormData = () => {
    const baseFields = {
      title: formData.title,
      description: formData.description,
      listing_type: formData.listing_type,
      property_type: formData.property_type,
      subtype: formData.subtype,
      total_price: formData.total_price,
      maintenance_charges: formData.maintenance_charges,
      maintenance_interval: formData.maintenance_interval,
      project_name: formData.project_name,
      locality: formData.locality,
      city: formData.city,
      pincode: formData.pincode,
      latitude: formData.latitude,
      longitude: formData.longitude,
      landmarks: formData.landmarks,
      availability_status: formData.availability_status,
      possession_date: formData.possession_date,
      age_of_construction: formData.age_of_construction,
      listed_by: formData.listed_by,
      whatsapp_number: formData.whatsapp_number,
      video_url: formData.video_url,
    };

    // Type-specific fields
    const typeSpecificFields: any = {};

    // For FLAT, VILLA_BUNGALOW, COMMERCIAL_UNIT
    if (["FLAT", "VILLA_BUNGALOW", "COMMERCIAL_UNIT"].includes(formData.property_type)) {
      typeSpecificFields.bhk_config = formData.bhk_config;
      typeSpecificFields.bathrooms = formData.bathrooms;
      typeSpecificFields.balconies = formData.balconies;
      typeSpecificFields.super_builtup_area = formData.super_builtup_area;
      typeSpecificFields.carpet_area = formData.carpet_area;
      typeSpecificFields.furnishing_status = formData.furnishing_status;
      typeSpecificFields.specific_floor = formData.specific_floor;
      typeSpecificFields.total_floors = formData.total_floors;
      typeSpecificFields.facing = formData.facing;
      typeSpecificFields.price_per_sqft = formData.price_per_sqft;

      // Residential amenities
      typeSpecificFields.has_power_backup = formData.has_power_backup;
      typeSpecificFields.has_lift = formData.has_lift;
      typeSpecificFields.has_swimming_pool = formData.has_swimming_pool;
      typeSpecificFields.has_clubhouse = formData.has_clubhouse;
      typeSpecificFields.has_gym = formData.has_gym;
      typeSpecificFields.has_park = formData.has_park;
      typeSpecificFields.has_reserved_parking = formData.has_reserved_parking;
      typeSpecificFields.has_security = formData.has_security;
      typeSpecificFields.is_vastu_compliant = formData.is_vastu_compliant;
      typeSpecificFields.has_intercom = formData.has_intercom;
      typeSpecificFields.has_piped_gas = formData.has_piped_gas;
      typeSpecificFields.has_wifi = formData.has_wifi;
    }

    // For PLOT, LAND
    if (["PLOT", "LAND"].includes(formData.property_type)) {
      typeSpecificFields.plot_area = formData.plot_area;
      typeSpecificFields.super_builtup_area = formData.super_builtup_area;
      typeSpecificFields.carpet_area = formData.carpet_area;
      typeSpecificFields.facing = formData.facing;
      typeSpecificFields.price_per_sqft = formData.price_per_sqft;

      // Plot amenities
      typeSpecificFields.has_drainage_line = formData.has_drainage_line;
      typeSpecificFields.has_one_gate_entry = formData.has_one_gate_entry;
      typeSpecificFields.has_jogging_park = formData.has_jogging_park;
      typeSpecificFields.has_children_park = formData.has_children_park;
      typeSpecificFields.has_temple = formData.has_temple;
      typeSpecificFields.has_water_line = formData.has_water_line;
      typeSpecificFields.has_street_light = formData.has_street_light;
      typeSpecificFields.has_internal_roads = formData.has_internal_roads;
    }

    // For VILLA_BUNGALOW - also include plot_area
    if (formData.property_type === "VILLA_BUNGALOW") {
      typeSpecificFields.plot_area = formData.plot_area;
    }

    return { ...baseFields, ...typeSpecificFields };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(6)) return;
    if (!validatePropertyTypeFields()) return;

    setLoading(true);
    const fullAddress = [addressLines.line1, addressLines.line2, addressLines.line3]
      .filter(line => line.trim() !== "")
      .join(", ");

    try {
      const data = new FormData();

      // Use auto-generated title instead of user input
      const finalFormData = {
        ...formData,
        title: autoGeneratedTitle, // FORCE use auto-generated title
      };

      const relevantFormData = {
        ...getRelevantFormData(),
        title: autoGeneratedTitle, // Force use auto-generated title
      };

      console.log("Submitting filtered data:", relevantFormData);

      Object.entries(relevantFormData).forEach(([key, val]) => {
        if (val !== "" && val !== null && val !== undefined) {
          const numericFields = ["bhk_config", "bathrooms", "balconies", "age_of_construction"];
          const decimalFields = ["total_price", "super_builtup_area", "carpet_area", "plot_area", "maintenance_charges", "price_per_sqft"];
          const integerFields = ["specific_floor", "total_floors"];

          if (numericFields.includes(key) || decimalFields.includes(key) || integerFields.includes(key)) {
            data.append(key, val.toString());
          } else if (typeof val === "boolean") {
            data.append(key, val ? "true" : "false");
          } else {
            data.append(key, val.toString());
          }
        }
      });

      data.append("address_line", fullAddress || formData.locality || "Address not provided");

      Object.entries(legalDocuments).forEach(([key, file]) => {
        if (file) data.append(key, file);
      });

      floorPlans.forEach(file => {
        data.append("floor_plans", file);
      });

      const res = await api.post("/api/properties/", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

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
      console.error("Submission error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        propertyType: formData.property_type,
        sentFields: Object.keys(getRelevantFormData())
      });

      let errorMsg = "Check all required fields and documents.";

      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          // HTML error page (500 error)
          if (err.response.status === 500) {
            errorMsg = "Server error occurred. Please check:\n" +
              "1. All required fields are filled correctly\n" +
              "2. File sizes are not too large\n" +
              "3. Contact support if the issue persists";
          } else {
            errorMsg = `Server error (${err.response.status})`;
          }
        } else if (typeof err.response.data === 'object') {
          // DRF Validation Errors (JSON)
          errorMsg = Object.entries(err.response.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("\n");
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      alert(`Error creating listing (${err.response?.status || 'Unknown'}): \n\n${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* --- Enhanced Progress Header with Step Names --- */}
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-3">
            <Link href="/dashboard/my-listings" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base font-medium">Back to Listings</span>
            </Link>
            <span className="text-xs sm:text-sm font-bold text-[#2D5F3F] bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              Step {step} of {totalSteps}
            </span>
          </div>

          {/* Step Names Flow */}
          <div className="hidden sm:flex items-center justify-between mb-4">
            {STEP_NAMES.map((stepItem, idx) => (
              <div key={stepItem.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all ${step >= stepItem.id
                      ? 'bg-[#2D5F3F] text-white shadow-md'
                      : 'bg-gray-300 text-gray-600'
                      }`}
                  >
                    {step > stepItem.id ? <Check className="w-5 h-5" /> : <span>{stepItem.id}</span>}
                  </div>
                  <span
                    className={`text-xs text-center font-medium ${step >= stepItem.id ? 'text-[#2D5F3F]' : 'text-gray-500'
                      }`}
                  >
                    {stepItem.name}
                  </span>
                </div>
                {idx < 4 && (
                  <div
                    className={`h-1 flex-1 transition-all mx-2 ${step > stepItem.id ? 'bg-[#2D5F3F]' : 'bg-gray-300'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-green-500 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* --- Main Form Body --- */}
      <main className="flex-1 max-w-5xl lg:max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-32">
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
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">What are you listing?</h2>
                  <p className="text-gray-500 text-sm sm:text-base">Select the property type to customize your listing journey.</p>
                </div>

                {/* Listing Type */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                  <Label className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 block">Listing Type</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, listing_type: "SALE" }))}
                      className={`p-6 rounded-2xl border-2 transition-all ${formData.listing_type === "SALE"
                        ? "border-[#4A9B6D] bg-[#E8F5E9] ring-2 ring-[#4A9B6D]"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="text-4xl mb-2">🏠</div>
                      <div className="font-bold text-gray-800">Sell</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, listing_type: "RENT" }))}
                      className={`p-6 rounded-2xl border-2 transition-all ${formData.listing_type === "RENT"
                        ? "border-[#4A9B6D] bg-[#E8F5E9] ring-2 ring-[#4A9B6D]"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="text-4xl mb-2">🔑</div>
                      <div className="font-bold text-gray-800">Rent</div>
                    </button>
                  </div>
                </div>

                {/* Property Type Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  {PROPERTY_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, property_type: type.value, subtype: "" }))}
                      className={`group aspect-square rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-6 flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all duration-300 shadow-sm hover:shadow-md ${formData.property_type === type.value
                        ? "border-[#4A9B6D] bg-[#E8F5E9] scale-[1.02]"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform filter drop-shadow-sm">{type.icon}</span>
                      <span className={`text-xs sm:text-sm font-bold tracking-tight text-center ${formData.property_type === type.value ? "text-green-800" : "text-gray-700"}`}>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* SUBTYPE */}
                {SUBTYPE_OPTIONS[formData.property_type] && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200"
                  >
                    <Label className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 block">Specific Category</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {SUBTYPE_OPTIONS[formData.property_type].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, subtype: opt.value }))}
                          className={`py-2.5 sm:py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${formData.subtype === opt.value
                            ? "border-[#4A9B6D] bg-[#E8F5E9] text-green-800"
                            : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}


              </div>
            )}

            {/* STEP 2: PRICING & CONFIG */}
            {step === 2 && (
              <div className="space-y-8">
                {/* Header */}
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Pricing & Details</h2>
                  <p className="text-gray-500 text-sm sm:text-base">Set competitive price and share technical details</p>
                </div>

                {/* Section A: Project & Pricing Details */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">
                    Project & Pricing Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-sm">Project Name</Label>
                      <Input
                        name="project_name"
                        value={formData.project_name}
                        onChange={handleChange}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                        placeholder="e.g. Green Valley Residency"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-sm">Total Price (₹) <span className="text-red-500">*</span></Label>
                      <Input
                        name="total_price"
                        type="number"
                        value={formData.total_price}
                        onChange={handleChange}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500 font-bold text-lg"
                        placeholder="0"
                      />
                      {errors.total_price && <p className="text-red-500 text-xs sm:text-sm">{errors.total_price}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-sm">Price per Sq.ft (₹) <span className="text-gray-400 text-xs font-normal ml-2">(Optional)</span></Label>
                      <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-[#2D5F3F] border-r border-gray-300 rounded-l-xl text-white">
                          <IndianRupee className="w-4 h-4" />
                        </div>
                        <Input
                          name="price_per_sqft"
                          type="number"
                          value={formData.price_per_sqft}
                          onChange={handleChange}
                          placeholder="Enter price per sq.ft"
                          className="pl-14 h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500 bg-white"
                        />
                      </div>
                      <p className="text-xs text-gray-500">Enter the price per square foot for this property</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-sm">Maintenance (₹)</Label>
                        <Input
                          name="maintenance_charges"
                          type="number"
                          value={formData.maintenance_charges}
                          onChange={handleChange}
                          className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-sm">Interval</Label>
                        <select
                          name="maintenance_interval"
                          value={formData.maintenance_interval}
                          onChange={handleChange}
                          className="w-full h-12 px-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 bg-white"
                        >
                          <option value="MONTHLY">Monthly</option>
                          <option value="QUARTERLY">Quarterly</option>
                          <option value="YEARLY">Yearly</option>
                          <option value="ONE_TIME">One Time</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section B: Area Specifications */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">
                    Area Specifications
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-sm">Super Built-up Area (sq.ft) <span className="text-gray-400 text-xs font-normal ml-2">(Optional)</span></Label>
                      <Input
                        name="super_builtup_area"
                        type="number"
                        value={formData.super_builtup_area}
                        onChange={handleChange}
                        placeholder="Enter area in sq.ft"
                        className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                      />
                      {errors.super_builtup_area && <p className="text-red-500 text-xs sm:text-sm">{errors.super_builtup_area}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-sm">Carpet Area (sq.ft) <span className="text-gray-400 text-xs font-normal ml-2">(Optional)</span></Label>
                      <Input
                        name="carpet_area"
                        type="number"
                        value={formData.carpet_area}
                        onChange={handleChange}
                        placeholder="Enter carpet area in sq.ft"
                        className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                      />
                      {errors.carpet_area && <p className="text-red-500 text-xs sm:text-sm">{errors.carpet_area}</p>}
                    </div>

                    {["PLOT", "LAND", "VILLA_BUNGALOW"].includes(formData.property_type) && (
                      <div className="space-y-2">
                        <Label className="font-bold text-sm">Plot Area (sq.ft)</Label>
                        <Input
                          name="plot_area"
                          type="number"
                          value={formData.plot_area}
                          onChange={handleChange}
                          className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Section C: Property Configuration */}
                {["FLAT", "VILLA_BUNGALOW", "COMMERCIAL_UNIT"].includes(formData.property_type) && (
                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">
                      Property Configuration
                    </h3>

                    {/* Counters */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-4">
                        <Label className="text-xs font-bold uppercase text-gray-500 mb-4 text-center block">
                          BHK Configuration
                        </Label>

                        {/* 1RK Button */}
                        <div className="mb-4 w-full">
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, bhk_config: 0.5 }))}
                            className={`w-full py-3 px-4 rounded-xl border-2 font-bold transition-all ${formData.bhk_config === 0.5
                              ? "border-[#4A9B6D] bg-[#E8F5E9] text-green-800"
                              : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                              }`}
                          >
                            1RK (1 Room Kitchen)
                          </button>
                        </div>

                        {/* Standard BHK Counter */}
                        <div className="flex items-center gap-6">
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({
                              ...p,
                              bhk_config: p.bhk_config === 0.5 ? 0 : Math.max(0, p.bhk_config - 1)
                            }))}
                            className="w-10 h-10 rounded-full border bg-white flex items-center justify-center font-bold shadow-sm hover:scale-105 transition"
                          >
                            -
                          </button>
                          <span className="text-2xl font-black w-14 text-center">
                            {formData.bhk_config === 0.5 ? "1RK" : formData.bhk_config === 0 ? "NA" : formData.bhk_config}
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({
                              ...p,
                              bhk_config: p.bhk_config === 0.5 ? 1 : p.bhk_config + 1
                            }))}
                            className="w-10 h-10 rounded-full bg-[#2D5F3F] text-white flex items-center justify-center font-bold shadow-sm hover:scale-105 transition"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs text-gray-400">Set 0 for N/A</span>
                      </div>


                      <div className="flex flex-col items-center gap-4 p-4 border rounded-2xl bg-gray-50">
                        <Label className="text-xs font-bold uppercase text-gray-500">Bathrooms</Label>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, bathrooms: Math.max(1, p.bathrooms - 1) }))}
                            className="w-10 h-10 rounded-full border bg-white flex items-center justify-center font-bold shadow-sm hover:scale-105 transition"
                          >
                            -
                          </button>
                          <span className="text-2xl font-black w-8 text-center">{formData.bathrooms}</span>
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, bathrooms: Math.min(10, p.bathrooms + 1) }))}
                            className="w-10 h-10 rounded-full bg-[#2D5F3F] text-white flex items-center justify-center font-bold shadow-sm hover:scale-105 transition"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-4 p-4 border rounded-2xl bg-gray-50">
                        <Label className="text-xs font-bold uppercase text-gray-500">Balconies</Label>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, balconies: Math.max(0, p.balconies - 1) }))}
                            className="w-10 h-10 rounded-full border bg-white flex items-center justify-center font-bold shadow-sm hover:scale-105 transition"
                          >
                            -
                          </button>
                          <span className="text-2xl font-black w-8 text-center">{formData.balconies}</span>
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, balconies: Math.min(10, p.balconies + 1) }))}
                            className="w-10 h-10 rounded-full bg-[#2D5F3F] text-white flex items-center justify-center font-bold shadow-sm hover:scale-105 transition"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Furnishing */}
                    <div className="space-y-4">
                      <Label className="font-bold text-sm">Furnishing Status</Label>
                      <div className="grid grid-cols-3 gap-4">
                        {["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"].map(status => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, furnishing_status: status }))}
                            className={`p-4 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all ${formData.furnishing_status === status
                              ? "border-[#4A9B6D] bg-[#E8F5E9] text-green-800 ring-2 ring-green-500 ring-opacity-20"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-600"
                              }`}
                          >
                            {status.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Floor & Facing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-bold text-sm">Specific Floor <span className="text-red-500">*</span></Label>
                          <Input
                            name="specific_floor"
                            value={formData.specific_floor}
                            onChange={handleChange}
                            className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                            placeholder="e.g. 5"
                          />
                          {errors.specific_floor && <p className="text-red-500 text-xs">{errors.specific_floor}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-sm">Total Floors <span className="text-red-500">*</span></Label>
                          <Input
                            name="total_floors"
                            value={formData.total_floors}
                            onChange={handleChange}
                            className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                            placeholder="e.g. 12"
                          />
                          {errors.total_floors && <p className="text-red-500 text-xs">{errors.total_floors}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold text-sm">Facing</Label>
                        <select
                          name="facing"
                          value={formData.facing}
                          onChange={handleChange}
                          className="w-full h-12 px-3 border-2 border-gray-200 rounded-xl focus:ring-green-500 bg-white"
                        >
                          <option value="">Select Direction</option>
                          <option value="NORTH">North</option>
                          <option value="SOUTH">South</option>
                          <option value="EAST">East</option>
                          <option value="WEST">West</option>
                          <option value="NORTH_EAST">North-East</option>
                          <option value="NORTH_WEST">North-West</option>
                          <option value="SOUTH_EAST">South-East</option>
                          <option value="SOUTH_WEST">South-West</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section D: Construction & Availability */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">
                    Construction & Availability
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="font-bold text-sm">Construction Status</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {["READY", "UNDER_CONSTRUCTION"].map(status => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, availability_status: status }))}
                            className={`p-4 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all ${formData.availability_status === status
                              ? "border-[#4A9B6D] bg-[#E8F5E9] text-green-800"
                              : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                              }`}
                          >
                            {status === "READY" ? "Ready to Move" : "Under Construction"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-sm flex items-center gap-2">
                        Possession Date
                        {formData.availability_status === "UNDER_CONSTRUCTION" && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        type="date"
                        name="possession_date"
                        value={formData.possession_date}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                      />
                      {errors.possession_date && <p className="text-red-500 text-xs">{errors.possession_date}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-sm">Age of Construction (Years)</Label>
                      <Input
                        name="age_of_construction"
                        type="number"
                        value={formData.age_of_construction}
                        onChange={handleChange}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Section E: Features & Amenities (Moved from Step 4) */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    {["PLOT", "LAND"].includes(formData.property_type)
                      ? "Plot Amenities & Infrastructure"
                      : "Features & Amenities"}
                  </h3>

                  <p className="text-xs text-gray-500 mb-6">
                    {["PLOT", "LAND"].includes(formData.property_type)
                      ? "Select available infrastructure and amenities in the plot/land"
                      : "Select all amenities available in the property"}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {(["PLOT", "LAND"].includes(formData.property_type)
                      ? PLOT_AMENITIES
                      : RESIDENTIAL_AMENITIES
                    ).map(a => (
                      <div
                        key={a.key}
                        onClick={() => setFormData(p => ({ ...p, [a.key]: !p[a.key as keyof typeof p] }))}
                        className={`p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${formData[a.key as keyof typeof formData]
                          ? "border-green-500 bg-green-50 text-green-800"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        <span className="font-medium text-xs sm:text-sm">{a.label}</span>
                        {formData[a.key as keyof typeof formData] && <Check className="w-4 h-4 text-green-600" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: LOCATION */}
            {step === 3 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Pin the Location</h2>
                  <p className="text-gray-500 text-sm sm:text-base">Precise location helps buyers find your property faster.</p>
                </div>

                <div className="bg-white p-2 sm:p-4 rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden relative">
                  <SmartLocationPicker
                    initialLat={formData.latitude}
                    initialLng={formData.longitude}
                    onLocationSelect={(lat, lng, address) => {
                      setFormData(p => ({
                        ...p,
                        latitude: lat,
                        longitude: lng,
                        city: address.city || p.city,
                        locality: address.street || address.city || p.locality,
                        pincode: address.pincode || p.pincode
                      }));
                      setAddressLines(p => ({
                        ...p,
                        line1: p.line1 || (address.formatted_address ? address.formatted_address.split(',')[0] : "")
                      }));
                    }}
                  />
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Address Details</h3>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-sm">Building / House / Flat No. <span className="text-red-500">*</span></Label>
                      <Input
                        name="line1"
                        value={addressLines.line1}
                        onChange={handleAddressLinesChange}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                        placeholder="e.g. Flat 402, Sunshine Heights"
                      />
                      {errors.line1 && <p className="text-red-500 text-xs sm:text-sm">{errors.line1}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-sm">Street / Road Name</Label>
                      <Input
                        name="line2"
                        value={addressLines.line2}
                        onChange={handleAddressLinesChange}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                        placeholder="Optional"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-sm">Landmark</Label>
                      <Input
                        name="line3"
                        value={addressLines.line3}
                        onChange={handleAddressLinesChange}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                        placeholder="Optional"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="font-bold text-sm">Locality / Area <span className="text-red-500">*</span></Label>
                        <Input
                          name="locality"
                          value={formData.locality}
                          onChange={handleChange}
                          className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                        />
                        {errors.locality && <p className="text-red-500 text-xs sm:text-sm">{errors.locality}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold text-sm">City <span className="text-red-500">*</span></Label>
                        <Input
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500"
                        />
                        {errors.city && <p className="text-red-500 text-xs sm:text-sm">{errors.city}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-sm">Pincode <span className="text-red-500">*</span></Label>
                      <Input
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:ring-green-500 md:w-1/2"
                      />
                      {errors.pincode && <p className="text-red-500 text-xs sm:text-sm">{errors.pincode}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: AMENITIES & PHOTOS */}
            {step === 4 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Property Photos</h2>
                  <p className="text-gray-500 text-sm sm:text-base">Properties with 5+ photos receive 3x more inquiries.</p>
                </div>



                {/* Property Gallery */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Property Gallery</h3>
                    <span className="text-xs sm:text-sm text-gray-500">{galleryImages.length} / 15 Photos</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {galleryImages.map((file, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group border border-gray-200"
                      >
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setGalleryImages(p => p.filter((_, idx) => idx !== i))}
                          className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {i === 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-[10px] font-bold text-center py-1 uppercase tracking-wider">
                            Cover Image
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {galleryImages.length < 15 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-green-600">
                        <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="text-xs sm:text-sm font-medium text-center px-2">Add Photo</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            if (e.target.files) {
                              setGalleryImages(p => [...p, ...Array.from(e.target.files!)]);
                              setErrors(prev => {
                                const n = { ...prev };
                                delete n.gallery;
                                return n;
                              });
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {errors.gallery && <p className="text-red-500 text-xs sm:text-sm mt-2">{errors.gallery}</p>}
                </div>

                {/* FLOOR PLANS SECTION (Multiple) */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                    <span>Floor Plans</span>
                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">Optional</span>
                  </h3>

                  <div className="space-y-4">
                    {floorPlans.length > 0 && (
                      <div className="grid gap-3">
                        {floorPlans.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-12 h-12 bg-white rounded border flex-shrink-0 overflow-hidden">
                                <img src={URL.createObjectURL(file)} alt="fp" className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFloorPlans(prev => prev.filter((_, i) => i !== idx))}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200">
                        <Upload className="w-4 h-4" />
                        Add Floor Plan
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          multiple
                          className="hidden"
                          onChange={e => {
                            if (e.target.files) {
                              setFloorPlans(prev => [...prev, ...Array.from(e.target.files!)]);
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2 ml-1">
                        Upload multiple floor plans. Preferred formats: JPG, PNG.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: LEGAL DOCS */}
            {step === 5 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Verify Your Property</h2>
                  <p className="text-gray-500 text-sm sm:text-base">
                    Upload official documents to earn the Verified badge and build trust.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-8 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 relative overflow-hidden">
                  <div className="absolute top-[-20] right-[-10] w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="bg-white/20 p-3 sm:p-4 rounded-xl backdrop-blur-md">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black mb-1">Boost Your Listing</h3>
                    <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                      Properties with complete documentation are 70% more likely to be featured on our homepage.
                    </p>
                  </div>
                </div>

                {errors.documents && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm font-medium">{errors.documents}</p>
                  </div>
                )}

                <div className="grid gap-3 sm:gap-4">
                  {DOCUMENTS_CONFIG.map(doc => (
                    <label
                      key={doc.key}
                      className={`group flex items-center justify-between p-4 sm:p-6 bg-white border-2 rounded-2xl cursor-pointer transition-all duration-300 ${legalDocuments[doc.key]
                        ? "border-[#4A9B6D] bg-[#F1F8F4]"
                        : "border-gray-100 hover:border-gray-200 hover:shadow-lg"
                        }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                        <div
                          className={`w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-xl flex items-center justify-center transition-all ${legalDocuments[doc.key]
                            ? "bg-[#2D5F3F] text-white shadow-lg shadow-green-100"
                            : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                            }`}
                        >
                          <FileText className="w-5 h-5 sm:w-7 sm:h-7" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <p className={`font-black text-xs sm:text-sm tracking-tight truncate ${legalDocuments[doc.key] ? "text-[#2D5F3F]" : "text-gray-800"}`}>
                            {doc.label} {doc.required && <span className="text-red-500">*</span>}
                          </p>
                          <p className="text-[11px] font-bold text-gray-400 truncate">
                            {legalDocuments[doc.key]?.name || "Format: PDF, JPG, PNG"}
                          </p>
                        </div>
                      </div>

                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => {
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
                          <Check className="w-3 h-3" />
                          Ready
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

            {/* STEP 6: REVIEW & PUBLISH */}
            {step === 6 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                    Review Your Listing
                  </h2>
                  <p className="text-gray-500 text-sm sm:text-base">
                    Review auto-generated title and customize your description before publishing.
                  </p>
                </div>

                {/* Auto-Generated Title (Read-Only) */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 sm:p-8 rounded-2xl border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <Label className="text-xs font-bold uppercase tracking-widest text-blue-700">
                      Auto-Generated Listing Title
                    </Label>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-blue-200">
                    <p className="text-gray-900 font-bold text-lg sm:text-xl leading-relaxed">
                      {autoGeneratedTitle || "Generating title..."}
                    </p>
                  </div>

                  <p className="text-xs text-blue-600 mt-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    This title is automatically generated and cannot be edited
                  </p>
                </div>

                {/* Listing Description - Editable */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      Property Description
                    </h3>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        description: autoGeneratedDescription
                      }))}
                      className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <ArrowRight className="w-3 h-3" />
                      Reset to Auto-Generated
                    </button>
                  </div>

                  {/* Show Auto-Generated Description as Reference */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase text-gray-600">
                        Auto-Generated Description
                      </span>
                      <span className="text-xs text-gray-500">Reference</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-line max-h-32 overflow-y-auto">
                      {autoGeneratedDescription || "Generating description..."}
                    </p>
                  </div>

                  {/* Editable Description Field */}
                  <div className="space-y-3">
                    <Label className="block text-sm font-bold text-gray-900">
                      Your Description <span className="text-red-500">*</span>
                      <span className="text-xs font-normal text-gray-500 ml-2">
                        (Edit the auto-generated text or write your own)
                      </span>
                    </Label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Edit the auto-generated description or write your own..."
                      rows={10}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-400 min-h-[200px] sm:min-h-[250px] bg-white resize-y"
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formData.description.length} characters</span>
                      {errors.description && (
                        <p className="text-red-500 text-xs sm:text-sm">{errors.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Listing Preview Summary */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 sm:p-8 rounded-2xl border-2 border-green-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Listing Summary
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Listing Type:</span>
                      <span className="font-bold capitalize">{formData.listing_type}</span>
                    </div>

                    <div className="flex justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Property Type:</span>
                      <span className="font-bold">
                        {PROPERTY_TYPES.find(t => t.value === formData.property_type)?.label}
                      </span>
                    </div>

                    {formData.bhk_config > 0 && (
                      <div className="flex justify-between p-3 bg-white rounded-lg">
                        <span className="text-gray-600">Configuration:</span>
                        <span className="font-bold">
                          {formData.bhk_config === 0.5 ? "1RK" : `${formData.bhk_config} BHK`}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-bold">{formData.city || "Not specified"}</span>
                    </div>

                    {formData.super_builtup_area && (
                      <div className="flex justify-between p-3 bg-white rounded-lg">
                        <span className="text-gray-600">Super Built-up:</span>
                        <span className="font-bold">{formData.super_builtup_area} sq.ft</span>
                      </div>
                    )}

                    {formData.carpet_area && (
                      <div className="flex justify-between p-3 bg-white rounded-lg">
                        <span className="text-gray-600">Carpet Area:</span>
                        <span className="font-bold">{formData.carpet_area} sq.ft</span>
                      </div>
                    )}

                    <div className="flex justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Total Price:</span>
                      <span className="font-bold text-green-700 text-base">
                        ₹ {formData.total_price ? Number(formData.total_price).toLocaleString('en-IN') : '-'}
                      </span>
                    </div>

                    {formData.price_per_sqft && (
                      <div className="flex justify-between p-3 bg-white rounded-lg">
                        <span className="text-gray-600">Price per Sq.ft:</span>
                        <span className="font-bold">₹ {Number(formData.price_per_sqft).toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Photos:</span>
                      <span className="font-bold">{galleryImages.length} uploaded</span>
                    </div>

                    <div className="flex justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Documents:</span>
                      <span className="font-bold">
                        {Object.values(legalDocuments).filter(Boolean).length} uploaded
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* --- Sticky Action Bar --- */}
      <footer className="fixed bottom-0 left-0 lg:left-72 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 p-4 sm:p-6 z-50">
        <div className="max-w-5xl lg:max-w-6xl mx-auto flex items-center gap-3 sm:gap-4">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              disabled={loading}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-gray-700 border-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Back
            </button>
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={loading}
              className="flex-1 py-3 sm:py-4 rounded-xl bg-[#2D5F3F] text-white font-bold text-sm sm:text-base shadow-lg shadow-green-100 hover:bg-[#1B3A26] hover:shadow-xl hover:shadow-green-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-[#2D5F3F] to-[#4A9B6D] text-white font-bold text-sm sm:text-base shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-green-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
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
                  <CheckCircle className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </footer>

      {/* Spacer for fixed footer */}
      <div className="h-24"></div>
    </div >
  );
}
