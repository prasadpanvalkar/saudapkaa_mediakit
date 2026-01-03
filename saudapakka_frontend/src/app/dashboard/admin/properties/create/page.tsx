"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function AdminPropertyCreatePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // --- STATE ALL-IN-ONE ---
    const [formData, setFormData] = useState({
        // 1. Core
        title: "",
        listing_type: "SALE",
        description: "",
        property_type: "FLAT",
        bhk_config: 1,
        specific_floor: 0,
        total_floors: 0,
        facing: "NORTH",

        // 2. Area
        super_builtup_area: "",
        carpet_area: "",
        bathrooms: 1,
        balconies: 0,

        // 3. Pricing & Financials
        total_price: "",
        maintenance_charges: "",
        maintenance_interval: "MONTHLY",

        // 4. Status
        availability_status: "READY",
        furnishing_status: "UNFURNISHED",
        possession_date: "",
        age_of_construction: 0,

        // 5. Location
        address_line: "",
        locality: "",
        city: "Mumbai",
        pincode: "",
        landmarks: "",

        // 6. Amenities (Booleans)
        has_power_backup: false,
        has_lift: false,
        has_swimming_pool: false,
        has_club_house: false,
        has_gym: false,
        has_park: false,
        has_reserved_parking: false,
        has_security: false,
        is_vastu_compliant: false,
        has_intercom: false,
        has_piped_gas: false,
        has_wifi: false,

        // 7. Media Links
        video_url: ""
    });

    // --- FILE STATES ---
    const [floorPlan, setFloorPlan] = useState<File | null>(null);
    const [doc712, setDoc712] = useState<File | null>(null);
    const [docMojani, setDocMojani] = useState<File | null>(null);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);

    // --- HANDLERS ---

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        // Checkbox handling
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (f: File | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            setter(e.target.files[0]);
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setGalleryImages(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const payload = new FormData();

            // Cleanup and Append
            Object.entries(formData).forEach(([key, value]) => {
                // 1. Skip empty strings for optional fields to avoid 400 errors
                if (value === "" || value === null || value === undefined) {
                    return;
                }

                // 2. Convert Booleans to strings explicitly
                if (typeof value === 'boolean') {
                    payload.append(key, value ? 'true' : 'false');
                }
                // 3. Handle specific numeric fields that might be 0 but valid
                else {
                    payload.append(key, value.toString());
                }
            });

            // Validating Mandatory Fields locally provided they aren't controlled by HTML 'required'
            if (!formData.carpet_area) {
                // Fallback: If user didn't fill it, send 0 or fail. Model says required.
                // Let's prompt user or default it if logic allows. 
                // For now, we rely on the HTML required attribute I will add.
            }

            // Append Files
            if (floorPlan) payload.append('floor_plan', floorPlan);
            if (doc712) payload.append('doc_7_12', doc712);
            if (docMojani) payload.append('doc_mojani', docMojani);

            // STEP 1: CREATE PROPERTY
            const response = await api.post("/api/properties/", payload, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            console.log("Creation Success:", response.data);
            const propertyId = response.data.id;

            // STEP 2: UPLOAD GALLERY IMAGES
            if (galleryImages.length > 0) {
                for (const img of galleryImages) {
                    const galleryData = new FormData();
                    galleryData.append('image', img);
                    await api.post(`/api/properties/${propertyId}/upload_image/`, galleryData, {
                        headers: { "Content-Type": "multipart/form-data" }
                    });
                }
            }

            router.push("/dashboard/admin/users");
            // Use efficient alert or toast
            alert("Property Created Successfully!");

        } catch (err: any) {
            console.error("Submission Error:", err);
            // Better Error Display
            const msg = err.response?.data
                ? typeof err.response.data === 'object'
                    ? JSON.stringify(err.response.data, null, 2)
                    : err.response.data
                : err.message || "Failed to create property";

            setError(msg);
            window.scrollTo(0, 0);
        } finally {
            setLoading(false);
        }
    };

    if (!user?.is_staff) {
        return <div className="p-8 text-center text-red-600">Access Denied.</div>;
    }

    // Helper for Section Headers
    const SectionHeader = ({ title }: { title: string }) => (
        <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4 border-b pb-2">{title}</h3>
    );

    return (
        <div className="max-w-5xl mx-auto p-6 pb-20">
            <h1 className="text-3xl font-bold mb-2">Add New Property</h1>
            <p className="text-gray-500 mb-8">Fill in all details to list a property on the platform.</p>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200 overflow-auto max-h-40 text-sm font-mono">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-lg border border-gray-100">

                {/* --- 1. BASIC DETAILS --- */}
                <SectionHeader title="1. Basic Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="label">Listing Title *</label>
                        <input name="title" value={formData.title} onChange={handleChange} className="input-field" placeholder="e.g. Spacious 3BHK in Bandra West" required />
                    </div>

                    <div className="col-span-2">
                         <label className="label">Description</label>
                         <textarea name="description" value={formData.description} onChange={handleChange} className="input-field h-24" placeholder="Detailed property description..." />
                    </div>

                    <div>
                        <label className="label">Listing Type</label>
                        <select name="listing_type" value={formData.listing_type} onChange={handleChange} className="input-field">
                            <option value="SALE">For Sale</option>
                            <option value="RENT">For Rent</option>
                        </select>
                    </div>

                    <div>
                        <label className="label">Property Type</label>
                        <select name="property_type" value={formData.property_type} onChange={handleChange} className="input-field">
                            <option value="FLAT">Flat/Apartment</option>
                            <option value="VILLA">Villa/House</option>
                            <option value="LAND">Plot/Land</option>
                            <option value="STUDIO">Studio</option>
                            <option value="PENTHOUSE">Penthouse</option>
                        </select>
                    </div>

                    <div>
                        <label className="label">Configuration (BHK)</label>
                        <select name="bhk_config" value={formData.bhk_config} onChange={handleChange} className="input-field">
                            <option value={1}>1 BHK</option>
                            <option value={2}>2 BHK</option>
                            <option value={3}>3 BHK</option>
                            <option value={4}>4+ BHK</option>
                        </select>
                    </div>
                </div>

                {/* --- 2. PRICING --- */}
                <SectionHeader title="2. Pricing & Financials" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="label">Total Price (₹) *</label>
                        <input type="number" name="total_price" value={formData.total_price} onChange={handleChange} className="input-field" required />
                    </div>
                    <div>
                        <label className="label">Maintenance Charges (₹)</label>
                        <input type="number" name="maintenance_charges" value={formData.maintenance_charges} onChange={handleChange} className="input-field" />
                    </div>
                    <div>
                        <label className="label">Interval</label>
                        <select name="maintenance_interval" value={formData.maintenance_interval} onChange={handleChange} className="input-field">
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                        </select>
                    </div>
                </div>

                {/* --- 3. SPECS & AREA --- */}
                <SectionHeader title="3. Specifications & Area" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <label className="label">Super Built-up (sq.ft) *</label>
                        <input type="number" name="super_builtup_area" value={formData.super_builtup_area} onChange={handleChange} className="input-field" required />
                    </div>
                    <div>
                        <label className="label">Carpet Area (sq.ft) *</label>
                        <input type="number" name="carpet_area" value={formData.carpet_area} onChange={handleChange} className="input-field" required />
                    </div>
                    <div>
                        <label className="label">Bathrooms</label>
                        <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="input-field" />
                    </div>
                    <div>
                        <label className="label">Balconies</label>
                        <input type="number" name="balconies" value={formData.balconies} onChange={handleChange} className="input-field" />
                    </div>
                    <div>
                        <label className="label">Floor No.</label>
                        <input type="number" name="specific_floor" value={formData.specific_floor} onChange={handleChange} className="input-field" />
                    </div>
                    <div>
                        <label className="label">Total Floors</label>
                        <input type="number" name="total_floors" value={formData.total_floors} onChange={handleChange} className="input-field" />
                    </div>
                    <div>
                        <label className="label">Facing</label>
                        <select name="facing" value={formData.facing} onChange={handleChange} className="input-field">
                            {['NORTH', 'SOUTH', 'EAST', 'WEST', 'NORTH_EAST', 'NORTH_WEST', 'SOUTH_EAST', 'SOUTH_WEST'].map(f => (
                                <option key={f} value={f}>{f.replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Age (Years)</label>
                        <input type="number" name="age_of_construction" value={formData.age_of_construction} onChange={handleChange} className="input-field" />
                    </div>
                </div>

                {/* --- 4. STATUS --- */}
                <SectionHeader title="4. Status & Furnishing" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="label">Availability</label>
                        <select name="availability_status" value={formData.availability_status} onChange={handleChange} className="input-field">
                            <option value="READY">Ready to Move</option>
                            <option value="UNDER_CONSTRUCTION">Under Construction</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Furnishing</label>
                        <select name="furnishing_status" value={formData.furnishing_status} onChange={handleChange} className="input-field">
                            <option value="UNFURNISHED">Unfurnished</option>
                            <option value="SEMI_FURNISHED">Semi-Furnished</option>
                            <option value="FULLY_FURNISHED">Fully Furnished</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Possession Date</label>
                        <input type="date" name="possession_date" value={formData.possession_date} onChange={handleChange} className="input-field" />
                    </div>
                </div>

                {/* --- 5. LOCATION --- */}
                <SectionHeader title="5. Location" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="label">Full Address *</label>
                        <textarea name="address_line" value={formData.address_line} onChange={handleChange} className="input-field h-20" required />
                    </div>
                    <div>
                        <label className="label">Locality *</label>
                        <input name="locality" value={formData.locality} onChange={handleChange} className="input-field" required />
                    </div>
                    <div>
                        <label className="label">City *</label>
                        <input name="city" value={formData.city} onChange={handleChange} className="input-field" required />
                    </div>
                    <div>
                        <label className="label">Pincode</label>
                        <input name="pincode" value={formData.pincode} onChange={handleChange} className="input-field" />
                    </div>
                    <div>
                        <label className="label">Landmark / Nearby</label>
                        <input name="landmarks" value={formData.landmarks} onChange={handleChange} className="input-field" />
                    </div>
                </div>

                {/* --- 6. AMENITIES --- */}
                <SectionHeader title="6. Amenities" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-lg">
                    {Object.keys(formData).filter(k => k.startsWith('has_') || k.startsWith('is_')).map(key => (
                        <label key={key} className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name={key}
                                // @ts-ignore
                                checked={formData[key]}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-700 capitalize">{key.replace('has_', '').replace('is_', '').replace('_', ' ')}</span>
                        </label>
                    ))}
                </div>

                {/* --- 7. DOCUMENTS & MEDIA --- */}
                <SectionHeader title="7. Media & Documents" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700">Property Documents</h4>
                        <div>
                            <label className="label">7/12 Extract (PDF/Img)</label>
                            <input type="file" onChange={(e) => handleFileChange(e, setDoc712)} className="input-file" />
                        </div>
                        <div>
                            <label className="label">Mojani / Map (PDF/Img)</label>
                            <input type="file" onChange={(e) => handleFileChange(e, setDocMojani)} className="input-file" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700">Visuals</h4>
                        <div>
                            <label className="label">Floor Plan Image</label>
                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setFloorPlan)} className="input-file" />
                        </div>
                        <div>
                            <label className="label">Gallery Images (Select Multiple)</label>
                            <input type="file" multiple accept="image/*" onChange={handleGalleryChange} className="input-file" />
                            <p className="text-xs text-gray-500 mt-1">{galleryImages.length} images selected</p>
                        </div>
                        <div>
                            <label className="label">Video URL (YouTube)</label>
                            <input name="video_url" value={formData.video_url} onChange={handleChange} className="input-field" placeholder="https://youtube.com/..." />
                        </div>
                    </div>
                </div>


                <div className="pt-8 border-t flex justify-end gap-4 sticky bottom-0 bg-white p-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all transform hover:scale-105"
                    >
                        {loading ? "Creating Listing..." : "Create Listing with Documents"}
                    </button>
                </div>
            </form >

            {/* Quick CSS Override for Cleaner Code */}
            < style jsx > {`
        .label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem; }
        .input-field { width: 100%; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; border-radius: 0.5rem; transition: border-color 0.2s; }
        .input-field:focus { border-color: #2563EB; outline: none; ring: 2px solid #BFDBFE; }
        .input-file { display: block; width: 100%; text-sm: text-gray-500; file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100; }
      `}</style >
        </div >
    );
}
