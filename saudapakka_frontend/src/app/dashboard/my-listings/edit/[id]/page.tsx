"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    MapPin, IndianRupee, FileText, Check, X, Upload, Sparkles,
    ArrowLeft, AlertCircle, Home, ChevronRight, CheckCircle, ArrowRight, Star,
    ChevronLeft, Building2, Bed, Bath, Maximize2, Grid3x3, Calendar,
    Phone, Video, Ruler, DollarSign
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

const STEP_NAMES = [
    { id: 1, name: 'Classification' },
    { id: 2, name: 'Specifications' },
    { id: 3, name: 'Location' },
    { id: 4, name: 'Media' },
    { id: 5, name: 'Verification' },
    { id: 6, name: 'Review' }
];

export default function EditPropertyPage() {
    const router = useRouter();
    const params = useParams();
    const propertyId = params?.id as string;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingProperty, setLoadingProperty] = useState(true);
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

        // Amenities
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

    // Image states
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [floorPlans, setFloorPlans] = useState<File[]>([]);
    const [legalDocuments, setLegalDocuments] = useState<Record<string, File | null>>({});

    // Existing data states
    const [existingGalleryImages, setExistingGalleryImages] = useState<Array<{
        id: number;
        image: string;
        is_thumbnail: boolean;
    }>>([]);
    const [existingFloorPlans, setExistingFloorPlans] = useState<string[]>([]);
    const [existingDocuments, setExistingDocuments] = useState<Record<string, string>>({});

    // Deletion tracking
    const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);

    const [mounted, setMounted] = useState(false);
    const [autoGeneratedTitle, setAutoGeneratedTitle] = useState("");
    const [autoGeneratedDescription, setAutoGeneratedDescription] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    // --- Auth & Data Fetching ---
    useEffect(() => {
        if (!mounted) return;
        const token = Cookies.get("access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        if (propertyId) {
            fetchProperty();
        }
    }, [propertyId, mounted, router]);

    // --- Auto-Regenerate Title & Desc ---
    useEffect(() => {
        if (mounted) {
            generateTitleAndDescription(formData);
        }
    }, [
        formData.property_type, formData.listing_type, formData.subtype,
        formData.bhk_config, formData.locality, formData.city,
        formData.super_builtup_area, formData.plot_area, formData.total_price
    ]);

    // --- Helper to generate title and description ---
    const generateTitleAndDescription = (data: typeof formData) => {
        let titleParts = [];

        // Add BHK if applicable
        if (["FLAT", "VILLA_BUNGALOW", "COMMERCIAL_UNIT"].includes(data.property_type) && data.bhk_config) {
            if (data.bhk_config === 0.5) {
                titleParts.push("1RK");
            } else {
                titleParts.push(`${data.bhk_config} BHK`);
            }
        }

        // Add property type
        const typeLabels: Record<string, string> = {
            FLAT: "Flat",
            VILLA_BUNGALOW: "Villa/Bungalow",
            PLOT: "Plot",
            LAND: "Land",
            COMMERCIAL_UNIT: "Commercial Property",
        };
        titleParts.push(typeLabels[data.property_type] || "Property");

        // Add subtype
        if (data.subtype) {
            const subtypeLabel = SUBTYPE_OPTIONS[data.property_type]?.find(
                (opt: any) => opt.value === data.subtype
            )?.label;
            if (subtypeLabel) titleParts.push(`(${subtypeLabel})`);
        }

        titleParts.push("for");
        titleParts.push(data.listing_type === "SALE" ? "Sale" : "Rent");

        if (data.locality) {
            titleParts.push("in");
            titleParts.push(data.locality);
        }
        if (data.city) titleParts.push(data.city);

        setAutoGeneratedTitle(titleParts.join(" "));

        // Description
        let descParts = [];
        if (["FLAT", "VILLA_BUNGALOW", "COMMERCIAL_UNIT"].includes(data.property_type)) {
            descParts.push(`${data.bhk_config === 0.5 ? "1RK" : `${data.bhk_config} BHK`} ${typeLabels[data.property_type]}`);
        } else {
            descParts.push(typeLabels[data.property_type]);
        }
        descParts.push(`available for ${data.listing_type === "SALE" ? "sale" : "rent"}`);
        if (data.locality) descParts.push(`in ${data.locality}`);

        if (data.super_builtup_area) descParts.push(`. Area: ${data.super_builtup_area} sq.ft.`);
        else if (data.plot_area) descParts.push(`. Area: ${data.plot_area} sq.ft.`);

        descParts.push("Contact us for more details and site visit.");
        setAutoGeneratedDescription(descParts.join(" "));
    };

    const fetchProperty = async () => {
        setLoadingProperty(true);
        try {
            console.log("=== FETCHING PROPERTY DATA ===");
            console.log("Property ID:", propertyId);

            const response = await api.get(`/api/properties/${propertyId}/`);
            const property = response.data;

            console.log("Property data received:", property);

            // Safe get helper for legacy data
            const safeGet = (value: any, defaultValue: any) => {
                return (value === null || value === undefined) ? defaultValue : value;
            };

            const newFormData = {
                title: safeGet(property.title, ""),
                description: safeGet(property.description, ""),
                listing_type: safeGet(property.listing_type, "SALE"),
                property_type: safeGet(property.property_type, "FLAT"),
                subtype: safeGet(property.subtype, ""),

                bhk_config: safeGet(property.bhk_config !== null ? Number(property.bhk_config) : null, 1),
                bathrooms: safeGet(property.bathrooms, 1),
                balconies: safeGet(property.balconies, 0),

                super_builtup_area: safeGet(property.super_builtup_area, ""),
                carpet_area: safeGet(property.carpet_area, ""),
                plot_area: safeGet(property.plot_area, ""),

                total_price: safeGet(property.total_price, ""),
                maintenance_charges: safeGet(property.maintenance_charges, 0),
                maintenance_interval: safeGet(property.maintenance_interval, "MONTHLY"),
                price_per_sqft: safeGet(property.price_per_sqft, ""),

                furnishing_status: safeGet(property.furnishing_status, "UNFURNISHED"),
                specific_floor: safeGet(property.specific_floor, ""),
                total_floors: safeGet(property.total_floors, ""),
                facing: safeGet(property.facing, ""),

                project_name: safeGet(property.project_name, ""),
                locality: safeGet(property.locality, ""),
                city: safeGet(property.city, ""),
                pincode: safeGet(property.pincode, ""),
                latitude: safeGet(property.latitude, 19.8762),
                longitude: safeGet(property.longitude, 75.3433),
                landmarks: safeGet(property.landmarks, ""),

                availability_status: safeGet(property.availability_status, "READY"),
                possession_date: safeGet(property.possession_date, ""),
                age_of_construction: safeGet(property.age_of_construction, 0),

                listed_by: safeGet(property.listed_by, "OWNER"),
                whatsapp_number: safeGet(property.whatsapp_number, ""),
                video_url: safeGet(property.video_url, ""),

                // Residential Amenities
                has_power_backup: property.has_power_backup === true,
                has_lift: property.has_lift === true,
                has_swimming_pool: property.has_swimming_pool === true,
                has_clubhouse: (property.has_clubhouse || property.has_club_house) === true,
                has_gym: property.has_gym === true,
                has_park: property.has_park === true,
                has_reserved_parking: property.has_reserved_parking === true,
                has_security: property.has_security === true,
                is_vastu_compliant: property.is_vastu_compliant === true,
                has_intercom: property.has_intercom === true,
                has_piped_gas: property.has_piped_gas === true,
                has_wifi: property.has_wifi === true,

                // Plot Amenities
                has_drainage_line: property.has_drainage_line === true,
                has_one_gate_entry: property.has_one_gate_entry === true,
                has_jogging_park: property.has_jogging_park === true,
                has_children_park: property.has_children_park === true,
                has_temple: property.has_temple === true,
                has_water_line: property.has_water_line === true,
                has_street_light: property.has_street_light === true,
                has_internal_roads: property.has_internal_roads === true,
            };

            console.log("Setting form data:", newFormData);
            setFormData(newFormData as any); // Cast to any to avoid type issues with dynamic matching

            // Regenerate autos if empty, or just set them to current validation
            // But usually we want to keep what is from DB unless user edits
            // generateTitleAndDescription(newFormData); 
            // Better to just set them:
            setAutoGeneratedTitle(safeGet(property.title, ""));
            setAutoGeneratedDescription(safeGet(property.description, ""));

            // Address
            const addressParts = (property.address_line || "").split(",").map((s: string) => s.trim());
            setAddressLines({
                line1: addressParts[0] || property.address_line || "",
                line2: addressParts[1] || "",
                line3: addressParts[2] || "",
            });

            // --- MEDIA & DOCUMENTS ---

            // Image Fetching with Robust Fallback
            let images = [];
            try {
                console.log("Fetching images for property:", propertyId);
                const imgRes = await api.get(`/api/properties/${propertyId}/images/`);
                images = imgRes.data || [];
                console.log("Images loaded from endpoint:", images.length);
            } catch (imgError: any) {
                console.warn("Images endpoint failed/missing:", imgError);
                if (imgError.response?.status === 404 || imgError.response?.status === 403) {
                    // Fallback to main property object
                    if (property.images && Array.isArray(property.images)) {
                        console.log("Using images from property object:", property.images.length);
                        images = property.images;
                    } else if (property.thumbnail_image) {
                        console.log("Using thumbnail as single image");
                        images = [{
                            id: 1,
                            image: property.thumbnail_image,
                            is_thumbnail: true
                        }];
                    } else {
                        console.warn("No images found in fallback");
                    }
                }
            }
            setExistingGalleryImages(images);

            // Floor Plans
            if (property.floor_plans) {
                if (Array.isArray(property.floor_plans)) {
                    setExistingFloorPlans(property.floor_plans);
                } else if (typeof property.floor_plans === 'string') {
                    setExistingFloorPlans([{ id: 1, image: property.floor_plans } as any]);
                }
            }

            // Documents
            const docs: Record<string, string> = {};
            DOCUMENTS_CONFIG.forEach(doc => {
                if (property[doc.key]) {
                    docs[doc.key] = property[doc.key];
                }
            });
            setExistingDocuments(docs);

            // Log Complete Data Analysis
            console.log("=== COMPLETE FORM DATA ANALYSIS ===");
            console.log("Property ID:", propertyId);
            console.log("Property Type:", newFormData.property_type);
            console.log("Listing Type:", newFormData.listing_type);
            console.log("\n--- BASIC INFO ---");
            console.log("Title:", newFormData.title);
            console.log("Description:", newFormData.description?.substring(0, 100) + "...");
            console.log("Subtype:", newFormData.subtype);

            console.log("\n--- CONFIGURATION ---");
            console.log("BHK Config:", newFormData.bhk_config);
            console.log("Bathrooms:", newFormData.bathrooms);
            console.log("Balconies:", newFormData.balconies);
            console.log("Furnishing:", newFormData.furnishing_status);
            console.log("Floor:", newFormData.specific_floor, "/", newFormData.total_floors);

            console.log("\n--- AREA ---");
            console.log("Super Built-up:", newFormData.super_builtup_area);
            console.log("Carpet Area:", newFormData.carpet_area);
            console.log("Plot Area:", newFormData.plot_area);

            console.log("\n--- PRICING ---");
            console.log("Total Price:", newFormData.total_price);
            console.log("Price per sqft:", newFormData.price_per_sqft);
            console.log("Maintenance:", newFormData.maintenance_charges, "/", newFormData.maintenance_interval);

            console.log("\n--- LOCATION ---");
            console.log("Locality:", newFormData.locality);
            console.log("City:", newFormData.city);
            console.log("Pincode:", newFormData.pincode);
            console.log("Coordinates:", newFormData.latitude, ",", newFormData.longitude);
            console.log("Landmarks:", newFormData.landmarks);

            console.log("\n--- MEDIA ---");
            console.log("Existing Images:", images.length);
            console.log("Existing Documents:", Object.keys(docs).length);

            console.log("\n=== END ANALYSIS ===");

            setLoadingProperty(false);
            console.log("=== PROPERTY DATA LOADED SUCCESSFULLY ===");

        } catch (error: any) {
            console.error("Fetch error:", error);
            let errorMessage = "Failed to load property data. ";
            if (error.response?.status === 404) errorMessage += "Property not found.";
            else if (error.response?.status === 403) errorMessage += "Permission denied.";

            alert(errorMessage);
            router.push("/dashboard/my-listings");
        }
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

            if (formData.availability_status === "UNDER_CONSTRUCTION" && !formData.possession_date) {
                newErrors.possession_date = "Possession date required";
            }

            if (["FLAT", "VILLA_BUNGALOW"].includes(formData.property_type)) {
                if (!formData.specific_floor) newErrors.specific_floor = "Floor number is required";
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
            const activeImagesCount = existingGalleryImages.filter(img => !imagesToDelete.includes(img.id)).length + galleryImages.length;
            if (activeImagesCount === 0) newErrors.gallery = "At least one property image is required";
        }

        if (currentStep === 5) {
            // In edit mode, check against both new and existing documents
            const requiredDocs = DOCUMENTS_CONFIG.filter(d => d.required);
            const missingDocs = requiredDocs.filter(d => !legalDocuments[d.key] && !existingDocuments[d.key]);

            if (missingDocs.length > 0) {
                newErrors.documents = `Missing: ${missingDocs.map(d => d.label).join(", ")}`;
            }
        }

        if (currentStep === 6) {
            if (!formData.description?.trim()) {
                newErrors.description = "Description is required";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validatePropertyTypeFields = (): boolean => {
        const errors: Record<string, string> = {};
        if (["FLAT", "VILLA_BUNGALOW", "COMMERCIAL_UNIT"].includes(formData.property_type)) {
            if (formData.bhk_config === undefined || formData.bhk_config === null || (formData.bhk_config as any) === "") {
                errors.bhk_config = "BHK configuration is required";
            }
            if (!formData.specific_floor) errors.specific_floor = "Floor number is required";
            if (!formData.total_floors) errors.total_floors = "Total floors is required";
        }
        if (["PLOT", "LAND"].includes(formData.property_type)) {
            if (!formData.plot_area) errors.plot_area = "Plot area is required";
        }
        if (Object.keys(errors).length > 0) {
            alert("Please fix the following errors:\n" + Object.values(errors).join("\n"));
            return false;
        }
        return true;
    };

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

        const typeSpecificFields: any = {};

        // Residential Fields
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

            // Residential Amenities
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

        // Plot/Land Fields
        if (["PLOT", "LAND", "VILLA_BUNGALOW"].includes(formData.property_type)) {
            typeSpecificFields.plot_area = formData.plot_area;
            if (formData.property_type !== "VILLA_BUNGALOW") {
                typeSpecificFields.price_per_sqft = formData.price_per_sqft;
                typeSpecificFields.facing = formData.facing;
            }

            // Plot Amenities
            typeSpecificFields.has_drainage_line = formData.has_drainage_line;
            typeSpecificFields.has_one_gate_entry = formData.has_one_gate_entry;
            typeSpecificFields.has_jogging_park = formData.has_jogging_park;
            typeSpecificFields.has_children_park = formData.has_children_park;
            typeSpecificFields.has_temple = formData.has_temple;
            typeSpecificFields.has_water_line = formData.has_water_line;
            typeSpecificFields.has_street_light = formData.has_street_light;
            typeSpecificFields.has_internal_roads = formData.has_internal_roads;
        }

        return { ...baseFields, ...typeSpecificFields };
    };

    const handleSubmit = async () => {
        if (!validateStep(6)) return;
        if (!validatePropertyTypeFields()) return;

        setLoading(true);
        const fullAddress = [addressLines.line1, addressLines.line2, addressLines.line3]
            .filter(line => line.trim() !== "")
            .join(", ");

        try {
            const data = new FormData();

            // Auto-generated fields
            const finalFormData = {
                ...getRelevantFormData(),
                title: autoGeneratedTitle, // Force use auto-generated title
                description: formData.description || autoGeneratedDescription,
            };

            // Append fields
            Object.entries(finalFormData).forEach(([key, val]) => {
                if (val !== null && val !== undefined && val !== "") {
                    if (typeof val === "boolean") {
                        data.append(key, val ? "true" : "false");
                    } else {
                        data.append(key, val.toString());
                    }
                }
            });

            data.append("address_line", fullAddress || formData.locality);

            // Documents
            Object.entries(legalDocuments).forEach(([key, file]) => {
                if (file) data.append(key, file);
            });

            // Floor Plans
            floorPlans.forEach(file => {
                data.append("floor_plans", file);
            });

            // Update basic property info via PATCH
            await api.patch(`/api/properties/${propertyId}/`, data, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // Delete marked images
            if (imagesToDelete.length > 0) {
                await Promise.all(imagesToDelete.map(imageId =>
                    api.delete(`/api/properties/${propertyId}/delete_image/${imageId}/`)
                        .catch(e => console.error("Image delete fail", e))
                ));
            }

            // Upload new images
            if (galleryImages.length > 0) {
                await Promise.all(galleryImages.map((file, i) => {
                    const imgData = new FormData();
                    imgData.append("image", file);
                    // Determine thumbnail status: if no existing images and this is the first new one, make it thumbnail
                    const isFirstImage = existingGalleryImages.length === 0 && i === 0;
                    imgData.append("is_thumbnail", isFirstImage ? "true" : "false");
                    return api.post(`/api/properties/${propertyId}/upload_image/`, imgData);
                }));
            }

            router.push("/dashboard/my-listings");
        } catch (err: any) {
            console.error("Update failed", err);
            let errorMsg = err.message || "Unknown error";
            if (err.response?.data) {
                if (typeof err.response.data === 'object') {
                    errorMsg = Object.entries(err.response.data)
                        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                        .join("\n");
                } else {
                    errorMsg = err.response.data.toString();
                }
            }
            alert(`Update failed:\n${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => validateStep(step) && setStep(s => Math.min(s + 1, totalSteps));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    if (loadingProperty) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading property details...</p>
                </div>
            </div>
        );
    }

    if (!mounted) return null;

    const progress = (step / totalSteps) * 100;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <Link href="/dashboard/my-listings" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            <span className="font-medium">Back to Listings</span>
                        </Link>
                        <div className="text-center">
                            <span className="text-sm font-bold block text-gray-900">Editing Property</span>
                        </div>
                        <span className="text-xs font-bold text-[#2D5F3F] bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                            Step {step} of {totalSteps}
                        </span>
                    </div>
                    {/* Progress Bar (simplified) */}
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 pb-32">

                {/* INSTRUCTION BANNER */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">How to Edit Your Property</h3>
                            <ul className="space-y-1 text-sm text-gray-700">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span>All your existing data has been pre-filled across all 6 steps</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span>Navigate through each step using "Continue" button to view all fields</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span>Modify any field you want to update</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span>Step 6 shows a complete review of ALL your property data</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span>Click "Update Property" in Step 6 to save changes</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Step Navigation Helper - Shows which step has data */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                    <div className="flex items-center justify-between gap-2 overflow-x-auto">
                        {STEP_NAMES.map((name, index) => {
                            const stepNum = index + 1;
                            const isCurrentStep = step === stepNum;
                            const isCompletedStep = step > stepNum;

                            return (
                                <button
                                    key={stepNum}
                                    onClick={() => setStep(stepNum)}
                                    className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg text-xs font-semibold transition-all ${isCurrentStep
                                        ? 'bg-green-600 text-white'
                                        : isCompletedStep
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        {isCompletedStep && <CheckCircle className="w-3 h-3" />}
                                        <span>{stepNum}. {name.name}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Data Verification Checklist */}
                {!loadingProperty && (
                    <details className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                        <summary className="cursor-pointer font-bold text-gray-900 flex items-center gap-2 hover:text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span>Data Loaded Checklist (Click to expand)</span>
                        </summary>

                        <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2">
                                {formData.property_type ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                    <X className="w-4 h-4 text-red-600" />
                                )}
                                <span className="text-sm">Property Type: {formData.property_type || "MISSING"}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                {formData.listing_type ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                    <X className="w-4 h-4 text-red-600" />
                                )}
                                <span className="text-sm">Listing Type: {formData.listing_type || "MISSING"}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                {formData.total_price ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                    <X className="w-4 h-4 text-red-600" />
                                )}
                                <span className="text-sm">Price: ₹{formData.total_price ? Number(formData.total_price).toLocaleString('en-IN') : "MISSING"}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                {formData.locality && formData.city ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                    <X className="w-4 h-4 text-red-600" />
                                )}
                                <span className="text-sm">Location: {formData.locality || "MISSING"}, {formData.city || "MISSING"}</span>
                            </div>

                            {["FLAT", "VILLA_BUNGALOW", "COMMERCIAL_UNIT"].includes(formData.property_type) && (
                                <>
                                    <div className="flex items-center gap-2">
                                        {formData.bhk_config ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <X className="w-4 h-4 text-red-600" />
                                        )}
                                        <span className="text-sm">BHK: {formData.bhk_config || "MISSING"}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {formData.bathrooms ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <X className="w-4 h-4 text-red-600" />
                                        )}
                                        <span className="text-sm">Bathrooms: {formData.bathrooms || "MISSING"}</span>
                                    </div>
                                </>
                            )}

                            {["PLOT", "LAND"].includes(formData.property_type) && (
                                <div className="flex items-center gap-2">
                                    {formData.plot_area ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <X className="w-4 h-4 text-red-600" />
                                    )}
                                    <span className="text-sm">Plot Area: {formData.plot_area || "MISSING"} sq.ft</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                {existingGalleryImages.length > 0 ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                    <X className="w-4 h-4 text-orange-600" />
                                )}
                                <span className="text-sm">Images: {existingGalleryImages.length} loaded</span>
                            </div>

                            <div className="flex items-center gap-2">
                                {Object.keys(existingDocuments).length > 0 ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                    <X className="w-4 h-4 text-orange-600" />
                                )}
                                <span className="text-sm">Documents: {Object.keys(existingDocuments).length} loaded</span>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-xs font-semibold text-blue-900">
                                    📝 Navigate through all 6 steps to view and edit all property data
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Step 6 (Review) shows a complete summary of ALL loaded data
                                </p>
                            </div>
                        </div>
                    </details>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* STEP 1 */}
                        {/* DEBUG: Show loaded data - REMOVE IN PRODUCTION */}
                        {process.env.NODE_ENV === 'development' && (
                            <details className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
                                <summary className="cursor-pointer font-bold text-gray-700 hover:text-gray-900">
                                    🔍 Debug: View Loaded Property Data
                                </summary>
                                <div className="mt-4 space-y-2">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><p className="font-semibold text-gray-700">Property Type:</p><p className="text-gray-900">{formData.property_type}</p></div>
                                        <div><p className="font-semibold text-gray-700">Listing Type:</p><p className="text-gray-900">{formData.listing_type}</p></div>
                                        <div><p className="font-semibold text-gray-700">BHK:</p><p className="text-gray-900">{formData.bhk_config}</p></div>
                                        <div><p className="font-semibold text-gray-700">Total Price:</p><p className="text-gray-900">{formData.total_price}</p></div>
                                        <div><p className="font-semibold text-gray-700">Amenities:</p><p className="text-gray-900">{Object.keys(formData).filter(k => k.startsWith('has_') && (formData as any)[k]).length}</p></div>
                                    </div>
                                    <details className="mt-4">
                                        <summary className="cursor-pointer text-sm font-semibold text-gray-600">View Full JSON</summary>
                                        <pre className="mt-2 p-4 bg-white rounded border border-gray-300 text-xs overflow-auto max-h-96">{JSON.stringify(formData, null, 2)}</pre>
                                    </details>
                                </div>
                            </details>
                        )}

                        {step === 1 && (
                            <motion.div
                                key="step-1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* Data Loaded Confirmation */}
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="text-sm font-bold text-blue-900">Editing Existing Property</p>
                                            <p className="text-xs text-blue-700 mt-1">
                                                Property ID: {propertyId} | All data has been loaded
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Show Current Values Summary */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <p className="text-xs font-bold text-gray-700 mb-2 uppercase">Current Values:</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-gray-600">Property Type:</span>
                                            <span className="ml-2 font-bold text-gray-900">{formData.property_type}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Listing Type:</span>
                                            <span className="ml-2 font-bold text-gray-900">{formData.listing_type}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Subtype:</span>
                                            <span className="ml-2 font-bold text-gray-900">{formData.subtype || "None"}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Location:</span>
                                            <span className="ml-2 font-bold text-gray-900">{formData.city || "Not set"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Listing Type */}
                                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                    <Label className="text-base sm:text-lg font-bold text-gray-900 mb-4 block">
                                        Listing Type
                                    </Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${formData.listing_type === "SALE"
                                            ? "border-[#2D5F3F] bg-[#F1F8F4]"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}>
                                            <input
                                                type="radio"
                                                name="listing_type"
                                                value="SALE"
                                                checked={formData.listing_type === "SALE"}
                                                onChange={handleChange}
                                                className="sr-only"
                                            />
                                            <div className="text-center">
                                                <Home className="w-8 h-8 mx-auto mb-2 text-green-600" />
                                                <p className="font-bold text-gray-900">For Sale</p>
                                            </div>
                                        </label>

                                        <label className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${formData.listing_type === "RENT"
                                            ? "border-[#2D5F3F] bg-[#F1F8F4]"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}>
                                            <input
                                                type="radio"
                                                name="listing_type"
                                                value="RENT"
                                                checked={formData.listing_type === "RENT"}
                                                onChange={handleChange}
                                                className="sr-only"
                                            />
                                            <div className="text-center">
                                                <Home className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                                                <p className="font-bold text-gray-900">For Rent</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Property Type */}
                                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                    <Label className="text-base sm:text-lg font-bold text-gray-900 mb-4 block">
                                        Property Type
                                    </Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {PROPERTY_TYPES.map(type => (
                                            <label
                                                key={type.value}
                                                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${formData.property_type === type.value
                                                    ? "border-[#2D5F3F] bg-[#F1F8F4] ring-2 ring-[#2D5F3F] ring-offset-2"
                                                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="property_type"
                                                    value={type.value}
                                                    checked={formData.property_type === type.value}
                                                    onChange={handleChange}
                                                    className="sr-only"
                                                />
                                                <div className="text-center">
                                                    <span className="text-2xl block mb-2">{type.icon}</span>
                                                    <p className="font-bold text-gray-900">{type.label}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Subtype */}
                                {SUBTYPE_OPTIONS[formData.property_type] && (
                                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                        <Label className="text-base sm:text-lg font-bold text-gray-900 mb-4 block">
                                            Property Subtype
                                        </Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {SUBTYPE_OPTIONS[formData.property_type].map((subtype: any) => (
                                                <label
                                                    key={subtype.value}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.subtype === subtype.value
                                                        ? "border-[#2D5F3F] bg-[#F1F8F4] ring-2 ring-[#2D5F3F] ring-offset-2"
                                                        : "border-gray-200 hover:border-gray-300"
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="subtype"
                                                        value={subtype.value}
                                                        checked={formData.subtype === subtype.value}
                                                        onChange={handleChange}
                                                        className="sr-only"
                                                    />
                                                    <p className="font-bold text-gray-900 text-center">{subtype.label}</p>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* STEP 2 - COMPLETE IMPLEMENTATION */}
                        {step === 2 && (
                            <motion.div
                                key="step-2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-3">
                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                                        Property Specifications
                                    </h2>
                                    <p className="text-gray-500 text-sm sm:text-base">
                                        Provide detailed information about your property
                                    </p>
                                </div>

                                {/* BHK, Bathrooms, Balconies - For Residential */}
                                {["FLAT", "VILLA_BUNGALOW", "COMMERCIAL_UNIT"].includes(formData.property_type) && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* BHK Config */}
                                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                            <Label className="text-xs font-bold uppercase text-gray-500 mb-4 block text-center">
                                                BHK Configuration
                                            </Label>

                                            {/* 1RK Button */}
                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, bhk_config: 0.5 }))}
                                                className={`w-full mb-3 py-2 px-4 rounded-lg border-2 font-bold transition-all text-sm ${formData.bhk_config === 0.5
                                                    ? 'border-green-600 bg-green-50 text-green-800'
                                                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                                    }`}
                                            >
                                                1RK
                                            </button>

                                            {/* BHK Counter */}
                                            <div className="flex items-center justify-center gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(p => ({
                                                        ...p,
                                                        bhk_config: p.bhk_config === 0.5 ? 1 : Math.max(1, Number(p.bhk_config) - 1)
                                                    }))}
                                                    className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-green-600 hover:bg-green-50 font-bold text-gray-700 transition-all"
                                                >
                                                    -
                                                </button>
                                                <span className="text-3xl font-black text-gray-900 w-16 text-center">
                                                    {formData.bhk_config === 0.5 ? "1RK" : formData.bhk_config}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(p => ({
                                                        ...p,
                                                        bhk_config: p.bhk_config === 0.5 ? 1 : Number(p.bhk_config) + 1
                                                    }))}
                                                    className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold transition-all"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {/* Bathrooms */}
                                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                            <Label className="text-xs font-bold uppercase text-gray-500 mb-4 block text-center">
                                                <Bath className="w-4 h-4 inline mr-1" />
                                                Bathrooms
                                            </Label>
                                            <div className="flex items-center justify-center gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, bathrooms: Math.max(1, p.bathrooms - 1) }))}
                                                    className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 font-bold transition-all"
                                                >
                                                    -
                                                </button>
                                                <span className="text-3xl font-black text-gray-900 w-16 text-center">
                                                    {formData.bathrooms}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, bathrooms: p.bathrooms + 1 }))}
                                                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {/* Balconies */}
                                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                            <Label className="text-xs font-bold uppercase text-gray-500 mb-4 block text-center">
                                                Balconies
                                            </Label>
                                            <div className="flex items-center justify-center gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, balconies: Math.max(0, p.balconies - 1) }))}
                                                    className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-purple-600 hover:bg-purple-50 font-bold transition-all"
                                                >
                                                    -
                                                </button>
                                                <span className="text-3xl font-black text-gray-900 w-16 text-center">
                                                    {formData.balconies}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, balconies: p.balconies + 1 }))}
                                                    className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Area Details */}
                                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Maximize2 className="w-5 h-5 text-blue-600" />
                                        Area Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {["FLAT", "VILLA_BUNGALOW", "COMMERCIAL_UNIT"].includes(formData.property_type) && (
                                            <>
                                                <div>
                                                    <Label className="text-sm font-semibold">Super Built-up Area (sq.ft)</Label>
                                                    <Input
                                                        type="number"
                                                        name="super_builtup_area"
                                                        value={formData.super_builtup_area}
                                                        onChange={handleChange}
                                                        placeholder="e.g., 1200"
                                                        className="mt-2"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-semibold">Carpet Area (sq.ft)</Label>
                                                    <Input
                                                        type="number"
                                                        name="carpet_area"
                                                        value={formData.carpet_area}
                                                        onChange={handleChange}
                                                        placeholder="e.g., 1000"
                                                        className="mt-2"
                                                    />
                                                </div>
                                            </>
                                        )}
                                        {["PLOT", "LAND", "VILLA_BUNGALOW"].includes(formData.property_type) && (
                                            <div>
                                                <Label className="text-sm font-semibold">
                                                    Plot Area (sq.ft) {["PLOT", "LAND"].includes(formData.property_type) && <span className="text-red-500">*</span>}
                                                </Label>
                                                <Input
                                                    type="number"
                                                    name="plot_area"
                                                    value={formData.plot_area}
                                                    onChange={handleChange}
                                                    placeholder="e.g., 2400"
                                                    className="mt-2"
                                                />
                                                {errors.plot_area && <p className="text-red-500 text-xs mt-1">{errors.plot_area}</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                        Pricing Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-semibold">
                                                Total Price (₹) <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                name="total_price"
                                                value={formData.total_price}
                                                onChange={handleChange}
                                                placeholder="e.g., 5000000"
                                                className="mt-2"
                                            />
                                            {errors.total_price && <p className="text-red-500 text-xs mt-1">{errors.total_price}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold">Price per sq.ft (₹)</Label>
                                            <Input
                                                type="number"
                                                name="price_per_sqft"
                                                value={formData.price_per_sqft}
                                                onChange={handleChange}
                                                placeholder="Auto-calculated or manual"
                                                className="mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold">Maintenance Charges (₹)</Label>
                                            <Input
                                                type="number"
                                                name="maintenance_charges"
                                                value={formData.maintenance_charges}
                                                onChange={handleChange}
                                                placeholder="e.g., 2000"
                                                className="mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold">Maintenance Interval</Label>
                                            <select
                                                name="maintenance_interval"
                                                value={formData.maintenance_interval}
                                                onChange={handleChange}
                                                className="mt-2 w-full h-10 px-3 border border-gray-300 rounded-lg"
                                            >
                                                <option value="MONTHLY">Monthly</option>
                                                <option value="QUARTERLY">Quarterly</option>
                                                <option value="YEARLY">Yearly</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Floor & Furnishing - For Residential */}
                                {["FLAT", "VILLA_BUNGALOW"].includes(formData.property_type) && (
                                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Floor & Furnishing</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <Label className="text-sm font-semibold">
                                                    Floor Number <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    name="specific_floor"
                                                    value={formData.specific_floor}
                                                    onChange={handleChange}
                                                    placeholder="e.g., 5 or G"
                                                    className="mt-2"
                                                />
                                                {errors.specific_floor && <p className="text-red-500 text-xs mt-1">{errors.specific_floor}</p>}
                                            </div>
                                            <div>
                                                <Label className="text-sm font-semibold">
                                                    Total Floors <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    type="number"
                                                    name="total_floors"
                                                    value={formData.total_floors}
                                                    onChange={handleChange}
                                                    placeholder="e.g., 10"
                                                    className="mt-2"
                                                />
                                                {errors.total_floors && <p className="text-red-500 text-xs mt-1">{errors.total_floors}</p>}
                                            </div>
                                            <div>
                                                <Label className="text-sm font-semibold">Furnishing Status</Label>
                                                <select
                                                    name="furnishing_status"
                                                    value={formData.furnishing_status}
                                                    onChange={handleChange}
                                                    className="mt-2 w-full h-10 px-3 border border-gray-300 rounded-lg"
                                                >
                                                    <option value="UNFURNISHED">Unfurnished</option>
                                                    <option value="SEMI_FURNISHED">Semi-Furnished</option>
                                                    <option value="FULLY_FURNISHED">Fully Furnished</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Additional Details */}
                                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="text-sm font-semibold">Facing Direction</Label>
                                            <select
                                                name="facing"
                                                value={formData.facing}
                                                onChange={handleChange}
                                                className="mt-2 w-full h-10 px-3 border border-gray-300 rounded-lg"
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
                                        <div>
                                            <Label className="text-sm font-semibold">Availability Status</Label>
                                            <select
                                                name="availability_status"
                                                value={formData.availability_status}
                                                onChange={handleChange}
                                                className="mt-2 w-full h-10 px-3 border border-gray-300 rounded-lg"
                                            >
                                                <option value="READY">Ready to Move</option>
                                                <option value="UNDER_CONSTRUCTION">Under Construction</option>
                                            </select>
                                        </div>
                                        {formData.availability_status === "UNDER_CONSTRUCTION" && (
                                            <div>
                                                <Label className="text-sm font-semibold">
                                                    Possession Date <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    type="date"
                                                    name="possession_date"
                                                    value={formData.possession_date}
                                                    onChange={handleChange}
                                                    className="mt-2"
                                                />
                                                {errors.possession_date && <p className="text-red-500 text-xs mt-1">{errors.possession_date}</p>}
                                            </div>
                                        )}
                                        <div>
                                            <Label className="text-sm font-semibold">Age of Construction (years)</Label>
                                            <Input
                                                type="number"
                                                name="age_of_construction"
                                                value={formData.age_of_construction}
                                                onChange={handleChange}
                                                placeholder="e.g., 5"
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Details */}
                                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Phone className="w-5 h-5 text-purple-600" />
                                        Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="text-sm font-semibold">Listed By</Label>
                                            <select
                                                name="listed_by"
                                                value={formData.listed_by}
                                                onChange={handleChange}
                                                className="mt-2 w-full h-10 px-3 border border-gray-300 rounded-lg"
                                            >
                                                <option value="OWNER">Owner</option>
                                                <option value="AGENT">Agent</option>
                                                <option value="BUILDER">Builder</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold">WhatsApp Number</Label>
                                            <Input
                                                type="tel"
                                                name="whatsapp_number"
                                                value={formData.whatsapp_number}
                                                onChange={handleChange}
                                                placeholder="e.g., 9876543210"
                                                className="mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold">Video Tour URL</Label>
                                            <Input
                                                type="url"
                                                name="video_url"
                                                value={formData.video_url}
                                                onChange={handleChange}
                                                placeholder="https://youtube.com/..."
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Project Name */}
                                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                    <Label className="text-sm font-semibold">Project/Building Name</Label>
                                    <Input
                                        name="project_name"
                                        value={formData.project_name}
                                        onChange={handleChange}
                                        placeholder="e.g., Green Valley Apartments"
                                        className="mt-2"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3 (Location) */}
                        {/* STEP 3 (Location) */}
                        {step === 3 && (
                            <motion.div
                                key="step-3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-2xl font-bold">Location Details</h2>
                                <div className="h-[300px] border rounded-xl overflow-hidden relative">
                                    <SmartLocationPicker
                                        initialLat={formData.latitude}
                                        initialLng={formData.longitude}
                                        onLocationSelect={(lat, lng, addr) => {
                                            setFormData(p => ({ ...p, latitude: lat, longitude: lng, city: addr.city || p.city, locality: addr.street || p.locality, pincode: addr.pincode || p.pincode }));
                                            setAddressLines(p => ({ ...p, line1: p.line1 || addr.formatted_address?.split(',')[0] || "" }));
                                        }}
                                    />
                                </div>
                                <div className="bg-white p-6 rounded-2xl border space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-3">
                                            <Label>Building/House No, Street <span className="text-red-500">*</span></Label>
                                            <Input
                                                name="line1"
                                                value={addressLines.line1}
                                                onChange={handleAddressLinesChange}
                                                placeholder="e.g., Plot No. 123, Street Name"
                                            />
                                            {errors.line1 && <p className="text-red-500 text-xs mt-1">{errors.line1}</p>}
                                        </div>
                                        <div>
                                            <Label>Locality <span className="text-red-500">*</span></Label>
                                            <Input name="locality" value={formData.locality} onChange={handleChange} />
                                            {errors.locality && <p className="text-red-500 text-xs mt-1">{errors.locality}</p>}
                                        </div>
                                        <div>
                                            <Label>City <span className="text-red-500">*</span></Label>
                                            <Input name="city" value={formData.city} onChange={handleChange} />
                                            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                                        </div>
                                        <div>
                                            <Label>Pincode <span className="text-red-500">*</span></Label>
                                            <Input name="pincode" value={formData.pincode} onChange={handleChange} />
                                            {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                                        </div>
                                        <div className="md:col-span-3">
                                            <Label>Nearby Landmarks</Label>
                                            <Textarea
                                                name="landmarks"
                                                value={formData.landmarks}
                                                onChange={handleChange}
                                                placeholder="e.g., Near City Mall, 5 min from Station"
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4 - COMPLETE IMPLEMENTATION */}
                        {step === 4 && (
                            <motion.div
                                key="step-4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-2xl font-bold">Photos & Amenities</h2>

                                {/* Gallery Images */}
                                <div className="bg-white p-6 rounded-2xl border">
                                    <h3 className="font-bold text-lg mb-4">Property Gallery</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {/* Existing Images */}
                                        {existingGalleryImages.filter(img => !imagesToDelete.includes(img.id)).map(img => (
                                            <div key={`existing-${img.id}`} className="relative aspect-square rounded-xl overflow-hidden group border-2 border-blue-200">
                                                <img src={img.image} className="w-full h-full object-cover" alt="property" />
                                                <button
                                                    type="button"
                                                    onClick={() => setImagesToDelete(p => [...p, img.id])}
                                                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                {img.is_thumbnail && (
                                                    <span className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-[10px] font-bold text-center py-1">
                                                        Cover Image
                                                    </span>
                                                )}
                                                <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded font-bold">
                                                    Existing
                                                </span>
                                            </div>
                                        ))}

                                        {/* New Images */}
                                        {galleryImages.map((file, i) => (
                                            <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-green-200">
                                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="new" />
                                                <button
                                                    type="button"
                                                    onClick={() => setGalleryImages(p => p.filter((_, idx) => idx !== i))}
                                                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <span className="absolute top-2 left-2 bg-green-600 text-white text-[10px] px-2 py-1 rounded font-bold">
                                                    NEW
                                                </span>
                                            </div>
                                        ))}

                                        {/* Add Photo Button */}
                                        {(existingGalleryImages.length - imagesToDelete.length + galleryImages.length) < 15 && (
                                            <label className="aspect-square border-2 border-dashed border-gray-300 hover:border-green-500 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 transition">
                                                <Upload className="w-6 h-6 text-gray-400" />
                                                <span className="text-xs text-gray-500 mt-2">Add Photo</span>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={e => e.target.files && setGalleryImages(p => [...p, ...Array.from(e.target.files!)])}
                                                />
                                            </label>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3">
                                        Total: {existingGalleryImages.length - imagesToDelete.length + galleryImages.length} / 15 images
                                        {imagesToDelete.length > 0 && ` (${imagesToDelete.length} marked for deletion)`}
                                    </p>
                                    {errors.gallery && <p className="text-red-500 text-sm mt-2">{errors.gallery}</p>}
                                </div>

                                {/* Floor Plans */}
                                <div className="bg-white p-6 rounded-2xl border">
                                    <h3 className="font-bold text-lg mb-4">Floor Plans</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {/* Existing Floor Plans */}
                                        {existingFloorPlans.map((fp: any, i) => {
                                            const url = typeof fp === 'string' ? fp : fp.image;
                                            if (!url) return null;
                                            return (
                                                <div key={`existing-fp-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-blue-200">
                                                    <img src={url} className="w-full h-full object-cover" alt="floor plan" />
                                                    <span className="absolute bottom-2 left-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded">Existing</span>
                                                </div>
                                            );
                                        })}

                                        {/* New Floor Plans */}
                                        {floorPlans.map((file, i) => (
                                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-green-200">
                                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="floor plan" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFloorPlans(p => p.filter((_, idx) => idx !== i))}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <span className="absolute bottom-2 left-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded">New</span>
                                            </div>
                                        ))}
                                        <label className="aspect-square border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 rounded-xl">
                                            <Upload className="w-6 h-6 text-gray-400" />
                                            <span className="text-xs text-gray-500 mt-2">Add Floor Plan</span>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*,application/pdf"
                                                className="hidden"
                                                onChange={e => e.target.files && setFloorPlans(p => [...p, ...Array.from(e.target.files!)])}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* AMENITIES - Conditional Based on Property Type */}
                                {["FLAT", "VILLA_BUNGALOW", "COMMERCIAL_UNIT"].includes(formData.property_type) && (
                                    <div className="bg-white p-6 rounded-2xl border">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                            <Star className="w-5 h-5 text-yellow-500" />
                                            Residential Amenities
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {RESIDENTIAL_AMENITIES.map(amenity => (
                                                <label
                                                    key={amenity.key}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${formData[amenity.key as keyof typeof formData]
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name={amenity.key}
                                                        checked={!!formData[amenity.key as keyof typeof formData]}
                                                        onChange={handleChange}
                                                        className="w-4 h-4 text-green-600 rounded"
                                                    />
                                                    <span className="text-sm font-medium">{amenity.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {["PLOT", "LAND"].includes(formData.property_type) && (
                                    <div className="bg-white p-6 rounded-2xl border">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                            <Star className="w-5 h-5 text-green-500" />
                                            Plot Amenities
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {PLOT_AMENITIES.map(amenity => (
                                                <label
                                                    key={amenity.key}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${formData[amenity.key as keyof typeof formData]
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name={amenity.key}
                                                        checked={!!formData[amenity.key as keyof typeof formData]}
                                                        onChange={handleChange}
                                                        className="w-4 h-4 text-green-600 rounded"
                                                    />
                                                    <span className="text-sm font-medium">{amenity.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* STEP 5 (Docs) */}
                        {step === 5 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold">Verification Documents</h2>
                                <div className="grid gap-3">
                                    {DOCUMENTS_CONFIG.map(doc => (
                                        <label key={doc.key} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer ${legalDocuments[doc.key] || existingDocuments[doc.key] ? "bg-green-50 border-green-200" : "bg-white"}`}>
                                            <div>
                                                <p className="font-bold text-sm">{doc.label} {doc.required && "*"}</p>
                                                <p className="text-xs text-gray-500">
                                                    {legalDocuments[doc.key] ? "New file selected" : existingDocuments[doc.key] ? "Document on file" : "Not uploaded"}
                                                </p>
                                            </div>
                                            <input type="file" className="hidden" onChange={e => e.target.files?.[0] && setLegalDocuments(p => ({ ...p, [doc.key]: e.target.files![0] }))} />
                                            {(legalDocuments[doc.key] || existingDocuments[doc.key]) ? <Check className="text-green-600 w-5 h-5" /> : <ChevronRight className="text-gray-300" />}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 6 (Review) */}
                        {step === 6 && (
                            <motion.div
                                key="step-6"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-3">
                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                                        Review All Changes
                                    </h2>
                                    <p className="text-gray-500 text-sm sm:text-base">
                                        Verify all information before updating your property
                                    </p>
                                </div>

                                {/* COMPLETE DATA REVIEW - Show EVERYTHING */}

                                {/* 1. BASIC INFORMATION */}
                                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Home className="w-5 h-5 text-green-600" />
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Property Type</p>
                                            <p className="text-base font-bold text-gray-900 mt-1">{formData.property_type}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Listing Type</p>
                                            <p className="text-base font-bold text-gray-900 mt-1">
                                                {formData.listing_type === "SALE" ? "For Sale" : "For Rent"}
                                            </p>
                                        </div>
                                        {formData.subtype && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Subtype</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">{formData.subtype}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Title</p>
                                            <p className="text-base font-bold text-gray-900 mt-1">{autoGeneratedTitle || formData.title}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Description</p>
                                            <p className="text-sm text-gray-700 mt-1">{autoGeneratedDescription || formData.description}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. CONFIGURATION (Conditional) */}
                                {["FLAT", "VILLA_BUNGALOW", "COMMERCIAL_UNIT"].includes(formData.property_type) && (
                                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Home className="w-5 h-5 text-blue-600" />
                                            Configuration
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">BHK</p>
                                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                                    {formData.bhk_config === 0.5 ? "1RK" : formData.bhk_config}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Bathrooms</p>
                                                <p className="text-2xl font-bold text-gray-900 mt-1">{formData.bathrooms}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Balconies</p>
                                                <p className="text-2xl font-bold text-gray-900 mt-1">{formData.balconies}</p>
                                            </div>
                                            {formData.furnishing_status && (
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-semibold">Furnishing</p>
                                                    <p className="text-base font-bold text-gray-900 mt-1">{formData.furnishing_status}</p>
                                                </div>
                                            )}
                                            {formData.specific_floor && (
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-semibold">Floor</p>
                                                    <p className="text-base font-bold text-gray-900 mt-1">
                                                        {formData.specific_floor} / {formData.total_floors}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 3. AREA DETAILS */}
                                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-purple-600" />
                                        Area Details
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {formData.super_builtup_area && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Super Built-up Area</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">{formData.super_builtup_area} sq.ft</p>
                                            </div>
                                        )}
                                        {formData.carpet_area && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Carpet Area</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">{formData.carpet_area} sq.ft</p>
                                            </div>
                                        )}
                                        {formData.plot_area && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Plot Area</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">{formData.plot_area} sq.ft</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 4. PRICING */}
                                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <IndianRupee className="w-5 h-5 text-green-600" />
                                        Pricing
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Total Price</p>
                                            <p className="text-2xl font-bold text-green-600 mt-1">
                                                ₹ {Number(formData.total_price).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        {formData.price_per_sqft && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Price per sq.ft</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">
                                                    ₹ {Number(formData.price_per_sqft).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        )}
                                        {formData.maintenance_charges > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Maintenance</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">
                                                    ₹ {formData.maintenance_charges} / {formData.maintenance_interval}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 5. LOCATION */}
                                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-red-600" />
                                        Location
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Full Address</p>
                                            <p className="text-base text-gray-900 mt-1">
                                                {[addressLines.line1, addressLines.line2, addressLines.line3]
                                                    .filter(line => line.trim() !== "")
                                                    .join(", ")}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Locality</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">{formData.locality}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">City</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">{formData.city}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Pincode</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">{formData.pincode}</p>
                                            </div>
                                        </div>
                                        {formData.landmarks && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Landmarks</p>
                                                <p className="text-sm text-gray-700 mt-1">{formData.landmarks}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 6. AMENITIES (Conditional based on property type) */}
                                {["FLAT", "VILLA_BUNGALOW", "COMMERCIAL_UNIT"].includes(formData.property_type) && (
                                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Star className="w-5 h-5 text-yellow-600" />
                                            Residential Amenities
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {RESIDENTIAL_AMENITIES.map(amenity => {
                                                const isActive = formData[amenity.key as keyof typeof formData];
                                                return isActive ? (
                                                    <div key={amenity.key} className="flex items-center gap-2 text-sm">
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                        <span className="text-gray-900">{amenity.label}</span>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                        {RESIDENTIAL_AMENITIES.every(a => !formData[a.key as keyof typeof formData]) && (
                                            <p className="text-gray-500 text-sm">No amenities selected</p>
                                        )}
                                    </div>
                                )}

                                {["PLOT", "LAND"].includes(formData.property_type) && (
                                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Star className="w-5 h-5 text-green-600" />
                                            Plot Amenities
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {PLOT_AMENITIES.map(amenity => {
                                                const isActive = formData[amenity.key as keyof typeof formData];
                                                return isActive ? (
                                                    <div key={amenity.key} className="flex items-center gap-2 text-sm">
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                        <span className="text-gray-900">{amenity.label}</span>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                        {PLOT_AMENITIES.every(a => !formData[a.key as keyof typeof formData]) && (
                                            <p className="text-gray-500 text-sm">No amenities selected</p>
                                        )}
                                    </div>
                                )}

                                {/* 7. IMAGES & DOCUMENTS STATUS */}
                                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        Media & Documents
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Gallery Images</p>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                                {existingGalleryImages.length - imagesToDelete.length + galleryImages.length}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {existingGalleryImages.length} existing, {galleryImages.length} new
                                                {imagesToDelete.length > 0 && `, ${imagesToDelete.length} to delete`}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Floor Plans</p>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                                {existingFloorPlans.length + floorPlans.length}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Documents</p>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                                {Object.keys(existingDocuments).length + Object.keys(legalDocuments).length}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {Object.keys(legalDocuments).length} new/updated
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 8. ADDITIONAL INFO */}
                                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Availability</p>
                                            <p className="text-base font-bold text-gray-900 mt-1">{formData.availability_status}</p>
                                        </div>
                                        {formData.possession_date && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Possession Date</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">{formData.possession_date}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Age of Construction</p>
                                            <p className="text-base font-bold text-gray-900 mt-1">
                                                {formData.age_of_construction} {formData.age_of_construction === 1 ? "year" : "years"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Listed By</p>
                                            <p className="text-base font-bold text-gray-900 mt-1">{formData.listed_by}</p>
                                        </div>
                                        {formData.whatsapp_number && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">WhatsApp</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">{formData.whatsapp_number}</p>
                                            </div>
                                        )}
                                        {formData.facing && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Facing</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">{formData.facing}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Warning if making changes */}
                                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-yellow-900">Updating Existing Property</p>
                                            <p className="text-xs text-yellow-700 mt-1">
                                                This will update your existing property listing. All changes will be saved to the database.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer Actions */}
            <div className="bg-white border-t p-4 fixed bottom-0 left-0 right-0 lg:left-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                        onClick={prevStep}
                        disabled={step === 1}
                        className="px-6 py-3 rounded-xl font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-100 transition"
                    >
                        Back
                    </button>

                    {step < totalSteps ? (
                        <button
                            onClick={nextStep}
                            className="px-8 py-3 bg-[#2D5F3F] text-white rounded-xl font-bold hover:bg-[#1f422c] transition flex items-center gap-2"
                        >
                            Next <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-8 py-3 bg-[#2D5F3F] text-white rounded-xl font-bold hover:bg-[#1f422c] transition flex items-center gap-2"
                        >
                            {loading ? "Updating..." : "Save Changes"} <CheckCircle className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
