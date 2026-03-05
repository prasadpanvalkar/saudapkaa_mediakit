"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/axios";
import {
    Layers, Plus, Building2, Store, ChevronDown, ChevronUp, Info, Check, X,
    Edit2, Home, LandPlot, Sprout, Sparkles, Upload, FileText, MapPin, Lock,
    ChevronLeft, ChevronRight
} from "lucide-react";
import dynamic from "next/dynamic";
import { BaseUnit, ProjectDetails, MediaItem, UnitType } from "@/components/builder/types";

const SmartLocationPicker = dynamic(
    () => import("@/components/maps/SmartLocationPicker"),
    { ssr: false, loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-xl" /> }
);

// ─── Constants ──────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
    { value: "FLAT", label: "Flat", icon: <Building2 className="w-5 h-5" /> },
    { value: "VILLA_BUNGALOW", label: "Villa/Bungalow", icon: <Home className="w-5 h-5" /> },
    { value: "PLOT", label: "Plot", icon: <LandPlot className="w-5 h-5" /> },
    { value: "LAND", label: "Land", icon: <Sprout className="w-5 h-5" /> },
    { value: "COMMERCIAL_UNIT", label: "Commercial", icon: <Store className="w-5 h-5" /> },
];

const SUBTYPE_OPTIONS: Record<string, { value: string; label: string }[]> = {
    VILLA_BUNGALOW: [{ value: "BUNGALOW", label: "Bungalow" },
    { value: "TWIN_BUNGALOW", label: "Twin Bungalow" },
    { value: "ROWHOUSE", label: "Rowhouse" },
    { value: "VILLA", label: "Villa" }],
    PLOT: [{ value: "RES_PLOT", label: "Residential Plot" },
    { value: "RES_PLOT_GUNTHEWARI", label: "Residential Plot (Gunthewari)" },
    { value: "COM_PLOT", label: "Commercial Plot" }],
    LAND: [{ value: "AGRI_LAND", label: "Agricultural Land" },
    { value: "IND_LAND", label: "Industrial Land" }],
    COMMERCIAL_UNIT: [{ value: "SHOP", label: "Shop" },
    { value: "OFFICE", label: "Office" },
    { value: "SHOWROOM", label: "Showroom" }],
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

const DOCUMENTS_CONFIG = [
    { key: "building_commencement_certificate", label: "Commencement Certificate" },
    { key: "building_completion_certificate", label: "Completion Certificate" },
    { key: "layout_sanction", label: "Layout Sanction" },
    { key: "layout_order", label: "Layout Order" },
    { key: "na_order_or_gunthewari", label: "NA/Gunthewari Order" },
    { key: "mojani_nakasha", label: "Mojani / Nakasha" },
    { key: "doc_7_12_or_pr_card", label: "7/12 / P.R. Card" },
    { key: "title_search_report", label: "Title Search Report" },
    { key: "rera_project_certificate", label: "RERA Certificate" },
    { key: "gst_registration", label: "G.S.T. Registration" },
    { key: "sale_deed_registration_copy", label: "Sale Deed Copy" },
    { key: "electricity_bill", label: "Electricity Bill" },
    { key: "sale_deed", label: "Sale Deed" },
];

const TYPE_COLORS: Record<string, string> = {
    FLAT: "from-blue-600 to-blue-500",
    VILLA_BUNGALOW: "from-purple-600 to-purple-500",
    PLOT: "from-emerald-600 to-emerald-500",
    LAND: "from-teal-700 to-teal-600",
    COMMERCIAL_UNIT: "from-amber-500 to-amber-400",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateUnitTitle(unit: BaseUnit, pd: ProjectDetails): string {
    let title = "";
    if (unit.bhk_config > 0 && ["FLAT", "VILLA_BUNGALOW"].includes(unit.type))
        title += unit.bhk_config === 0.5 ? "1RK " : `${unit.bhk_config} BHK `;
    if (unit.subtype) {
        title += unit.subtype === "RES_PLOT_GUNTHEWARI"
            ? "Residential Plot (Gunthewari) "
            : `${SUBTYPE_OPTIONS[unit.type]?.find(s => s.value === unit.subtype)?.label || ""} `;
    } else {
        title += `${PROPERTY_TYPES.find(t => t.value === unit.type)?.label || ""} `;
    }
    title += `for ${unit.listingType === "SALE" ? "Sale" : "Rent"} `;
    if (pd.locality && pd.city) title += `in ${pd.locality}, ${pd.city}`;
    else if (pd.city) title += `in ${pd.city}`;
    return title.trim();
}

function generateUnitDescription(unit: BaseUnit, pd: ProjectDetails): string {
    let desc = "";
    if (["FLAT", "VILLA_BUNGALOW"].includes(unit.type)) {
        desc += `${unit.bhk_config > 0 ? unit.bhk_config + " BHK" : "Beautiful"} `;
        desc += unit.subtype
            ? SUBTYPE_OPTIONS[unit.type]?.find(s => s.value === unit.subtype)?.label?.toLowerCase()
            : unit.type.toLowerCase();
        desc += ` available for ${unit.listingType.toLowerCase()}`;
        if (pd.locality) desc += ` in ${pd.locality}`;
        desc += ". ";
        const details: string[] = [];
        if (unit.bathrooms > 0) details.push(`${unit.bathrooms} bathrooms`);
        if (unit.balconies > 0) details.push(`${unit.balconies} balconies`);
        if (unit.furnishing_status && unit.furnishing_status !== "UNFURNISHED")
            details.push(`${unit.furnishing_status.toLowerCase().replace(/_/g, " ")} furnished`);
        if (unit.facing) details.push(`${unit.facing} facing`);
        if (details.length > 0) desc += `This property features ${details.join(", ")}. `;
        if (unit.specific_floor && unit.total_floors)
            desc += `Located on ${unit.specific_floor} out of ${unit.total_floors} floors. `;
        if (unit.availability_status === "READY") desc += "Ready to move in. ";
        else if (unit.possession_date) desc += `Possession expected by ${unit.possession_date}. `;
        if (unit.super_builtup_area) desc += `Super built-up area: ${unit.super_builtup_area} sq.ft. `;
    } else {
        desc += `${PROPERTY_TYPES.find(t => t.value === unit.type)?.label || ""} available for ${unit.listingType.toLowerCase()}`;
        if (pd.locality) desc += ` in ${pd.locality}`;
        desc += ". ";
        if (unit.plot_area || unit.super_builtup_area)
            desc += `Area: ${unit.plot_area || unit.super_builtup_area} sq.ft. `;
    }
    if (pd.projectName) desc += `Part of ${pd.projectName} project. `;
    desc += "Contact us for more details and site visit.";
    return desc.trim();
}

function getSummaryLine(u: BaseUnit): string {
    const area = u.carpet_area || u.super_builtup_area || u.plot_area;
    const areaStr = area ? `${area} sq.ft` : "Area unknown";
    switch (u.type) {
        case "FLAT":
        case "VILLA_BUNGALOW":
            return `${u.bhk_config > 0 ? (u.bhk_config === 0.5 ? "1RK" : u.bhk_config + " BHK") + " • " : ""}${areaStr}`;
        case "COMMERCIAL_UNIT":
            return `${u.subtype || "Commercial"} • ${areaStr}`;
        case "PLOT":
        case "LAND":
            return `${u.subtype ? SUBTYPE_OPTIONS[u.type]?.find(s => s.value === u.subtype)?.label || u.subtype : u.type} • ${areaStr}`;
        default:
            return areaStr;
    }
}

function isUnitComplete(u: BaseUnit): boolean {
    const hasPrice = Boolean(u.total_price && !isNaN(parseFloat(u.total_price)) && parseFloat(u.total_price) > 0);
    const hasArea = Boolean(
        (u.carpet_area && parseFloat(u.carpet_area) > 0) ||
        (u.super_builtup_area && parseFloat(u.super_builtup_area) > 0) ||
        (u.plot_area && parseFloat(u.plot_area) > 0)
    );
    const hasFloor = !["FLAT", "VILLA_BUNGALOW"].includes(u.type) || (!!u.specific_floor && !!u.total_floors);
    const hasPoss = u.availability_status !== "UNDER_CONSTRUCTION" || !!u.possession_date;
    return hasPrice && hasArea && hasFloor && hasPoss;
}

// ─── Amenity Toggle Component ─────────────────────────────────────────────────

function AmenityToggle({
    amenityList,
    unit,
    onUpdate,
}: {
    amenityList: { key: string; label: string }[];
    unit: BaseUnit;
    onUpdate: (key: keyof BaseUnit, val: boolean) => void;
}) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {amenityList.map(am => (
                <button
                    key={am.key}
                    onClick={() => onUpdate(am.key as keyof BaseUnit, !(unit as any)[am.key])}
                    className={`relative border-2 rounded-xl p-3 flex items-center justify-between text-left transition-all ${(unit as any)[am.key]
                        ? "border-primary-green bg-green-50 text-green-800 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                >
                    <span className="text-xs font-bold leading-tight">{am.label}</span>
                    {(unit as any)[am.key] && <Check className="w-4 h-4 text-primary-green min-w-[16px]" />}
                </button>
            ))}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MultiListPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [mounted, setMounted] = useState(false);
    const [showToast, setShowToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [projectDetailsCollapsed, setProjectDetailsCollapsed] = useState(false); // FIX: default open so required fields are visible
    const [docsCollapsed, setDocsCollapsed] = useState(true);
    const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
        projectName: "", locality: "", city: "", pincode: "", state: "",
        googleMapsUrl: "", reraNumber: "", builderName: "", addressLine1: "",
        addressLine2: "", addressLine3: "", landmarks: "", latitude: 19.8762, longitude: 75.3433,
    });
    // FIX: store blob URLs alongside File objects to avoid creating them during render
    const [unitFloorPlans, setUnitFloorPlans] = useState<Record<string, { file: File; blobUrl: string }[]>>({});
    const [legalDocuments, setLegalDocuments] = useState<Record<string, File | null>>({});
    const [units, setUnits] = useState<BaseUnit[]>([]);
    const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [addDropdownOpen, setAddDropdownOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // ── Effects ──────────────────────────────────────────────────────────────

    useEffect(() => {
        setMounted(true);
        if (user?.full_name) setProjectDetails(prev => ({ ...prev, builderName: user.full_name }));
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setAddDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [user]);

    // FIX: dedicated cleanup for mediaItems blob URLs — proper deps, not stale closure
    useEffect(() => {
        return () => {
            mediaItems.forEach(item => URL.revokeObjectURL(item.url));
        };
    }, [mediaItems]);

    const activeUnit = useMemo(() => units.find(u => u.id === activeUnitId), [units, activeUnitId]);

    // FIX: added activeUnitId to deps so description re-generates on unit switch
    useEffect(() => {
        if (!activeUnitId) return;
        setUnits(prev => prev.map(u => {
            if (u.id !== activeUnitId || u.descriptionManuallyEdited) return u;
            return { ...u, description: generateUnitDescription(u, projectDetails) };
        }));
    }, [
        activeUnitId,
        activeUnit?.type, activeUnit?.subtype, activeUnit?.bhk_config, activeUnit?.listingType,
        activeUnit?.bathrooms, activeUnit?.balconies, activeUnit?.furnishing_status, activeUnit?.facing,
        activeUnit?.specific_floor, activeUnit?.total_floors, activeUnit?.availability_status,
        activeUnit?.possession_date, activeUnit?.super_builtup_area, activeUnit?.plot_area,
        projectDetails.city, projectDetails.locality, projectDetails.projectName,
    ]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const toast = useCallback((message: string, type: "success" | "error" = "success") => {
        setShowToast({ message, type });
        setTimeout(() => setShowToast(null), 5000);
    }, []);

    const handleProjectDetailChange = useCallback((field: keyof ProjectDetails, val: any) => {
        setProjectDetails(prev => ({ ...prev, [field]: val }));
    }, []);

    const handleUnitUpdate = useCallback((field: keyof BaseUnit, val: any) => {
        setActiveUnitId(prev => {
            if (!prev) return prev;
            setUnits(u => u.map(unit => unit.id === prev ? { ...unit, [field]: val } : unit));
            return prev;
        });
    }, []);

    const handleAddUnit = useCallback((type: UnitType) => {
        setUnits(prev => {
            const newUnit: BaseUnit = {
                id: crypto.randomUUID(), type, subtype: "",
                name: `Unit ${prev.length + 101}`,
                title: "", description: "", descriptionManuallyEdited: false,
                listingType: "SALE", total_price: "", price_per_sqft: "",
                maintenance_charges: 0, maintenance_interval: "MONTHLY",
                super_builtup_area: "", carpet_area: "", plot_area: "",
                bhk_config: 2, bathrooms: 1, balconies: 0,
                furnishing_status: "UNFURNISHED", specific_floor: "", total_floors: "",
                facing: "", availability_status: "READY", possession_date: "",
                age_of_construction: 0, listed_by: "BUILDER",
                whatsapp_number: "", video_url: "",
                has_power_backup: false, has_lift: false, has_swimming_pool: false,
                has_clubhouse: false, has_gym: false, has_park: false,
                has_reserved_parking: false, has_security: false, is_vastu_compliant: false,
                has_intercom: false, has_piped_gas: false, has_wifi: false,
                has_drainage_line: false, has_one_gate_entry: false, has_jogging_park: false,
                has_children_park: false, has_temple: false, has_water_line: false,
                has_street_light: false, has_internal_roads: false,
                submissionStatus: "idle",
            };
            newUnit.description = generateUnitDescription(newUnit, projectDetails);
            setActiveUnitId(newUnit.id);
            return [...prev, newUnit];
        });
        setAddDropdownOpen(false);
    }, [projectDetails]);

    const handleRemoveUnit = useCallback((unitId: string) => {
        // Revoke floor plan blob URLs for this unit
        setUnitFloorPlans(prev => {
            (prev[unitId] || []).forEach(fp => URL.revokeObjectURL(fp.blobUrl));
            const next = { ...prev };
            delete next[unitId];
            return next;
        });
        setUnits(prev => {
            const remaining = prev.filter(u => u.id !== unitId);
            return remaining;
        });
        setActiveUnitId(prev => {
            if (prev !== unitId) return prev;
            return null;
        });
    }, []);

    const validateAll = useCallback((): boolean => {
        const errors: string[] = [];
        if (!projectDetails.projectName.trim()) errors.push("Project Name is required.");
        if (!projectDetails.locality.trim()) errors.push("Locality is required.");
        if (!projectDetails.city.trim()) errors.push("City is required.");
        if (!projectDetails.pincode.trim()) errors.push("Pincode is required.");
        if (!projectDetails.state.trim()) errors.push("State is required.");
        if (units.length === 0) errors.push("At least one unit must be added.");
        units.forEach(u => {
            if (!u.total_price || isNaN(parseFloat(u.total_price)) || parseFloat(u.total_price) <= 0)
                errors.push(`${u.name}: Valid price > 0 required.`);
            const hasArea = Boolean(
                (u.carpet_area && parseFloat(u.carpet_area) > 0) ||
                (u.super_builtup_area && parseFloat(u.super_builtup_area) > 0) ||
                (u.plot_area && parseFloat(u.plot_area) > 0)
            );
            if (!hasArea) errors.push(`${u.name}: At least one area field required.`);
            if (u.availability_status === "UNDER_CONSTRUCTION" && !u.possession_date)
                errors.push(`${u.name}: Possession date required for under-construction.`);
            if (["FLAT", "VILLA_BUNGALOW"].includes(u.type)) {
                if (!u.specific_floor) errors.push(`${u.name}: Floor number required.`);
                if (!u.total_floors) errors.push(`${u.name}: Total floors required.`);
            }
        });
        setValidationErrors(errors);
        if (errors.length > 0) window.scrollTo({ top: 0, behavior: "smooth" });
        return errors.length === 0;
    }, [projectDetails, units]);

    const buildPayload = useCallback((unit: BaseUnit, pd: ProjectDetails) => {
        const base = {
            title: generateUnitTitle(unit, pd),
            description: unit.description,
            listing_type: unit.listingType,
            property_type: unit.type,
            subtype: unit.subtype || undefined,
            total_price: parseFloat(unit.total_price),
            project_name: pd.projectName,
            locality: pd.locality,
            city: pd.city,
            pincode: pd.pincode,
            state: pd.state,
            address_line: [pd.addressLine1, pd.addressLine2, pd.addressLine3].filter(l => l.trim()).join(", ") || pd.locality,
            latitude: pd.latitude,
            longitude: pd.longitude,
            rera_number: pd.reraNumber || undefined,
            landmarks: pd.landmarks || undefined,
            listed_by: unit.listed_by,
            whatsapp_number: unit.whatsapp_number || undefined,
            video_url: unit.video_url || undefined,
            availability_status: unit.availability_status,
            age_of_construction: unit.age_of_construction,
            maintenance_charges: unit.maintenance_charges || undefined,
            maintenance_interval: unit.maintenance_charges > 0 ? unit.maintenance_interval : undefined,
        };

        const typeFields: Partial<BaseUnit> & Record<string, any> = {};

        if (["FLAT", "VILLA_BUNGALOW", "COMMERCIAL_UNIT"].includes(unit.type)) {
            Object.assign(typeFields, {
                bhk_config: unit.bhk_config,
                bathrooms: unit.bathrooms || undefined,
                balconies: unit.balconies || undefined,
                furnishing_status: unit.furnishing_status,
                specific_floor: unit.specific_floor || undefined,
                total_floors: unit.total_floors || undefined,
                facing: unit.facing || undefined,
                super_builtup_area: unit.super_builtup_area || undefined,
                carpet_area: unit.carpet_area || undefined,
                price_per_sqft: unit.price_per_sqft || undefined,
                possession_date: unit.possession_date && unit.availability_status === "UNDER_CONSTRUCTION"
                    ? unit.possession_date : undefined,
                has_power_backup: unit.has_power_backup, has_lift: unit.has_lift,
                has_swimming_pool: unit.has_swimming_pool, has_clubhouse: unit.has_clubhouse,
                has_gym: unit.has_gym, has_park: unit.has_park,
                has_reserved_parking: unit.has_reserved_parking, has_security: unit.has_security,
                is_vastu_compliant: unit.is_vastu_compliant, has_intercom: unit.has_intercom,
                has_piped_gas: unit.has_piped_gas, has_wifi: unit.has_wifi,
            });
        }
        if (["PLOT", "LAND"].includes(unit.type)) {
            Object.assign(typeFields, {
                plot_area: unit.plot_area || undefined,
                super_builtup_area: unit.super_builtup_area || undefined,
                carpet_area: unit.carpet_area || undefined,
                facing: unit.facing || undefined,
                price_per_sqft: unit.price_per_sqft || undefined,
                has_drainage_line: unit.has_drainage_line, has_one_gate_entry: unit.has_one_gate_entry,
                has_jogging_park: unit.has_jogging_park, has_children_park: unit.has_children_park,
                has_temple: unit.has_temple, has_water_line: unit.has_water_line,
                has_street_light: unit.has_street_light, has_internal_roads: unit.has_internal_roads,
            });
        }
        if (unit.type === "VILLA_BUNGALOW") typeFields.plot_area = unit.plot_area || undefined;

        const merged = { ...base, ...typeFields };
        return Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined && v !== ""));
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!validateAll()) return;
        setIsSubmitting(true);
        setValidationErrors([]);
        let successCount = 0;
        const isFirstUnit = (idx: number) => idx === 0;

        for (const [index, unit] of units.filter(u => u.submissionStatus !== "success").entries()) {
            // FIX: target unit.id directly, not activeUnitId
            setUnits(prev => prev.map(u => u.id === unit.id ? { ...u, submissionStatus: "submitting" } : u));
            try {
                const payloadObj = buildPayload(unit, projectDetails);
                const formData = new FormData();

                Object.entries(payloadObj).forEach(([key, val]) => {
                    if (val !== undefined && val !== null && val !== "") {
                        formData.append(key, typeof val === "boolean" ? (val ? "true" : "false") : val.toString());
                    }
                });

                // FIX: lat/lng already in payloadObj via base — NOT appended again

                // FIX: legal docs only uploaded with the first unit to avoid duplicates
                if (isFirstUnit(index)) {
                    Object.entries(legalDocuments).forEach(([key, file]) => {
                        if (file) formData.append(key, file);
                    });
                }

                (unitFloorPlans[unit.id] || []).forEach(fp => formData.append("floor_plans", fp.file));

                const response = await api.post("/api/properties/", formData, { headers: { "Content-Type": "multipart/form-data" } });
                const createdId = response.data.id || response.data.uid;

                const matchingMedia = mediaItems.filter(m => m.taggedUnitIds.includes(unit.id) && m.file);
                for (const [imgIdx, m] of matchingMedia.entries()) {
                    const imgData = new FormData();
                    imgData.append("image", m.file as Blob);
                    if (imgIdx === 0) imgData.append("is_thumbnail", "true");
                    await api.post(`/api/properties/${createdId}/upload_image/`, imgData, { headers: { "Content-Type": "multipart/form-data" } });
                }

                setUnits(prev => prev.map(u => u.id === unit.id ? { ...u, submissionStatus: "success" } : u));
                successCount++;
            } catch (err: any) {
                // Parse DRF validation dict (e.g., {"city": ["This field is required."], ...})
                let errorMsg = "Failed";
                if (err.response?.data) {
                    if (typeof err.response.data.detail === "string") {
                        errorMsg = err.response.data.detail;
                    } else if (typeof err.response.data === "object") {
                        const messages = Object.entries(err.response.data)
                            .map(([key, val]) => {
                                const msgList = Array.isArray(val) ? val.join(", ") : val;
                                // capitalize the key properly
                                const friendlyKey = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                                return `${friendlyKey}: ${msgList}`;
                            });
                        if (messages.length > 0) errorMsg = messages.join(" | ");
                    }
                }

                setUnits(prev => prev.map(u =>
                    u.id === unit.id
                        ? { ...u, submissionStatus: "error", submissionError: errorMsg }
                        : u
                ));
                if (err.response?.status === 403) {
                    toast("Your account lacks permission. Contact support to activate your builder account.", "error");
                    setIsSubmitting(false);
                    return;
                }
            }
        }

        setIsSubmitting(false);
        // FIX: proper partial/full success feedback
        const total = units.length;
        if (successCount === total) {
            toast(`✅ All ${successCount} listings published!`, "success");
            setTimeout(() => router.push("/dashboard/my-listings"), 2000);
        } else if (successCount > 0) {
            toast(`⚠️ ${successCount}/${total} listings published. Check errors above.`, "error");
        } else {
            toast("❌ Submission failed. Please check the errors and try again.", "error");
        }
    }, [validateAll, units, buildPayload, projectDetails, legalDocuments, unitFloorPlans, mediaItems, toast, router]);

    // ── Guards ────────────────────────────────────────────────────────────────

    if (!mounted) return null;
    if (!user) return <div className="p-8 text-gray-500">Loading...</div>;
    if (user.role_category !== "BUILDER") {
        return (
            <div className="max-w-4xl mx-auto mt-16 px-4">
                <div className="bg-red-50 text-red-700 p-8 rounded-2xl border border-red-200 flex flex-col items-center gap-4 text-center">
                    <h2 className="text-2xl font-bold">Access Denied</h2>
                    <p className="text-red-600">This page is strictly for verified Builder accounts.</p>
                </div>
            </div>
        );
    }

    // ── Derived ───────────────────────────────────────────────────────────────
    const completeCount = units.filter(isUnitComplete).length;
    const docCount = Object.values(legalDocuments).filter(Boolean).length;
    const projectMissingFields = !projectDetails.projectName || !projectDetails.locality || !projectDetails.city || !projectDetails.state || !projectDetails.pincode;
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 relative">

            {/* ── Toast ─────────────────────────────────────────────────────── */}
            {showToast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl font-semibold text-white text-sm flex items-center gap-2 transition-all ${showToast.type === "error" ? "bg-red-600" : "bg-green-600"}`}>
                    {showToast.message}
                </div>
            )}

            {/* ── Page Header ───────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <Layers className="w-6 h-6 text-primary-green" />
                        </div>
                        Project <span className="text-primary-green">Multi List</span>
                    </h1>
                    <p className="text-gray-500 mt-1.5 text-sm">Bulk-upload distinct units under one shared project location.</p>
                </div>

                {/* Stats Pill Bar */}
                {units.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-primary-green animate-pulse" />
                            <span className="text-xs font-bold text-gray-700">{units.length} unit{units.length > 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                            <Check className="w-3 h-3 text-green-500" />
                            <span className="text-xs font-bold text-gray-700">{completeCount} complete</span>
                        </div>
                        {mediaItems.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                                <span className="text-xs">📷</span>
                                <span className="text-xs font-bold text-gray-700">{mediaItems.length} photo{mediaItems.length !== 1 ? "s" : ""}</span>
                            </div>
                        )}
                        {docCount > 0 && (
                            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                                <FileText className="w-3 h-3 text-blue-500" />
                                <span className="text-xs font-bold text-gray-700">{docCount} docs</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Validation Errors ─────────────────────────────────────────── */}
            {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden mb-6">
                    <div className="flex items-center gap-3 px-5 py-3 bg-red-100/70 border-b border-red-200">
                        <Info className="w-4 h-4 text-red-600 shrink-0" />
                        <h4 className="font-bold text-red-700 text-sm">
                            {validationErrors.length} issue{validationErrors.length > 1 ? "s" : ""} to fix before publishing
                        </h4>
                    </div>
                    <ul className="p-4 space-y-1.5">
                        {validationErrors.map((err, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-red-600">
                                <span className="mt-0.5 shrink-0 w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-[9px] font-bold text-red-700">
                                    {i + 1}
                                </span>
                                {err}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ── Shared Project Details ─────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
                <div
                    className="flex justify-between items-center p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setProjectDetailsCollapsed(!projectDetailsCollapsed)}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                Shared Project Data
                                {projectMissingFields && (
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                        ⚠ Required fields missing
                                    </span>
                                )}
                            </h3>
                            <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1.5">
                                {projectDetails.projectName || "Click to configure shared project info"}
                                {projectDetails.latitude !== 19.8762 && (
                                    <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <MapPin className="w-2.5 h-2.5" /> Location Set
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    {projectDetailsCollapsed ? <ChevronDown className="text-gray-400" /> : <ChevronUp className="text-gray-400" />}
                </div>

                {!projectDetailsCollapsed && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50/30 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div className="space-y-1.5 xl:col-span-2">
                                <label className="text-xs font-bold uppercase text-gray-600">Project Name *</label>
                                <input type="text" value={projectDetails.projectName} onChange={e => handleProjectDetailChange("projectName", e.target.value)}
                                    className="w-full rounded-lg border-gray-300 py-2.5 text-sm" placeholder="e.g. Shree Residency Phase 2" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-gray-600">RERA Number</label>
                                <input type="text" value={projectDetails.reraNumber} onChange={e => handleProjectDetailChange("reraNumber", e.target.value)}
                                    className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-gray-600">Builder / Promoter</label>
                                <input type="text" value={projectDetails.builderName} onChange={e => handleProjectDetailChange("builderName", e.target.value)}
                                    className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 pb-2 border-b border-gray-200">Property Address</h4>
                            <div className="space-y-3 mb-4">
                                <input type="text" placeholder="Address Line 1 * (Building name, Society, Plot No.)"
                                    value={projectDetails.addressLine1} onChange={e => handleProjectDetailChange("addressLine1", e.target.value)}
                                    className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input type="text" placeholder="Address Line 2 (Street, Road)"
                                        value={projectDetails.addressLine2} onChange={e => handleProjectDetailChange("addressLine2", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                                    <input type="text" placeholder="Address Line 3 (Near landmark)"
                                        value={projectDetails.addressLine3} onChange={e => handleProjectDetailChange("addressLine3", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1.5 col-span-2 md:col-span-1">
                                    <label className="text-xs font-bold uppercase text-gray-600">Locality *</label>
                                    <input type="text" value={projectDetails.locality} onChange={e => handleProjectDetailChange("locality", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-gray-600">City *</label>
                                    <input type="text" value={projectDetails.city} onChange={e => handleProjectDetailChange("city", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-gray-600">State *</label>
                                    <input type="text" value={projectDetails.state} onChange={e => handleProjectDetailChange("state", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-gray-600">Pincode *</label>
                                    <input type="text" pattern="[0-9]{6}" maxLength={6} value={projectDetails.pincode} onChange={e => handleProjectDetailChange("pincode", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                                </div>
                            </div>
                            <div className="mt-4 space-y-1.5">
                                <label className="text-xs font-bold uppercase text-gray-600">Landmarks</label>
                                <input type="text" value={projectDetails.landmarks} onChange={e => handleProjectDetailChange("landmarks", e.target.value)}
                                    className="w-full rounded-lg border-gray-300 py-2.5 text-sm" placeholder="Near, opp., behind..." />
                            </div>
                            <div className="mt-4 space-y-1.5">
                                <label className="text-xs font-bold uppercase text-gray-600 tracking-wider">Google Maps URL</label>
                                <input type="url" value={projectDetails.googleMapsUrl} onChange={e => handleProjectDetailChange("googleMapsUrl", e.target.value)}
                                    className="w-full rounded-lg border-gray-300 py-2.5 text-sm" placeholder="https://maps.google.com/..." />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-600 tracking-wider">Pin Location on Map</label>
                            <SmartLocationPicker
                                initialLat={projectDetails.latitude}
                                initialLng={projectDetails.longitude}
                                onLocationSelect={(lat: number, lng: number) => {
                                    handleProjectDetailChange("latitude", lat);
                                    handleProjectDetailChange("longitude", lng);
                                }}
                            />
                            <p className="text-xs text-gray-400">
                                Lat: {projectDetails.latitude.toFixed(5)}, Lng: {projectDetails.longitude.toFixed(5)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Project Documents ─────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                <div
                    className="flex justify-between items-center p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setDocsCollapsed(!docsCollapsed)}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Project Documents</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {docCount} of {DOCUMENTS_CONFIG.length} uploaded
                                {docCount > 0 && <span className="text-green-600 font-bold ml-1">· Shared across all units</span>}
                            </p>
                        </div>
                    </div>
                    {docsCollapsed ? <ChevronDown className="text-gray-400" /> : <ChevronUp className="text-gray-400" />}
                </div>

                {!docsCollapsed && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50/30">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {DOCUMENTS_CONFIG.map(doc => {
                                const uploaded = legalDocuments[doc.key];
                                return (
                                    <div key={doc.key} className={`relative border-2 rounded-xl p-3.5 transition-all ${uploaded ? "border-primary-green bg-green-50" : "border-dashed border-gray-300 hover:border-gray-400 bg-white"}`}>
                                        <p className="text-xs font-bold text-gray-700 mb-2">{doc.label}</p>
                                        {uploaded ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-green-700 font-medium truncate max-w-[80%]">
                                                    <Check className="w-3 h-3 inline mr-1" />{uploaded.name}
                                                </span>
                                                <button onClick={() => setLegalDocuments(p => ({ ...p, [doc.key]: null }))} className="text-red-400 hover:text-red-600 ml-2 shrink-0">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer flex items-center gap-1.5 text-xs text-gray-400 font-medium hover:text-gray-600 transition-colors">
                                                <Upload className="w-3.5 h-3.5" /> Upload PDF / Image
                                                <input type="file" accept=".pdf,image/*" className="hidden"
                                                    onChange={e => {
                                                        const file = e.target.files?.[0];
                                                        if (file) setLegalDocuments(p => ({ ...p, [doc.key]: file }));
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            {/* ── Workspace Panel ───────────────────────────────────────────── */}
            {units.length > 0 ? (
                <div className="flex gap-6 items-start">

                    {/* ── LEFT SIDEBAR — sticky unit selector ─────────────────── */}
                    <div className="w-72 xl:w-80 shrink-0 sticky top-4 flex flex-col gap-3 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 pb-4 custom-scrollbar">

                        {/* Sidebar Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Units</h3>
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setAddDropdownOpen(!addDropdownOpen)}
                                    className="flex items-center gap-1 bg-primary-green hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Unit
                                </button>
                                {addDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 shadow-xl rounded-xl z-30 w-52 overflow-hidden">
                                        {PROPERTY_TYPES.map(type => (
                                            <button
                                                key={type.value}
                                                onClick={() => handleAddUnit(type.value as UnitType)}
                                                className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-center gap-3 text-sm text-gray-700 font-semibold border-b border-gray-100 last:border-0"
                                            >
                                                <span className="text-primary-green [&>svg]:w-4 [&>svg]:h-4">{type.icon}</span>
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Unit Cards */}
                        {units.map(u => {
                            const isActive = u.id === activeUnitId;
                            const isComp = isUnitComplete(u);
                            const unitPhotos = mediaItems.filter(m => m.taggedUnitIds.includes(u.id));

                            return (
                                <div
                                    key={u.id}
                                    onClick={() => setActiveUnitId(u.id)}
                                    className={`relative bg-white rounded-xl shadow-sm cursor-pointer border-2 transition-all group ${isActive ? "border-primary-green ring-2 ring-primary-green/10" : "border-gray-200 hover:border-gray-300"}`}
                                >
                                    {/* Gradient color bar */}
                                    <div className={`h-12 relative rounded-t-[10px] flex items-center justify-between px-3 bg-gradient-to-r ${TYPE_COLORS[u.type] || "from-gray-600 to-gray-500"}`}>
                                        <div className="flex items-center gap-1.5 text-white">
                                            <span className="opacity-80 [&>svg]:w-3.5 [&>svg]:h-3.5">
                                                {PROPERTY_TYPES.find(t => t.value === u.type)?.icon}
                                            </span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-90">
                                                {u.type.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {(unitFloorPlans[u.id] || []).length > 0 && (
                                                <span className="text-[8px] text-white/90 font-bold bg-white/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                    <FileText className="w-2 h-2" /> {(unitFloorPlans[u.id] || []).length}
                                                </span>
                                            )}
                                            {/* Completion dot */}
                                            <div className={`w-2.5 h-2.5 rounded-full border border-white/50 shadow-sm ${isComp ? "bg-green-400" : "bg-red-400"}`} />
                                        </div>
                                    </div>

                                    {/* Card body */}
                                    <div className="p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-gray-800 text-sm truncate">{u.name}</h4>
                                                <p className="text-[11px] text-gray-400 font-medium mt-0.5">{getSummaryLine(u)}</p>
                                            </div>
                                            {/* Remove button */}
                                            <button
                                                onClick={e => { e.stopPropagation(); handleRemoveUnit(u.id); }}
                                                className="shrink-0 w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                            {unitPhotos.length > 0 && (
                                                <span className="text-[9px] text-violet-600 font-bold bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                    📷 {unitPhotos.length}
                                                </span>
                                            )}
                                            {isActive && (
                                                <span className="text-[9px] text-primary-green font-bold bg-green-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                    <Edit2 className="w-2 h-2" /> Editing
                                                </span>
                                            )}
                                            {u.submissionStatus === "submitting" && (
                                                <span className="text-[9px] text-blue-500 font-bold animate-pulse">Submitting...</span>
                                            )}
                                            {u.submissionStatus === "success" && (
                                                <span className="text-[9px] text-green-600 font-bold flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> Done</span>
                                            )}
                                            {u.submissionStatus === "error" && (
                                                <span className="text-[9px] text-red-600 font-bold truncate">⚠ {u.submissionError}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── RIGHT PANEL — unit config form ───────────────────────── */}
                    <div className="flex-1 min-w-0 flex flex-col gap-5">
                        {activeUnit ? (
                            <>
                                {/* Unit Header Bar */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="flex items-center gap-4 px-6 py-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${TYPE_COLORS[activeUnit.type]}`}>
                                            <span className="[&>svg]:w-5 [&>svg]:h-5">
                                                {PROPERTY_TYPES.find(t => t.value === activeUnit.type)?.icon}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <input
                                                type="text"
                                                value={activeUnit.name}
                                                onChange={e => handleUnitUpdate("name", e.target.value)}
                                                className="bg-transparent border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-primary-green focus:ring-0 p-0.5 text-xl font-bold w-full text-gray-900"
                                                placeholder="Internal Unit Name"
                                            />
                                            <p className="text-xs text-gray-400 mt-1 truncate flex items-center gap-1">
                                                <Lock className="w-2.5 h-2.5 shrink-0" />
                                                <span className="truncate">{generateUnitTitle(activeUnit, projectDetails) || "Fill in property type and city to preview title"}</span>
                                            </p>
                                        </div>
                                        <div className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${isUnitComplete(activeUnit) ? "text-green-700 bg-green-50 border-green-200" : "text-amber-700 bg-amber-50 border-amber-200"}`}>
                                            {isUnitComplete(activeUnit) ? "✓ Complete" : "⚠ Incomplete"}
                                        </div>
                                    </div>
                                </div>

                                {/* Auto Listing Info */}
                                <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="flex items-center justify-between px-5 py-3 bg-slate-100/60 border-b border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-violet-500" />
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Auto Listing Info</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium">Updates live as you fill the form</span>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        {/* Title read-only */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <Lock className="w-3 h-3 text-slate-400" />
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Listing Title (Auto)</label>
                                            </div>
                                            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2.5">
                                                <span className="text-sm font-semibold text-slate-700 flex-1 leading-snug">
                                                    {generateUnitTitle(activeUnit, projectDetails) || <span className="text-slate-400 font-normal italic">Fill details to generate title...</span>}
                                                </span>
                                                <span className="shrink-0 text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider">Auto</span>
                                            </div>
                                        </div>

                                        {/* Description editable */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <Edit2 className="w-3 h-3 text-slate-400" />
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Listing Description</label>
                                                    {activeUnit.descriptionManuallyEdited && (
                                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase">Edited</span>
                                                    )}
                                                </div>
                                                {activeUnit.descriptionManuallyEdited && (
                                                    <button
                                                        onClick={() => {
                                                            const regen = generateUnitDescription(activeUnit, projectDetails);
                                                            setUnits(prev => prev.map(u => u.id === activeUnit.id ? { ...u, description: regen, descriptionManuallyEdited: false } : u));
                                                        }}
                                                        className="text-[10px] text-blue-500 hover:text-blue-700 font-bold flex items-center gap-1"
                                                    >
                                                        <Sparkles className="w-2.5 h-2.5" /> Reset to Auto
                                                    </button>
                                                )}
                                            </div>
                                            <textarea
                                                rows={4}
                                                value={activeUnit.description}
                                                onChange={e => {
                                                    handleUnitUpdate("description", e.target.value);
                                                    handleUnitUpdate("descriptionManuallyEdited", true);
                                                }}
                                                className={`w-full rounded-lg text-sm p-3 resize-none focus:ring-1 transition-colors leading-relaxed text-slate-700 ${activeUnit.descriptionManuallyEdited ? "border-amber-300 focus:border-amber-400 focus:ring-amber-200 bg-amber-50/20" : "border-blue-200 focus:border-blue-300 focus:ring-blue-100 bg-blue-50/10"}`}
                                                placeholder="Description will auto-generate as you fill in property details..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ── FORM GRID ──────────────────────────────────────── */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                                    {/* A. Classification */}
                                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <span className="w-0.5 h-4 bg-primary-green rounded-full" /> Classification
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700">Listing Type</label>
                                                <select value={activeUnit.listingType} onChange={e => handleUnitUpdate("listingType", e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm font-medium">
                                                    <option value="SALE">SALE</option>
                                                    <option value="RENT">RENT</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700">Property Type</label>
                                                <select value={activeUnit.type} onChange={e => handleUnitUpdate("type", e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm font-medium">
                                                    {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        {SUBTYPE_OPTIONS[activeUnit.type] && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700">Specific Category</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {SUBTYPE_OPTIONS[activeUnit.type].map(opt => (
                                                        <button
                                                            key={opt.value}
                                                            onClick={() => handleUnitUpdate("subtype", opt.value)}
                                                            className={`py-1.5 px-3 rounded-full border text-xs font-bold transition-all ${activeUnit.subtype === opt.value ? "bg-primary-green text-white border-primary-green" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-300"}`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* B. Pricing */}
                                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-primary-green space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <span className="w-0.5 h-4 bg-primary-green rounded-full" /> Pricing
                                        </h4>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-800">Total Price <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                                                <input type="number" value={activeUnit.total_price} onChange={e => handleUnitUpdate("total_price", e.target.value)}
                                                    className={`w-full text-lg rounded-lg shadow-sm py-2.5 pl-8 font-bold ${!activeUnit.total_price ? "border-red-300 focus:border-red-500 bg-red-50/20" : "border-gray-300 focus:border-primary-green"}`}
                                                    placeholder="0.00" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700">Price / sq.ft</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                                                    <input type="number" value={activeUnit.price_per_sqft} onChange={e => handleUnitUpdate("price_per_sqft", e.target.value)}
                                                        className="w-full rounded-lg py-2.5 pl-8 text-sm border-gray-300 focus:border-primary-green" placeholder="0" />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700">Maint. Charge</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                                                    <input type="number" value={activeUnit.maintenance_charges || ""} onChange={e => handleUnitUpdate("maintenance_charges", parseInt(e.target.value) || 0)}
                                                        className="w-full rounded-lg py-2.5 pl-8 text-sm border-gray-300" />
                                                </div>
                                            </div>
                                        </div>
                                        {activeUnit.maintenance_charges > 0 && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700">Maintenance Interval</label>
                                                <select value={activeUnit.maintenance_interval} onChange={e => handleUnitUpdate("maintenance_interval", e.target.value)} className="w-full rounded-lg py-2.5 text-sm border-gray-300">
                                                    <option value="MONTHLY">Monthly</option>
                                                    <option value="QUARTERLY">Quarterly</option>
                                                    <option value="YEARLY">Yearly</option>
                                                    <option value="ONE_TIME">One-Time</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* C. Configuration (Flat/Villa/Commercial) */}
                                    {["FLAT", "VILLA_BUNGALOW", "COMMERCIAL_UNIT"].includes(activeUnit.type) && (
                                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                                <span className="w-0.5 h-4 bg-primary-green rounded-full" /> Configuration
                                            </h4>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-700">BHK</label>
                                                    <div className="flex bg-gray-50 rounded-lg border border-gray-300 overflow-hidden items-center justify-between p-1">
                                                        {activeUnit.bhk_config === 0.5 ? (
                                                            <span className="text-sm font-bold w-full text-center py-1">1RK</span>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => activeUnit.bhk_config > 1 && handleUnitUpdate("bhk_config", activeUnit.bhk_config - 1)} className="p-1 hover:bg-white rounded border">
                                                                    <ChevronLeft className="w-4 h-4" />
                                                                </button>
                                                                <span className="text-sm font-bold">{activeUnit.bhk_config || 0}</span>
                                                                <button onClick={() => handleUnitUpdate("bhk_config", (activeUnit.bhk_config || 0) + 1)} className="p-1 hover:bg-white rounded border">
                                                                    <Plus className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                    <button onClick={() => handleUnitUpdate("bhk_config", activeUnit.bhk_config === 0.5 ? 1 : 0.5)} className="text-[10px] text-blue-600 font-bold hover:underline">
                                                        {activeUnit.bhk_config === 0.5 ? "Back to BHK" : "Switch to 1RK"}
                                                    </button>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-700">Bathrooms</label>
                                                    <input type="number" min="0" max="10" value={activeUnit.bathrooms} onChange={e => handleUnitUpdate("bathrooms", parseInt(e.target.value) || 0)}
                                                        className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-700">Balconies</label>
                                                    <input type="number" min="0" max="10" value={activeUnit.balconies} onChange={e => handleUnitUpdate("balconies", parseInt(e.target.value) || 0)}
                                                        className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700">Furnishing</label>
                                                <div className="flex bg-gray-100 rounded-lg p-1">
                                                    {["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"].map(f => (
                                                        <button key={f} onClick={() => handleUnitUpdate("furnishing_status", f)}
                                                            className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${activeUnit.furnishing_status === f ? "bg-white shadow text-primary-green" : "text-gray-500 hover:text-gray-700"}`}>
                                                            {f.replace(/_/g, " ")}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-700">Floor No. *</label>
                                                    <input type="number" value={activeUnit.specific_floor} onChange={e => handleUnitUpdate("specific_floor", e.target.value)}
                                                        className={`w-full rounded-lg py-2.5 text-sm ${!activeUnit.specific_floor ? "border-amber-300 bg-amber-50/30" : "border-gray-300"}`} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-700">Total Floors *</label>
                                                    <input type="number" value={activeUnit.total_floors} onChange={e => handleUnitUpdate("total_floors", e.target.value)}
                                                        className={`w-full rounded-lg py-2.5 text-sm ${!activeUnit.total_floors ? "border-amber-300 bg-amber-50/30" : "border-gray-300"}`} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-700">Constr. Age (yrs)</label>
                                                    <input type="number" value={activeUnit.age_of_construction || ""} onChange={e => handleUnitUpdate("age_of_construction", parseInt(e.target.value) || 0)}
                                                        className="w-full rounded-lg border-gray-300 py-2.5 text-sm" placeholder="0" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* D. Space & Orientation */}
                                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <span className="w-0.5 h-4 bg-primary-green rounded-full" /> Space & Orientation
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700">Carpet Area</label>
                                                <div className="relative">
                                                    <input type="number" value={activeUnit.carpet_area} onChange={e => handleUnitUpdate("carpet_area", e.target.value)}
                                                        className="w-full rounded-lg py-2.5 pr-9 pl-3 text-sm font-semibold border-gray-300" placeholder="0" />
                                                    <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">ft²</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700">Super Builtup</label>
                                                <div className="relative">
                                                    <input type="number" value={activeUnit.super_builtup_area} onChange={e => handleUnitUpdate("super_builtup_area", e.target.value)}
                                                        className="w-full rounded-lg py-2.5 pr-9 pl-3 text-sm font-semibold border-gray-300" placeholder="0" />
                                                    <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">ft²</span>
                                                </div>
                                            </div>
                                            {["PLOT", "LAND", "VILLA_BUNGALOW"].includes(activeUnit.type) && (
                                                <div className="space-y-1.5 col-span-2">
                                                    <label className="text-xs font-bold text-gray-700">Plot Area</label>
                                                    <div className="relative">
                                                        <input type="number" value={activeUnit.plot_area} onChange={e => handleUnitUpdate("plot_area", e.target.value)}
                                                            className="w-full rounded-lg py-2.5 pr-9 pl-3 text-sm font-semibold border-gray-300" placeholder="0" />
                                                        <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">ft²</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700">Facing Direction</label>
                                            <select value={activeUnit.facing} onChange={e => handleUnitUpdate("facing", e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm font-medium">
                                                <option value="">Select Direction...</option>
                                                {["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"].map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700">Availability</label>
                                            <div className="flex bg-gray-100 rounded-lg p-1">
                                                <button onClick={() => handleUnitUpdate("availability_status", "READY")}
                                                    className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${activeUnit.availability_status === "READY" ? "bg-white shadow text-primary-green" : "text-gray-500"}`}>
                                                    Ready to Move
                                                </button>
                                                <button onClick={() => handleUnitUpdate("availability_status", "UNDER_CONSTRUCTION")}
                                                    className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${activeUnit.availability_status === "UNDER_CONSTRUCTION" ? "bg-white shadow text-primary-green" : "text-gray-500"}`}>
                                                    Under Const.
                                                </button>
                                            </div>
                                            {activeUnit.availability_status === "UNDER_CONSTRUCTION" && (
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-600 uppercase">Possession Date *</label>
                                                    <input type="date" value={activeUnit.possession_date} onChange={e => handleUnitUpdate("possession_date", e.target.value)}
                                                        className={`w-full rounded-lg text-sm p-2.5 ${!activeUnit.possession_date ? "border-amber-300 bg-amber-50/30" : "border-gray-300"}`} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* E. Contact */}
                                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <span className="w-0.5 h-4 bg-primary-green rounded-full" /> Visibility & Contact
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700">Listed By</label>
                                                <select value={activeUnit.listed_by} onChange={e => handleUnitUpdate("listed_by", e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm">
                                                    <option value="BUILDER">Builder (Me)</option>
                                                    <option value="OWNER">Owner</option>
                                                    <option value="BROKER">Broker</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700">WhatsApp No.</label>
                                                <input type="text" value={activeUnit.whatsapp_number} onChange={e => handleUnitUpdate("whatsapp_number", e.target.value)}
                                                    className="w-full rounded-lg border-gray-300 py-2.5 text-sm" placeholder="+91XXXXXXXXXX" />
                                            </div>
                                            <div className="space-y-1.5 col-span-2">
                                                <label className="text-xs font-bold text-gray-700">Promo Video URL</label>
                                                <input type="url" value={activeUnit.video_url} onChange={e => handleUnitUpdate("video_url", e.target.value)}
                                                    className="w-full rounded-lg border-gray-300 py-2.5 text-sm" placeholder="https://youtube.com/..." />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Amenities ─────────────────────────────────────── */}
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                        <span className="w-0.5 h-4 bg-primary-green rounded-full" /> Provided Amenities
                                    </h4>
                                    <AmenityToggle
                                        amenityList={["FLAT", "VILLA_BUNGALOW", "COMMERCIAL_UNIT"].includes(activeUnit.type) ? RESIDENTIAL_AMENITIES : PLOT_AMENITIES}
                                        unit={activeUnit}
                                        onUpdate={handleUnitUpdate}
                                    />
                                </div>

                                {/* ── Floor Plans ───────────────────────────────────── */}
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <span className="w-0.5 h-4 bg-primary-green rounded-full" /> Floor Plans
                                        </h4>
                                        <span className="text-xs text-gray-400">{(unitFloorPlans[activeUnit.id] || []).length} uploaded</span>
                                    </div>

                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <Upload className="w-5 h-5 text-gray-400 mb-1" />
                                        <p className="text-xs font-semibold text-gray-500">Upload Floor Plan Images</p>
                                        <p className="text-[10px] text-gray-400">PNG, JPG, PDF accepted</p>
                                        <input type="file" multiple accept="image/*,.pdf" className="hidden"
                                            onChange={e => {
                                                if (e.target.files) {
                                                    const newEntries = Array.from(e.target.files).map(file => ({
                                                        file,
                                                        // FIX: create blob URL at upload time, not during render
                                                        blobUrl: URL.createObjectURL(file),
                                                    }));
                                                    setUnitFloorPlans(prev => ({
                                                        ...prev,
                                                        [activeUnit.id]: [...(prev[activeUnit.id] || []), ...newEntries],
                                                    }));
                                                }
                                            }}
                                        />
                                    </label>

                                    {(unitFloorPlans[activeUnit.id] || []).length > 0 && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-3">
                                            {(unitFloorPlans[activeUnit.id] || []).map((fp, idx) => (
                                                <div key={idx} className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                                                    <div className="h-20 flex items-center justify-center bg-gray-100">
                                                        {fp.file.type.startsWith("image/") ? (
                                                            // FIX: use stored blobUrl, not URL.createObjectURL during render
                                                            <img src={fp.blobUrl} alt="floor plan" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="flex flex-col items-center text-gray-400">
                                                                <FileText className="w-6 h-6" />
                                                                <span className="text-[9px] mt-1 font-bold">PDF</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            // FIX: revoke blob URL before removing
                                                            URL.revokeObjectURL(fp.blobUrl);
                                                            setUnitFloorPlans(prev => ({
                                                                ...prev,
                                                                [activeUnit.id]: prev[activeUnit.id].filter((_, i) => i !== idx),
                                                            }));
                                                        }}
                                                        className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                    <p className="text-[9px] font-medium text-gray-500 p-1.5 truncate">{fp.file.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            /* Empty state when no unit selected */
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-16 min-h-[500px] text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Layers className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Select a Unit to Configure</h3>
                                <p className="text-gray-400 text-sm max-w-xs">Click any unit card on the left to edit its price, area, configuration, and amenities.</p>
                            </div>
                        )}
                    </div>
                </div>

            ) : (
                /* Empty state — no units added yet */
                <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                        <Layers className="w-8 h-8 text-primary-green" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Start Adding Units</h3>
                    <p className="text-gray-500 max-w-sm text-sm leading-relaxed mb-8">
                        Add different property units — each gets its own price, config, and photos. All share the same project location.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
                        {PROPERTY_TYPES.map(type => (
                            <button key={type.value} onClick={() => handleAddUnit(type.value as UnitType)}
                                className="flex flex-col items-center gap-2 bg-white border border-gray-200 hover:border-primary-green hover:bg-green-50 px-4 py-3 rounded-xl font-bold text-gray-600 hover:text-primary-green transition-all shadow-sm text-xs">
                                <span className="text-primary-green [&>svg]:w-5 [&>svg]:h-5">{type.icon}</span>
                                Add {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Photo Gallery ─────────────────────────────────────────────── */}
            {units.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Property Gallery</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Upload photos and tag them to units. First tagged image per unit = thumbnail.</p>
                        </div>
                        <span className="text-xs text-gray-400 font-medium bg-gray-100 px-3 py-1.5 rounded-full">
                            {mediaItems.length} photo{mediaItems.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors mb-6">
                        <Plus className="w-6 h-6 mb-1.5 text-gray-400" />
                        <p className="text-sm font-semibold text-gray-500">Upload property photos</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {activeUnitId
                                ? `Auto-tagged to ${units.find(u => u.id === activeUnitId)?.name}`
                                : "Select a unit first to auto-tag photos"}
                        </p>
                        <input type="file" multiple accept="image/*" className="hidden"
                            onChange={e => {
                                if (!activeUnitId && units.length > 0) {
                                    toast("⚠️ No unit selected. Photos uploaded but not tagged.", "error");
                                }
                                if (e.target.files) {
                                    setMediaItems(p => [
                                        ...p,
                                        ...Array.from(e.target.files || []).map(f => ({
                                            id: crypto.randomUUID(),
                                            url: URL.createObjectURL(f),
                                            file: f,
                                            taggedUnitIds: activeUnitId ? [activeUnitId] : [],
                                        })),
                                    ]);
                                }
                            }}
                        />
                    </label>

                    {mediaItems.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {mediaItems.map(item => (
                                <div key={item.id} className="relative rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white group">
                                    {item.taggedUnitIds.length === 0 && (
                                        <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-[9px] font-bold text-center py-1 z-10">
                                            ⚠ Not tagged
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            URL.revokeObjectURL(item.url);
                                            setMediaItems(p => p.filter(m => m.id !== item.id));
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    <img src={item.url} alt="preview" className="w-full h-32 object-cover bg-gray-100" />
                                    <div className="p-2.5 border-t bg-gray-50/80">
                                        <p className="text-[9px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                                            <Building2 className="w-2.5 h-2.5" /> Tag to Units
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {units.map(u => {
                                                const tagged = item.taggedUnitIds.includes(u.id);
                                                return (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => setMediaItems(prev => prev.map(m =>
                                                            m.id === item.id
                                                                ? { ...m, taggedUnitIds: tagged ? m.taggedUnitIds.filter(id => id !== u.id) : [...m.taggedUnitIds, u.id] }
                                                                : m
                                                        ))}
                                                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border transition-all flex items-center gap-0.5 ${tagged ? "bg-primary-green text-white border-primary-green" : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"}`}
                                                    >
                                                        {tagged && <Check className="w-2 h-2" />}
                                                        {u.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {item.taggedUnitIds.length > 0 && (
                                            <p className="text-[9px] text-green-600 font-medium mt-1.5">
                                                ✓ {item.taggedUnitIds.length} unit{item.taggedUnitIds.length > 1 ? "s" : ""}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Fixed Submit Footer ───────────────────────────────────────── */}
            {units.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-2xl z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center border border-green-200">
                                <Layers className="w-5 h-5 text-primary-green" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">
                                    <span className="text-lg text-primary-green mr-1">{units.length}</span>
                                    unit{units.length > 1 ? "s" : ""} ready to publish
                                </p>
                                <p className="text-xs text-gray-400">
                                    {completeCount}/{units.length} complete
                                    {mediaItems.length > 0 && ` · ${mediaItems.length} photo${mediaItems.length !== 1 ? "s" : ""}`}
                                    {docCount > 0 && ` · ${docCount} docs`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-primary-green hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Submitting Batch...
                                </>
                            ) : (
                                <>
                                    Publish Catalog
                                    <Check className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
