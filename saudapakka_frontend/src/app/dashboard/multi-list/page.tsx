"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/axios";
import { Layers, ChevronLeft, ChevronRight, Plus, Building2, Store, ChevronDown, ChevronUp, Info, Check, X, Edit2, Home, LandPlot, Sprout, Sparkles, Upload, FileText, MapPin, Lock } from "lucide-react";
import dynamic from "next/dynamic";

const SmartLocationPicker = dynamic(
    () => import("@/components/maps/SmartLocationPicker"),
    { ssr: false, loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-xl" /> }
);
import { BaseUnit, ProjectDetails, MediaItem, UnitType } from "@/components/builder/types";

// Setup Constants derived from CreatePropertyPage
const PROPERTY_TYPES = [
    { value: "FLAT", label: "Flat", icon: <Building2 className="w-5 h-5" /> },
    { value: "VILLA_BUNGALOW", label: "Villa/Bungalow", icon: <Home className="w-5 h-5" /> },
    { value: "PLOT", label: "Plot", icon: <LandPlot className="w-5 h-5" /> },
    { value: "LAND", label: "Land", icon: <Sprout className="w-5 h-5" /> },
    { value: "COMMERCIAL_UNIT", label: "Commercial", icon: <Store className="w-5 h-5" /> }
];

const SUBTYPE_OPTIONS: Record<string, { value: string; label: string }[]> = {
    VILLA_BUNGALOW: [{ value: "BUNGALOW", label: "Bungalow" }, { value: "TWIN_BUNGALOW", label: "Twin Bungalow" }, { value: "ROWHOUSE", label: "Rowhouse" }, { value: "VILLA", label: "Villa" }],
    PLOT: [{ value: "RES_PLOT", label: "Residential Plot" }, { value: "RES_PLOT_GUNTHEWARI", label: "Residential Plot (Gunthewari)" }, { value: "COM_PLOT", label: "Commercial Plot" }],
    LAND: [{ value: "AGRI_LAND", label: "Agricultural Land" }, { value: "IND_LAND", label: "Industrial Land" }],
    COMMERCIAL_UNIT: [{ value: "SHOP", label: "Shop" }, { value: "OFFICE", label: "Office" }, { value: "SHOWROOM", label: "Showroom" }]
};

const RESIDENTIAL_AMENITIES = [
    { key: "has_power_backup", label: "Power Backup" }, { key: "has_lift", label: "Lift" }, { key: "has_swimming_pool", label: "Swimming Pool" },
    { key: "has_clubhouse", label: "Club House" }, { key: "has_gym", label: "Gymnasium" }, { key: "has_park", label: "Garden/Park" },
    { key: "has_reserved_parking", label: "Parking" }, { key: "has_security", label: "24/7 Security" }, { key: "is_vastu_compliant", label: "Vastu" },
    { key: "has_intercom", label: "Intercom" }, { key: "has_piped_gas", label: "Piped Gas" }, { key: "has_wifi", label: "WiFi" }
];

const PLOT_AMENITIES = [
    { key: "has_drainage_line", label: "Drainage Line" }, { key: "has_one_gate_entry", label: "One Gate Entry" }, { key: "has_jogging_park", label: "Jogging Park" },
    { key: "has_children_park", label: "Children Park" }, { key: "has_temple", label: "Temple" }, { key: "has_water_line", label: "Water Line" },
    { key: "has_street_light", label: "Street Light" }, { key: "has_internal_roads", label: "Internal Roads" }
];

const DOCUMENTS_CONFIG = [
    { key: "building_commencement_certificate", label: "Commencement Certificate", required: false },
    { key: "building_completion_certificate", label: "Completion Certificate", required: false },
    { key: "layout_sanction", label: "Layout Sanction", required: false },
    { key: "layout_order", label: "Layout Order", required: false },
    { key: "na_order_or_gunthewari", label: "NA/Gunthewari Order", required: false },
    { key: "mojani_nakasha", label: "Mojani / Nakasha", required: false },
    { key: "doc_7_12_or_pr_card", label: "7/12 / P.R. Card", required: false },
    { key: "title_search_report", label: "Title Search Report", required: false },
    { key: "rera_project_certificate", label: "RERA Certificate", required: false },
    { key: "gst_registration", label: "G.S.T. Registration", required: false },
    { key: "sale_deed_registration_copy", label: "Sale Deed Copy", required: false },
    { key: "electricity_bill", label: "Electricity Bill", required: false },
    { key: "sale_deed", label: "Sale Deed", required: false }
];

export default function MultiListPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [mounted, setMounted] = useState(false);
    const [showToast, setShowToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const [projectDetailsCollapsed, setProjectDetailsCollapsed] = useState(true);
    const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
        projectName: '', locality: '', city: '', pincode: '', state: '', googleMapsUrl: '', reraNumber: '', builderName: '', addressLine1: '', addressLine2: '', addressLine3: '', landmarks: '', latitude: 19.8762, longitude: 75.3433
    });
    const [unitFloorPlans, setUnitFloorPlans] = useState<Record<string, File[]>>({});
    const [legalDocuments, setLegalDocuments] = useState<Record<string, File | null>>({});
    const [docsCollapsed, setDocsCollapsed] = useState(true);

    const [units, setUnits] = useState<BaseUnit[]>([]);
    const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [addDropdownOpen, setAddDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (user?.full_name) setProjectDetails(prev => ({ ...prev, builderName: user.full_name }));
        const handleClickOutside = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setAddDropdownOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); mediaItems.forEach(item => URL.revokeObjectURL(item.url)); };
    }, [user]);

    const activeUnit = units.find(u => u.id === activeUnitId);

    useEffect(() => {
        if (!activeUnitId) return;
        setUnits(prev => prev.map(u => {
            if (u.id !== activeUnitId) return u;
            if (u.descriptionManuallyEdited) return u;
            return {
                ...u,
                description: generateUnitDescription(u, projectDetails)
            };
        }));
    }, [
        activeUnit?.type, activeUnit?.subtype, activeUnit?.bhk_config, activeUnit?.listingType,
        activeUnit?.bathrooms, activeUnit?.balconies, activeUnit?.furnishing_status, activeUnit?.facing,
        activeUnit?.specific_floor, activeUnit?.total_floors, activeUnit?.availability_status,
        activeUnit?.possession_date, activeUnit?.super_builtup_area, activeUnit?.plot_area,
        projectDetails.city, projectDetails.locality, projectDetails.projectName,
    ]);

    if (!mounted) return null;
    if (!user) return <div className="p-8">Loading...</div>;
    if (user.role_category !== 'BUILDER') {
        return (
            <div className="max-w-6xl mx-auto space-y-8 mt-10">
                <div className="bg-red-50 text-red-700 p-6 rounded-2xl border flex items-center justify-center flex-col gap-4 text-center">
                    <h2 className="text-2xl font-bold">Access Denied</h2>
                    <p>Strictly available for verified Builder accounts.</p>
                </div>
            </div>
        );
    }

    const toast = (message: string, type: 'success' | 'error' = 'success') => {
        setShowToast({ message, type });
        setTimeout(() => setShowToast(null), 5000);
    };

    const handleProjectDetailChange = (field: keyof ProjectDetails, val: any) => setProjectDetails(prev => ({ ...prev, [field]: val }));

    const handleAddUnit = (type: UnitType) => {
        const newUnit: BaseUnit = {
            id: crypto.randomUUID(), type, subtype: '', name: `Unit ${units.length + 101}`, title: '', description: '', descriptionManuallyEdited: false, listingType: 'SALE',
            total_price: '', price_per_sqft: '', maintenance_charges: 0, maintenance_interval: 'MONTHLY', super_builtup_area: '', carpet_area: '', plot_area: '',
            bhk_config: 2, bathrooms: 1, balconies: 0, furnishing_status: 'UNFURNISHED', specific_floor: '', total_floors: '', facing: '',
            availability_status: 'READY', possession_date: '', age_of_construction: 0, listed_by: 'BUILDER', whatsapp_number: '', video_url: '',
            has_power_backup: false, has_lift: false, has_swimming_pool: false, has_clubhouse: false, has_gym: false, has_park: false,
            has_reserved_parking: false, has_security: false, is_vastu_compliant: false, has_intercom: false, has_piped_gas: false, has_wifi: false,
            has_drainage_line: false, has_one_gate_entry: false, has_jogging_park: false, has_children_park: false, has_temple: false,
            has_water_line: false, has_street_light: false, has_internal_roads: false, submissionStatus: 'idle'
        };
        newUnit.description = generateUnitDescription(newUnit, projectDetails);
        setUnits(prev => [...prev, newUnit]);
        setActiveUnitId(newUnit.id);
        setAddDropdownOpen(false);
    };

    const handleUnitUpdate = (field: keyof BaseUnit, val: any) => {
        if (!activeUnitId) return;
        setUnits(prev => prev.map(u => u.id === activeUnitId ? { ...u, [field]: val } : u));
    };

    const generateUnitTitle = (unit: BaseUnit, pd: ProjectDetails): string => {
        let title = "";
        if (unit.bhk_config > 0 && ["FLAT", "VILLA_BUNGALOW"].includes(unit.type)) title += unit.bhk_config === 0.5 ? "1RK " : `${unit.bhk_config} BHK `;
        if (unit.subtype) {
            title += unit.subtype === "RES_PLOT_GUNTHEWARI" ? "Residential Plot (Gunthewari) " : `${SUBTYPE_OPTIONS[unit.type]?.find(s => s.value === unit.subtype)?.label || ""} `;
        } else {
            title += `${PROPERTY_TYPES.find(t => t.value === unit.type)?.label || ""} `;
        }
        title += `for ${unit.listingType === "SALE" ? "Sale" : "Rent"} `;
        if (pd.locality && pd.city) title += `in ${pd.locality}, ${pd.city}`; else if (pd.city) title += `in ${pd.city}`;
        return title.trim();
    };

    const generateUnitDescription = (unit: BaseUnit, pd: ProjectDetails): string => {
        let desc = "";
        if (["FLAT", "VILLA_BUNGALOW"].includes(unit.type)) {
            desc += `${unit.bhk_config > 0 ? unit.bhk_config + " BHK" : "Beautiful"} `;
            desc += unit.subtype ? SUBTYPE_OPTIONS[unit.type]?.find(s => s.value === unit.subtype)?.label?.toLowerCase() : unit.type.toLowerCase();
            desc += ` available for ${unit.listingType.toLowerCase()}`;
            if (pd.locality) desc += ` in ${pd.locality}`;
            desc += ". ";
            const details = [];
            if (unit.bathrooms > 0) details.push(`${unit.bathrooms} bathrooms`);
            if (unit.balconies > 0) details.push(`${unit.balconies} balconies`);
            if (unit.furnishing_status && unit.furnishing_status !== "UNFURNISHED") details.push(`${unit.furnishing_status.toLowerCase().replace('_', ' ')} furnished`);
            if (unit.facing) details.push(`${unit.facing} facing`);
            if (details.length > 0) desc += `This property features ${details.join(", ")}. `;
            if (unit.specific_floor && unit.total_floors) desc += `Located on ${unit.specific_floor} out of ${unit.total_floors} floors. `;
            if (unit.availability_status === "READY") desc += "Ready to move in. "; else if (unit.possession_date) desc += `Possession expected by ${unit.possession_date}. `;
            if (unit.super_builtup_area) desc += `Super built-up area: ${unit.super_builtup_area} sq.ft. `;
        } else {
            desc += `${PROPERTY_TYPES.find(t => t.value === unit.type)?.label || ""} available for ${unit.listingType.toLowerCase()}`;
            if (pd.locality) desc += ` in ${pd.locality}`;
            desc += ". ";
            if (unit.plot_area || unit.super_builtup_area) desc += `Area: ${unit.plot_area || unit.super_builtup_area} sq.ft. `;
        }
        if (pd.projectName) desc += `Part of ${pd.projectName} project. `;
        desc += "Contact us for more details and site visit.";
        return desc.trim();
    };

    const isUnitComplete = (u: BaseUnit): boolean => {
        const hasPrice = Boolean(u.total_price && !isNaN(parseFloat(u.total_price)) && parseFloat(u.total_price) > 0);
        const hasArea = Boolean((u.carpet_area && parseFloat(u.carpet_area) > 0) || (u.super_builtup_area && parseFloat(u.super_builtup_area) > 0) || (u.plot_area && parseFloat(u.plot_area) > 0));
        return hasPrice && hasArea;
    };

    const getSummaryLine = (u: BaseUnit): string => {
        const area = u.carpet_area || u.super_builtup_area || u.plot_area;
        const areaStr = area ? `${area} sq.ft` : 'Area unknown';
        switch (u.type) {
            case 'FLAT': case 'VILLA_BUNGALOW': return `${u.bhk_config > 0 ? (u.bhk_config === 0.5 ? '1RK' : u.bhk_config + ' BHK') + ' • ' : ''}${areaStr}`;
            case 'COMMERCIAL_UNIT': return `${u.subtype || 'Commercial'} • ${areaStr}`;
            case 'PLOT': case 'LAND': return `${u.subtype ? SUBTYPE_OPTIONS[u.type]?.find(s => s.value === u.subtype)?.label || u.subtype : u.type} • ${areaStr}`;
            default: return areaStr;
        }
    };

    const validateAll = () => {
        const errors: string[] = [];
        if (!projectDetails.projectName.trim()) errors.push("Project Name is required.");
        if (!projectDetails.locality.trim()) errors.push("Locality is required.");
        if (!projectDetails.city.trim()) errors.push("City is required.");
        if (!projectDetails.pincode.trim()) errors.push("Pincode is required.");
        if (!projectDetails.state.trim()) errors.push("State is required.");
        units.forEach(u => {
            if (!u.total_price || isNaN(parseFloat(u.total_price)) || parseFloat(u.total_price) <= 0) errors.push(`${u.name}: Valid price > 0 required.`);
            const hasAnyArea = Boolean((u.carpet_area && parseFloat(u.carpet_area) > 0) || (u.super_builtup_area && parseFloat(u.super_builtup_area) > 0) || (u.plot_area && parseFloat(u.plot_area) > 0));
            if (!hasAnyArea) errors.push(`${u.name}: At least one area field required.`);
            if (u.availability_status === 'UNDER_CONSTRUCTION' && !u.possession_date) errors.push(`${u.name}: Possession date required for under-construction.`);
            if (['FLAT', 'VILLA_BUNGALOW'].includes(u.type)) {
                if (!u.specific_floor) errors.push(`${u.name}: Floor number required.`);
                if (!u.total_floors) errors.push(`${u.name}: Total floors required.`);
            }
        });
        if (units.length === 0) errors.push("At least one unit must be added.");
        setValidationErrors(errors);
        if (errors.length > 0) window.scrollTo({ top: 0, behavior: 'smooth' });
        return errors.length === 0;
    };

    const buildPayload = (unit: BaseUnit, pd: ProjectDetails) => {
        const finalTitle = generateUnitTitle(unit, pd);
        const finalDesc = unit.description;
        const base = {
            title: finalTitle, description: finalDesc, listing_type: unit.listingType, property_type: unit.type, subtype: unit.subtype || undefined,
            total_price: parseFloat(unit.total_price), project_name: pd.projectName, locality: pd.locality, city: pd.city, pincode: pd.pincode, state: pd.state,
            rera_number: pd.reraNumber || undefined, landmarks: pd.landmarks || undefined, listed_by: unit.listed_by, latitude: pd.latitude, longitude: pd.longitude,
            whatsapp_number: unit.whatsapp_number || undefined, video_url: unit.video_url || undefined, availability_status: unit.availability_status,
            age_of_construction: unit.age_of_construction, maintenance_charges: unit.maintenance_charges || undefined,
            maintenance_interval: unit.maintenance_charges > 0 ? unit.maintenance_interval : undefined,
        };
        const typeFields: any = {};
        if (['FLAT', 'VILLA_BUNGALOW', 'COMMERCIAL_UNIT'].includes(unit.type)) {
            if (unit.bhk_config !== undefined) typeFields.bhk_config = unit.bhk_config;
            if (unit.bathrooms) typeFields.bathrooms = unit.bathrooms;
            if (unit.balconies) typeFields.balconies = unit.balconies;
            typeFields.furnishing_status = unit.furnishing_status; typeFields.specific_floor = unit.specific_floor || undefined; typeFields.total_floors = unit.total_floors || undefined;
            typeFields.facing = unit.facing || undefined; typeFields.super_builtup_area = unit.super_builtup_area || undefined; typeFields.carpet_area = unit.carpet_area || undefined;
            typeFields.price_per_sqft = unit.price_per_sqft || undefined;
            if (unit.possession_date && unit.availability_status === 'UNDER_CONSTRUCTION') typeFields.possession_date = unit.possession_date;
            Object.assign(typeFields, {
                has_power_backup: unit.has_power_backup, has_lift: unit.has_lift, has_swimming_pool: unit.has_swimming_pool, has_clubhouse: unit.has_clubhouse,
                has_gym: unit.has_gym, has_park: unit.has_park, has_reserved_parking: unit.has_reserved_parking, has_security: unit.has_security,
                is_vastu_compliant: unit.is_vastu_compliant, has_intercom: unit.has_intercom, has_piped_gas: unit.has_piped_gas, has_wifi: unit.has_wifi
            });
        }
        if (['PLOT', 'LAND'].includes(unit.type)) {
            typeFields.plot_area = unit.plot_area || undefined; typeFields.super_builtup_area = unit.super_builtup_area || undefined;
            typeFields.carpet_area = unit.carpet_area || undefined; typeFields.facing = unit.facing || undefined; typeFields.price_per_sqft = unit.price_per_sqft || undefined;
            Object.assign(typeFields, {
                has_drainage_line: unit.has_drainage_line, has_one_gate_entry: unit.has_one_gate_entry, has_jogging_park: unit.has_jogging_park, has_children_park: unit.has_children_park,
                has_temple: unit.has_temple, has_water_line: unit.has_water_line, has_street_light: unit.has_street_light, has_internal_roads: unit.has_internal_roads
            });
        }
        if (unit.type === 'VILLA_BUNGALOW') typeFields.plot_area = unit.plot_area || undefined;
        const merged = { ...base, ...typeFields };
        return Object.fromEntries(Object.entries(merged).filter(([_, v]) => v !== undefined && v !== ''));
    };

    const handleSubmit = async () => {
        if (!validateAll()) return;
        setIsSubmitting(true);
        setValidationErrors([]);
        let successCount = 0;
        for (const unit of units) {
            handleUnitUpdate('submissionStatus', 'submitting');
            try {
                const payloadObj = buildPayload(unit, projectDetails);
                const formData = new FormData();
                const numericFields = ["bhk_config", "bathrooms", "balconies", "age_of_construction"];
                const decimalFields = ["total_price", "super_builtup_area", "carpet_area", "plot_area", "maintenance_charges", "price_per_sqft"];
                const integerFields = ["specific_floor", "total_floors"];

                Object.entries(payloadObj).forEach(([key, val]) => {
                    if (val !== undefined && val !== null && val !== '') {
                        if (typeof val === 'boolean') {
                            formData.append(key, val ? 'true' : 'false');
                        } else {
                            formData.append(key, val.toString());
                        }
                    }
                });

                const fullAddress = [projectDetails.addressLine1, projectDetails.addressLine2, projectDetails.addressLine3].filter(l => l.trim() !== '').join(', ');
                formData.append('address_line', fullAddress || projectDetails.locality || 'Address not provided');
                formData.append('latitude', projectDetails.latitude.toString());
                formData.append('longitude', projectDetails.longitude.toString());

                const floorPlanFiles = unitFloorPlans[unit.id] || [];
                floorPlanFiles.forEach(file => formData.append('floor_plans', file));

                Object.entries(legalDocuments).forEach(([key, file]) => {
                    if (file) formData.append(key, file);
                });

                const response = await api.post('/api/properties/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                const createdId = response.data.id || response.data.uid;
                const matchingMedia = mediaItems.filter(m => m.taggedUnitIds.includes(unit.id) && m.file);
                for (const [index, m] of matchingMedia.entries()) {
                    const imgData = new FormData(); imgData.append('image', m.file as Blob);
                    if (index === 0) imgData.append('is_thumbnail', 'true');
                    await api.post(`/api/properties/${createdId}/upload_image/`, imgData, { headers: { 'Content-Type': 'multipart/form-data' } });
                }
                setUnits(prev => prev.map(u => u.id === unit.id ? { ...u, submissionStatus: 'success' } : u));
                successCount++;
            } catch (err: any) {
                setUnits(prev => prev.map(u => u.id === unit.id ? { ...u, submissionStatus: 'error', submissionError: err.response?.data?.detail || 'Failed' } : u));
                if (err.response?.status === 403) { toast("Your account lacks permission to create listings. Contact support to activate your builder account.", "error"); setIsSubmitting(false); return; }
            }
        }
        setIsSubmitting(false);
        if (successCount === units.length) { toast(`✅ ${successCount} listings submitted!`, "success"); setTimeout(() => router.push("/dashboard/my-listings"), 2000); }
    };

    // Setup Unit Configuration Form Rendering
    const renderAmenityToggle = (amenityList: { key: string, label: string }[]) => (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {amenityList.map((am) => (
                <button key={am.key} onClick={() => activeUnit && handleUnitUpdate(am.key as keyof BaseUnit, !(activeUnit as any)[am.key])}
                    className={`relative border-2 rounded-xl p-3 flex items-center justify-between text-left transition-all ${activeUnit && (activeUnit as any)[am.key] ? 'border-primary-green bg-green-50 text-green-800 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <span className="text-xs font-bold leading-tight">{am.label}</span>
                    {activeUnit && (activeUnit as any)[am.key] && <Check className="w-4 h-4 text-primary-green min-w-[16px]" />}
                </button>
            ))}
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 relative pb-24">
            {showToast && (<div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-lg font-medium text-white transition-all ${showToast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>{showToast.message}</div>)}

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Layers className="w-8 h-8 text-primary-green" />Project <span className="text-primary-green">Multi List</span></h1>
                    <p className="text-gray-500 mt-2">Bulk-upload distinct units configuring a central shared property layout.</p>
                </div>
            </div>

            {units.length > 0 && (
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-primary-green animate-pulse" />
                        <span className="text-xs font-bold text-gray-700">
                            {units.length} unit{units.length > 1 ? 's' : ''} in session
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                        <Check className="w-3 h-3 text-green-500" />
                        <span className="text-xs font-bold text-gray-700">
                            {units.filter(isUnitComplete).length} complete
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                        <span className="text-xs font-bold text-gray-700">
                            📷 {mediaItems.length} photo{mediaItems.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    {Object.values(legalDocuments).filter(Boolean).length > 0 && (
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                            <FileText className="w-3 h-3 text-blue-500" />
                            <span className="text-xs font-bold text-gray-700">
                                {Object.values(legalDocuments).filter(Boolean).length} docs
                            </span>
                        </div>
                    )}
                </div>
            )}

            {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3 bg-red-100/60 border-b border-red-200">
                        <Info className="w-4 h-4 text-red-600 shrink-0" />
                        <h4 className="font-bold text-red-700 text-sm">
                            {validationErrors.length} issue{validationErrors.length > 1 ? 's' : ''} to fix before publishing
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

            {/* Shared Project Settings */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setProjectDetailsCollapsed(!projectDetailsCollapsed)}>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Shared Project Data</h3>
                        <p className="text-gray-500 text-sm flex items-center gap-2">
                            {projectDetails.projectName || "Click to configure shared project info"}
                            {projectDetails.latitude !== 19.8762 && (
                                <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5" /> Location Set
                                </span>
                            )}
                        </p>
                    </div>
                    {projectDetailsCollapsed ? <ChevronDown className="text-gray-400" /> : <ChevronUp className="text-gray-400" />}
                </div>
                {!projectDetailsCollapsed && (
                    <div className="p-6 border-t border-gray-100 flex flex-col gap-6 bg-gray-50/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><label className="text-xs font-bold uppercase text-gray-600">Project Name *</label><input type="text" value={projectDetails.projectName} onChange={e => handleProjectDetailChange('projectName', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" /></div>
                            <div className="space-y-2"><label className="text-xs font-bold uppercase text-gray-600">RERA Number</label><input type="text" value={projectDetails.reraNumber} onChange={e => handleProjectDetailChange('reraNumber', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" /></div>
                            <div className="space-y-2"><label className="text-xs font-bold uppercase text-gray-600">Builder / Promoter Name</label><input type="text" value={projectDetails.builderName} onChange={e => handleProjectDetailChange('builderName', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" /></div>
                            <div className="space-y-2"><label className="text-xs font-bold uppercase text-gray-600">Google Maps URL</label><input type="url" value={projectDetails.googleMapsUrl} onChange={e => handleProjectDetailChange('googleMapsUrl', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" /></div>
                        </div>
                        <div className="mt-4"><h4 className="text-sm font-bold uppercase text-gray-500 mb-4 border-b pb-2">Property Address</h4></div>
                        <div className="space-y-4">
                            <input type="text" placeholder="Address Line 1 * (Building name, Society, Flat/Plot No.)" value={projectDetails.addressLine1} onChange={e => handleProjectDetailChange('addressLine1', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                            <input type="text" placeholder="Address Line 2 (Street, Road)" value={projectDetails.addressLine2} onChange={e => handleProjectDetailChange('addressLine2', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                            <input type="text" placeholder="Address Line 3 (Near landmark)" value={projectDetails.addressLine3} onChange={e => handleProjectDetailChange('addressLine3', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                            <div className="space-y-2"><label className="text-xs font-bold uppercase text-gray-600">Locality *</label><input type="text" value={projectDetails.locality} onChange={e => handleProjectDetailChange('locality', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" /></div>
                            <div className="space-y-2"><label className="text-xs font-bold uppercase text-gray-600">City *</label><input type="text" value={projectDetails.city} onChange={e => handleProjectDetailChange('city', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" /></div>
                            <div className="space-y-2"><label className="text-xs font-bold uppercase text-gray-600">State *</label><input type="text" value={projectDetails.state} onChange={e => handleProjectDetailChange('state', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" /></div>
                            <div className="space-y-2"><label className="text-xs font-bold uppercase text-gray-600">Pincode *</label><input type="text" pattern="[0-9]{6}" value={projectDetails.pincode} onChange={e => handleProjectDetailChange('pincode', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" /></div>
                            <div className="space-y-2 md:col-span-2"><label className="text-xs font-bold uppercase text-gray-600">Landmarks</label><input type="text" value={projectDetails.landmarks} onChange={e => handleProjectDetailChange('landmarks', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" /></div>
                        </div>
                        <div className="col-span-2 space-y-2 mt-4">
                            <label className="text-xs font-bold uppercase text-gray-600 tracking-wider">Pin Location on Map</label>
                            <SmartLocationPicker initialLat={projectDetails.latitude} initialLng={projectDetails.longitude} onLocationSelect={(lat: number, lng: number) => { handleProjectDetailChange('latitude', lat); handleProjectDetailChange('longitude', lng); }} />
                            <p className="text-xs text-gray-400">Lat: {projectDetails.latitude.toFixed(5)}, Lng: {projectDetails.longitude.toFixed(5)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Project Legal Documents */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setDocsCollapsed(!docsCollapsed)}>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">Project Documents</h3>
                        <p className="text-gray-500 text-sm">{Object.values(legalDocuments).filter(Boolean).length} of {DOCUMENTS_CONFIG.length} uploaded</p>
                    </div>
                    {docsCollapsed ? <ChevronDown className="text-gray-400" /> : <ChevronUp className="text-gray-400" />}
                </div>
                {!docsCollapsed && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50/30">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {DOCUMENTS_CONFIG.map((doc) => {
                                const uploaded = legalDocuments[doc.key];
                                return (
                                    <div key={doc.key} className={`relative border-2 rounded-xl p-4 transition-all ${uploaded ? 'border-primary-green bg-green-50' : 'border-dashed border-gray-300 hover:border-gray-400'}`}>
                                        <p className="text-xs font-bold text-gray-700 mb-2">{doc.label}</p>
                                        {uploaded ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-green-700 font-medium truncate max-w-[80%]"><Check className="w-3 h-3 inline mr-1" />{uploaded.name}</span>
                                                <button onClick={() => setLegalDocuments(p => ({ ...p, [doc.key]: null }))} className="text-red-400 hover:text-red-600 ml-2"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                <Upload className="w-4 h-4" />Upload PDF / Image
                                                <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => {
                                                    if (e.target.files && e.target.files.length > 0) {
                                                        const file = e.target.files[0];
                                                        setLegalDocuments(p => ({ ...p, [doc.key]: file }));
                                                    }
                                                }} />
                                            </label>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Workspace Panel */}
            {units.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT PANEL */}
                    <div className="col-span-1 lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">Select Unit</h3>
                            <div className="relative" ref={dropdownRef}>
                                <button onClick={() => setAddDropdownOpen(!addDropdownOpen)} className="flex items-center justify-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 text-sm font-bold px-3 py-2 rounded-lg shadow-sm"><Plus className="w-4 h-4" /> Add Unit</button>
                                {addDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 shadow-xl rounded-xl z-20 w-48 overflow-hidden">
                                        {PROPERTY_TYPES.map(type => (
                                            <button key={type.value} onClick={() => handleAddUnit(type.value as UnitType)} className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-center gap-3 text-sm text-gray-700 font-bold border-b border-gray-100 last:border-0">{type.icon} {type.label}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                            {units.map(u => {
                                const isActive = u.id === activeUnitId;
                                const isComp = isUnitComplete(u);
                                return (
                                    <div key={u.id} onClick={() => setActiveUnitId(u.id)} className={`relative bg-white rounded-xl shadow-sm cursor-pointer border-2 transition-all ${isActive ? 'border-primary-green bg-green-50/10' : 'border-gray-200 hover:border-gray-300'}`}>
                                        {(u.title || u.description) ?
                                            <span className="absolute top-3 right-3 text-[10px] text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded flex items-center gap-1 z-10"><Check className="w-3 h-3" /> Info Set</span> :
                                            <div className={`absolute top-4 right-4 w-3 h-3 rounded-full border-2 border-white z-10 shadow-sm ${isComp ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        }
                                        {/* Type color bar — make it taller with gradient */}
                                        <div className={`h-14 relative rounded-t-[10px] flex items-end pb-2 px-3
                                             ${u.type === 'FLAT' ? 'bg-gradient-to-r from-blue-600 to-blue-500' : u.type === 'VILLA_BUNGALOW' ? 'bg-gradient-to-r from-purple-600 to-purple-500' : u.type === 'PLOT' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : u.type === 'LAND' ? 'bg-gradient-to-r from-teal-700 to-teal-600' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`}>
                                            {/* Type icon + label */}
                                            <div className="flex items-center gap-1.5 text-white">
                                                <span className="opacity-80 text-white [&>svg]:w-3.5 [&>svg]:h-3.5">
                                                    {PROPERTY_TYPES.find(t => t.value === u.type)?.icon}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                                                    {u.type.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            {/* Floor plan count badge */}
                                            {(unitFloorPlans[u.id] || []).length > 0 && (
                                                <span className="absolute top-2 right-2 text-[8px] text-white font-bold bg-white/20 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                    <FileText className="w-2 h-2" />
                                                    {(unitFloorPlans[u.id] || []).length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-bold text-gray-800 text-base">{u.name}</h4>
                                            <p className="text-xs text-gray-500 font-medium mb-1 mt-1">{getSummaryLine(u)}</p>
                                            {(() => {
                                                const unitPhotos = mediaItems.filter(m => m.taggedUnitIds.includes(u.id));
                                                return unitPhotos.length > 0 ? (
                                                    <span className="text-[9px] text-violet-600 font-bold bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 mt-1">
                                                        <span>📷</span> {unitPhotos.length} photo{unitPhotos.length > 1 ? 's' : ''}
                                                    </span>
                                                ) : null;
                                            })()}
                                            {isActive && <div className="text-primary-green text-xs font-bold mt-2 bg-green-50 p-1.5 rounded inline-flex items-center"><Edit2 className="w-3 h-3 mr-1" /> Editing Data</div>}
                                            {u.submissionStatus === 'submitting' && <p className="text-xs text-blue-500 font-bold mt-2 animate-pulse">Submitting...</p>}
                                            {u.submissionStatus === 'success' && <p className="text-xs text-green-600 font-bold mt-2">Submitted ✓</p>}
                                            {u.submissionStatus === 'error' && <p className="text-xs text-red-600 font-bold mt-2">Error: {u.submissionError}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="col-span-1 lg:col-span-8 xl:col-span-9 flex flex-col h-full gap-6">
                        {activeUnit ? (
                            <>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="flex flex-row items-center gap-4 px-6 py-4 border-b border-gray-100">
                                        <span className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-primary-green shrink-0">
                                            {PROPERTY_TYPES.find(t => t.value === activeUnit.type)?.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <input type="text" value={activeUnit.name} onChange={e => handleUnitUpdate('name', e.target.value)} className="bg-transparent border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-primary-green focus:ring-0 p-1 text-xl font-bold w-full" placeholder="Internal Unit Name" />
                                            <p className="text-xs text-gray-400 mt-1 truncate px-1 flex items-center gap-1">
                                                <Lock className="w-2.5 h-2.5 shrink-0" />
                                                <span className="truncate">{generateUnitTitle(activeUnit, projectDetails) || 'Fill in property type and city to preview title'}</span>
                                            </p>
                                        </div>
                                        <div className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${isUnitComplete(activeUnit) ? 'text-green-700 bg-green-50 border-green-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                                            {isUnitComplete(activeUnit) ? '✓ Complete' : '⚠ Incomplete'}
                                        </div>
                                    </div>
                                </div>

                                {/* Generated AI Widget */}
                                {/* Auto-Generated Listing Info */}
                                <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-5 py-3 bg-slate-100/60 border-b border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-violet-500" />
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Auto Listing Info</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium">Updates live as you fill the form</span>
                                    </div>

                                    <div className="p-5 space-y-4">
                                        {/* TITLE — READ ONLY */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <Lock className="w-3 h-3 text-slate-400" />
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Listing Title (Auto)</label>
                                            </div>
                                            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2.5">
                                                <span className="text-sm font-semibold text-slate-700 flex-1 leading-snug">
                                                    {generateUnitTitle(activeUnit, projectDetails)}
                                                </span>
                                                <span className="shrink-0 text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider">Auto</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Info className="w-2.5 h-2.5" />
                                                Title is always auto-generated. Fill in city & property type for best results.
                                            </p>
                                        </div>

                                        {/* DESCRIPTION — EDITABLE TEXTAREA */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <Edit2 className="w-3 h-3 text-slate-400" />
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Listing Description</label>
                                                    {activeUnit.descriptionManuallyEdited && (
                                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wider">Edited</span>
                                                    )}
                                                </div>
                                                {activeUnit.descriptionManuallyEdited && (
                                                    <button
                                                        onClick={() => {
                                                            const regen = generateUnitDescription(activeUnit, projectDetails);
                                                            setUnits(prev => prev.map(u => u.id === activeUnit.id ? { ...u, description: regen, descriptionManuallyEdited: false } : u));
                                                        }}
                                                        className="text-[10px] text-blue-500 hover:text-blue-700 font-bold flex items-center gap-1 hover:underline"
                                                    >
                                                        <Sparkles className="w-2.5 h-2.5" /> Reset to Auto
                                                    </button>
                                                )}
                                            </div>
                                            <textarea
                                                rows={4}
                                                value={activeUnit.description}
                                                onChange={e => {
                                                    handleUnitUpdate('description', e.target.value);
                                                    handleUnitUpdate('descriptionManuallyEdited', true);
                                                }}
                                                className={`w-full rounded-lg text-sm p-3 resize-none focus:ring-1 transition-colors leading-relaxed text-slate-700 ${activeUnit.descriptionManuallyEdited ? 'border-amber-300 focus:border-amber-400 focus:ring-amber-200 bg-amber-50/20' : 'border-blue-200 focus:border-blue-300 focus:ring-blue-100 bg-blue-50/10'}`}
                                                placeholder="Description will auto-generate as you fill in property details..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                                    {/* A. CLASSIFICATION */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                                            <span className="w-0.5 h-4 bg-primary-green rounded-full inline-block" /> Classification
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 mb-5">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-700">Listing Type</label>
                                                <select value={activeUnit.listingType} onChange={e => handleUnitUpdate('listingType', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm font-medium">
                                                    <option value="SALE">SALE</option><option value="RENT">RENT</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-700">Property Type</label>
                                                <select value={activeUnit.type} onChange={e => handleUnitUpdate('type', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm font-medium">
                                                    {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        {SUBTYPE_OPTIONS[activeUnit.type] && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-700">Specific Category</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {SUBTYPE_OPTIONS[activeUnit.type].map(opt => (
                                                        <button key={opt.value} onClick={() => handleUnitUpdate('subtype', opt.value)} className={`py-1.5 px-3 rounded-full border text-xs font-bold transition-all ${activeUnit.subtype === opt.value ? 'bg-primary-green text-white border-primary-green' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-300'}`}>
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>


                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-primary-green space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-800">Total Price <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                                                <input type="number" value={activeUnit.total_price} onChange={e => handleUnitUpdate('total_price', e.target.value)} className={`w-full text-lg rounded-lg shadow-sm py-2.5 pl-8 font-bold ${!activeUnit.total_price ? 'border-red-300 focus:border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-primary-green'}`} placeholder="0.00" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700">Price / sq.ft (Opt)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₹</span>
                                                <input type="number" value={activeUnit.price_per_sqft} onChange={e => handleUnitUpdate('price_per_sqft', e.target.value)} className="w-full rounded-lg py-2 pl-8 text-sm border-gray-300 focus:border-primary-green" placeholder="0" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-700 flex flex-col">Maint. Charge <span className="text-gray-400 font-normal">Amount</span></label>
                                                <div className="relative"><span className="absolute left-3 top-2.5 text-gray-400 font-bold">₹</span><input type="number" value={activeUnit.maintenance_charges || ''} onChange={e => handleUnitUpdate('maintenance_charges', parseInt(e.target.value) || 0)} className="w-full rounded-lg py-2 pl-8 text-sm border-gray-300" /></div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-700 flex flex-col">Maint. Interval <span className="text-gray-400 font-normal">Freq.</span></label>
                                                <select value={activeUnit.maintenance_interval} onChange={e => handleUnitUpdate('maintenance_interval', e.target.value)} className="w-full rounded-lg py-2 px-2 text-sm border-gray-300">
                                                    <option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option>
                                                    <option value="YEARLY">Yearly</option><option value="ONE_TIME">One-Time</option>
                                                </select>
                                            </div>
                                        </div>

                                    </div>


                                    {/* C. CONFIGURATION */}
                                    {['FLAT', 'VILLA_BUNGALOW', 'COMMERCIAL_UNIT'].includes(activeUnit.type) && (
                                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                                                <span className="w-0.5 h-4 bg-primary-green rounded-full inline-block" /> Configuration
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                                    <label className="text-xs font-bold text-gray-700">BHK / Room</label>
                                                    <div className="flex bg-gray-50 rounded-lg border border-gray-300 overflow-hidden items-center justify-between p-1">
                                                        {activeUnit.bhk_config === 0.5 ? (
                                                            <span className="text-sm font-bold w-full text-center py-1">1RK</span>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => activeUnit.bhk_config > 1 && handleUnitUpdate('bhk_config', activeUnit.bhk_config - 1)} className="p-1 hover:bg-white rounded border"><ChevronLeft className="w-4 h-4" /></button>
                                                                <span className="text-sm font-bold">{activeUnit.bhk_config || 0}</span>
                                                                <button onClick={() => handleUnitUpdate('bhk_config', (activeUnit.bhk_config || 0) + 1)} className="p-1 hover:bg-white rounded border"><Plus className="w-4 h-4" /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                    <button onClick={() => handleUnitUpdate('bhk_config', activeUnit.bhk_config === 0.5 ? 1 : 0.5)} className="text-[10px] text-blue-600 font-bold hover:underline">Toggle 1RK Format</button>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700">Bathrooms</label>
                                                    <input type="number" min="0" max="10" value={activeUnit.bathrooms} onChange={e => handleUnitUpdate('bathrooms', parseInt(e.target.value) || 0)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700">Balconies</label>
                                                    <input type="number" min="0" max="10" value={activeUnit.balconies} onChange={e => handleUnitUpdate('balconies', parseInt(e.target.value) || 0)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                                                </div>
                                                <div className="space-y-2 col-span-2 md:col-span-3">
                                                    <label className="text-xs font-bold text-gray-700">Furnishing</label>
                                                    <div className="flex bg-gray-100 rounded-lg p-1 overflow-hidden">
                                                        {['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'].map(f => (
                                                            <button key={f} onClick={() => handleUnitUpdate('furnishing_status', f)} className={`flex-1 text-xs font-bold py-2 rounded-md ${activeUnit.furnishing_status === f ? 'bg-white shadow text-primary-green' : 'text-gray-500'}`}>{f.replace('_', ' ')}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700">Unit Floor</label>
                                                    <input type="number" value={activeUnit.specific_floor} onChange={e => handleUnitUpdate('specific_floor', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700">Total Floors</label>
                                                    <input type="number" value={activeUnit.total_floors} onChange={e => handleUnitUpdate('total_floors', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700">Construction Age</label>
                                                    <input type="number" placeholder="Years" value={activeUnit.age_of_construction || ''} onChange={e => handleUnitUpdate('age_of_construction', parseInt(e.target.value) || 0)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    )}


                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b pb-2">Space / Orientation</h4>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700">Carpet Area</label>
                                            <div className="relative">
                                                <input type="number" value={activeUnit.carpet_area} onChange={e => handleUnitUpdate('carpet_area', e.target.value)} className="w-full rounded-lg py-2.5 pr-10 pl-3 text-sm font-bold border-gray-300" placeholder="0" />
                                                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">ft²</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700">Super Builtup Area</label>
                                            <div className="relative">
                                                <input type="number" value={activeUnit.super_builtup_area} onChange={e => handleUnitUpdate('super_builtup_area', e.target.value)} className="w-full rounded-lg py-2.5 pr-10 pl-3 text-sm font-bold border-gray-300" placeholder="0" />
                                                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">ft²</span>
                                            </div>
                                        </div>

                                        {['PLOT', 'LAND', 'VILLA_BUNGALOW'].includes(activeUnit.type) && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-700">Total Plot Area</label>
                                                <div className="relative">
                                                    <input type="number" value={activeUnit.plot_area} onChange={e => handleUnitUpdate('plot_area', e.target.value)} className="w-full rounded-lg py-2.5 pr-10 pl-3 text-sm font-bold border-gray-300" placeholder="0" />
                                                    <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">ft²</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2 pt-2 border-t mt-4">
                                            <label className="text-xs font-bold text-gray-700">Facing Direction</label>
                                            <select value={activeUnit.facing} onChange={e => handleUnitUpdate('facing', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm font-medium">
                                                <option value="">Select Direction...</option>
                                                <option value="North">North</option><option value="South">South</option><option value="East">East</option><option value="West">West</option>
                                                <option value="North-East">North-East</option><option value="North-West">North-West</option><option value="South-East">South-East</option><option value="South-West">South-West</option>
                                            </select>
                                        </div>

                                        <div className="space-y-3 pt-3">
                                            <label className="text-xs font-bold text-gray-700">Availability</label>
                                            <div className="flex bg-gray-100 rounded-lg p-1">
                                                <button onClick={() => handleUnitUpdate('availability_status', 'READY')} className={`flex-1 text-[10px] font-bold py-2 rounded-md transition ${activeUnit.availability_status === 'READY' ? 'bg-white shadow text-primary-green' : 'text-gray-500'}`}>Ready to Move</button>
                                                <button onClick={() => handleUnitUpdate('availability_status', 'UNDER_CONSTRUCTION')} className={`flex-1 text-[10px] uppercase font-bold py-2 rounded-md transition ${activeUnit.availability_status === 'UNDER_CONSTRUCTION' ? 'bg-white shadow text-primary-green' : 'text-gray-500'}`}>Under Const.</button>
                                            </div>
                                            {activeUnit.availability_status === 'UNDER_CONSTRUCTION' && (
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-gray-600 block mt-2 mb-1">POSSESSION DATE</p>
                                                    <input type="date" value={activeUnit.possession_date} onChange={e => handleUnitUpdate('possession_date', e.target.value)} className="w-full border-gray-300 rounded-lg text-sm p-2" />
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    {/* E. CONTACT */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                                            <span className="w-0.5 h-4 bg-primary-green rounded-full inline-block" /> Visibility & Contact
                                        </h4>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-700">Listed By</label>
                                                <select value={activeUnit.listed_by} onChange={e => handleUnitUpdate('listed_by', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm">
                                                    <option value="BUILDER">Builder (Me)</option><option value="OWNER">Owner</option><option value="BROKER">Broker</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-700">WhatsApp Spec (Opt)</label>
                                                <input type="text" value={activeUnit.whatsapp_number} onChange={e => handleUnitUpdate('whatsapp_number', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" placeholder="+91" />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <label className="text-xs font-bold text-gray-700">Promo Video URL</label>
                                                <input type="text" value={activeUnit.video_url} onChange={e => handleUnitUpdate('video_url', e.target.value)} className="w-full rounded-lg border-gray-300 py-2.5 text-sm" placeholder="https://youtube.com/.." />
                                            </div>
                                        </div>
                                    </div>


                                </div>

                                <div className="flex flex-col gap-6 w-full">
                                    {/* D. AMENITIES */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                                            <span className="w-0.5 h-4 bg-primary-green rounded-full inline-block" /> Provided Amenities
                                        </h4>
                                        {['FLAT', 'VILLA_BUNGALOW', 'COMMERCIAL_UNIT'].includes(activeUnit.type) ? renderAmenityToggle(RESIDENTIAL_AMENITIES) : renderAmenityToggle(PLOT_AMENITIES)}
                                    </div>


                                    {/* F. FLOOR PLANS */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-0.5 h-4 bg-primary-green rounded-full inline-block" /> Floor Plans
                                            </div>
                                            <span className="text-xs font-normal text-gray-400 normal-case">{(unitFloorPlans[activeUnit.id] || []).length} uploaded</span>
                                        </h4>

                                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <div className="flex flex-col items-center">
                                                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                                                <p className="text-xs font-semibold text-gray-500">Upload Floor Plan Images</p>
                                                <p className="text-[10px] text-gray-400">PNG, JPG, PDF accepted</p>
                                            </div>
                                            <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={(e) => {
                                                if (e.target.files) {
                                                    const files = Array.from(e.target.files);
                                                    setUnitFloorPlans(prev => ({ ...prev, [activeUnit.id]: [...(prev[activeUnit.id] || []), ...files] }));
                                                }
                                            }} />
                                        </label>

                                        {(unitFloorPlans[activeUnit.id] || []).length > 0 && (
                                            <div className="grid grid-cols-3 gap-3">
                                                {(unitFloorPlans[activeUnit.id] || []).map((file, idx) => (
                                                    <div key={idx} className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                                                        <div className="h-20 flex items-center justify-center bg-gray-100">
                                                            {file.type.startsWith('image/') ? (
                                                                <img src={URL.createObjectURL(file)} alt="floor plan" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="flex flex-col items-center text-gray-400">
                                                                    <FileText className="w-6 h-6" />
                                                                    <span className="text-[9px] mt-1 font-bold">PDF</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button onClick={() => setUnitFloorPlans(prev => ({ ...prev, [activeUnit.id]: prev[activeUnit.id].filter((_, i) => i !== idx) }))}
                                                            className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                        <p className="text-[9px] font-medium text-gray-500 p-1.5 truncate">{file.name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                </div>

                            </>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-16 h-full min-h-[500px] text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Layers className="w-8 h-8 text-gray-400" /></div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Build Configuration Setup</h3>
                                <p className="text-gray-500 max-w-sm">Use the left menu to add a specific unit to formulate specific price, area, and configuration details.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                        <Layers className="w-8 h-8 text-primary-green" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Start Adding Units</h3>
                    <p className="text-gray-500 max-w-sm text-sm leading-relaxed mb-8">
                        Add different property units to this project — each gets its own price, configuration, and photos. All share the same project location.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
                        {PROPERTY_TYPES.map(type => (
                            <button
                                key={type.value}
                                onClick={() => handleAddUnit(type.value as UnitType)}
                                className="flex flex-col items-center gap-2 bg-white border border-gray-200 hover:border-primary-green hover:bg-green-50 px-4 py-3 rounded-xl font-bold text-gray-600 hover:text-primary-green transition-all shadow-sm hover:shadow-md text-xs"
                            >
                                <span className="text-primary-green [&>svg]:w-5 [&>svg]:h-5">{type.icon}</span>
                                Add {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {units.length > 0 && ( /* Base Media Img Array Upload (Unchanged visually per instructions) */
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Property Gallery</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Upload photos and tag them to individual units. The first tagged image per unit becomes its thumbnail.</p>
                        </div>
                        <span className="text-xs text-gray-400 font-medium bg-gray-100 px-3 py-1.5 rounded-full">{mediaItems.length} photo{mediaItems.length !== 1 ? 's' : ''} uploaded</span>
                    </div>
                    <div className="flex items-center justify-center w-full mb-8">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Plus className="w-6 h-6 mb-2 text-gray-400" />
                                <p className="text-sm font-semibold text-gray-500">Upload property photos</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {activeUnitId ? `Photos will be tagged to ${units.find(u => u.id === activeUnitId)?.name || 'active unit'} automatically` : 'Select a unit first to auto-tag photos'}
                                </p>
                            </div>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={e => {
                                if (!activeUnitId && units.length > 0) {
                                    toast('⚠️ No unit selected. Images uploaded but not tagged. Click a unit card first, then upload.', 'error');
                                }
                                if (e.target.files) setMediaItems(p => [...p, ...Array.from(e.target.files || []).map(f => ({ id: crypto.randomUUID(), url: URL.createObjectURL(f), file: f, taggedUnitIds: activeUnitId ? [activeUnitId] : [] }))]);
                            }} />
                        </label>
                    </div>
                    {mediaItems.length > 0 && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {mediaItems.map(item => (
                                <div key={item.id} className="relative rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-white group">
                                    {item.taggedUnitIds.length === 0 && (
                                        <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-[9px] font-bold text-center py-1 z-10">
                                            ⚠️ Not tagged to any unit
                                        </div>
                                    )}
                                    <button onClick={() => { URL.revokeObjectURL(item.url); setMediaItems(p => p.filter(m => m.id !== item.id)); }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"><X className="w-3 h-3" /></button>
                                    <img src={item.url} alt="view" className="w-full h-36 object-cover bg-gray-100" />
                                    <div className="p-3 border-t bg-gray-50">
                                        <p className="text-[10px] font-bold text-gray-500 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                                            <Building2 className="w-2.5 h-2.5" /> Tag to Units
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {units.map(u => {
                                                const tagged = item.taggedUnitIds.includes(u.id);
                                                return (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => setMediaItems(prev => prev.map(m => m.id === item.id ? { ...m, taggedUnitIds: tagged ? m.taggedUnitIds.filter(id => id !== u.id) : [...m.taggedUnitIds, u.id] } : m))}
                                                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold border transition-all flex items-center gap-0.5 ${tagged ? 'bg-primary-green text-white border-primary-green shadow-sm' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'}`}
                                                    >
                                                        {tagged && <Check className="w-2 h-2" />}
                                                        {u.name}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        {item.taggedUnitIds.length > 0 && (
                                            <p className="text-[9px] text-green-600 font-medium mt-1.5">
                                                ✓ Tagged to {item.taggedUnitIds.length} unit{item.taggedUnitIds.length > 1 ? 's' : ''}
                                                {item.taggedUnitIds.some(uid => { const unitMedia = mediaItems.filter(m => m.taggedUnitIds.includes(uid)); return unitMedia[0]?.id === item.id; }) && (
                                                    <span className="ml-1 text-amber-600 font-bold">· Thumbnail</span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {units.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-2xl p-4 z-40">
                    <div className="max-w-6xl mx-auto flex items-center justify-between sm:pl-32 lg:pl-64">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center border border-green-200">
                                <Layers className="w-5 h-5 text-primary-green" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">
                                    <span className="text-xl text-primary-green mr-1.5">{units.length}</span>
                                    unit{units.length > 1 ? 's' : ''} ready to publish
                                </p>
                                <p className="text-xs text-gray-500">
                                    {units.filter(isUnitComplete).length}/{units.length} complete
                                    {mediaItems.length > 0 && ` · ${mediaItems.length} photos`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-primary-green hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm"
                        >
                            {isSubmitting ? (
                                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Batch Submitting...</>
                            ) : (
                                <>Publish Catalog <Check className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
