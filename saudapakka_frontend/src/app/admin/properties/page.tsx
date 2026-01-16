"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";
import {
    MagnifyingGlassIcon,
    PlusIcon,
    HomeModernIcon,
    PencilSquareIcon,
    TrashIcon,
    CheckBadgeIcon,
    XCircleIcon,
    ClockIcon
} from "@heroicons/react/24/outline";
import PropertyVerificationModal from "@/components/admin/PropertyVerificationModal";

type Property = {
    id: string;
    title: string;
    project_name: string;
    city: string;
    total_price: number;
    verification_status: string;
    owner: {
        full_name: string;
        email: string;
    };
    created_at: string;
    images: { image: string, is_thumbnail: boolean }[];
};

export default function AdminPropertiesPage() {
    const { user } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL"); // ALL, PENDING, VERIFIED, REJECTED

    // Modal State
    const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

    useEffect(() => {
        if (user?.is_staff) {
            fetchProperties();
        }
    }, [filter, user]);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            // If filter is ALL, fetch all, otherwise filter by status
            const url = filter === 'ALL'
                ? '/api/admin/properties/'
                : `/api/admin/properties/?status=${filter}`;

            const res = await api.get(url);
            setProperties(res.data);
        } catch (error) {
            console.error("Failed to fetch properties", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this property? This action cannot be undone.")) return;

        try {
            await api.delete(`/api/properties/${id}/`);
            setProperties(properties.filter(p => p.id !== id));
        } catch (error) {
            alert("Failed to delete property.");
        }
    };

    const handleVerifyClick = (propId: string) => {
        setSelectedPropId(propId);
        setIsVerifyModalOpen(true);
    };

    const handleVerificationComplete = () => {
        fetchProperties(); // Refresh list to show new status
    };

    const filteredProps = properties.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.project_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.owner?.email.toLowerCase().includes(search.toLowerCase())
    );

    if (!user?.is_staff) {
        return <div className="p-10 text-center text-red-500 font-bold">⛔ Admin Access Required</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Properties</h1>
                    <p className="text-gray-500 mt-1">Manage listings, verify ownership, and moderate content.</p>
                </div>
                <Link
                    href="/admin/properties/create"
                    className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-gray-200"
                >
                    <PlusIcon className="w-5 h-5" />
                    Add New Listing
                </Link>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 w-fit">
                {[
                    { id: 'ALL', label: 'All Listings' },
                    { id: 'PENDING', label: 'Pending Review' },
                    { id: 'VERIFIED', label: 'Verified' },
                    { id: 'REJECTED', label: 'Rejected' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === tab.id
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search by title, project, or owner..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                />
            </div>

            {/* Properties Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/80">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location & Price</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-10 text-center text-gray-400">Loading properties...</td></tr>
                            ) : filteredProps.length === 0 ? (
                                <tr><td colSpan={5} className="p-10 text-center text-gray-400">No properties found.</td></tr>
                            ) : (
                                filteredProps.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-16 w-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                                                    {p.images && p.images.length > 0 ? (
                                                        <img src={p.images[0].image} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <HomeModernIcon className="h-full w-full p-4 text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-gray-900 line-clamp-1">{p.title}</div>
                                                    <div className="text-xs text-gray-500">{p.project_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">₹ {(p.total_price / 100000).toFixed(2)} L</div>
                                            <div className="text-xs text-gray-500">{p.city}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{p.owner?.full_name || "Unknown"}</div>
                                            <div className="text-xs text-gray-500">{p.owner?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${p.verification_status === 'VERIFIED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                p.verification_status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                }`}>
                                                {p.verification_status === 'VERIFIED' && <CheckBadgeIcon className="w-3.5 h-3.5 mr-1" />}
                                                {p.verification_status === 'REJECTED' && <XCircleIcon className="w-3.5 h-3.5 mr-1" />}
                                                {p.verification_status === 'PENDING' && <ClockIcon className="w-3.5 h-3.5 mr-1" />}
                                                {p.verification_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-3 items-center">
                                                <button
                                                    onClick={() => handleVerifyClick(p.id)}
                                                    className="text-indigo-600 hover:text-indigo-900 font-medium hover:underline decoration-2 underline-offset-2 mr-2"
                                                >
                                                    Verify
                                                </button>
                                                <Link href={`/admin/properties/edit/${p.id}`} className="text-gray-400 hover:text-blue-600">
                                                    <PencilSquareIcon className="w-5 h-5" />
                                                </Link>
                                                <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-600">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {selectedPropId && (
                <PropertyVerificationModal
                    propertyId={selectedPropId}
                    isOpen={isVerifyModalOpen}
                    onClose={() => setIsVerifyModalOpen(false)}
                    onStatusChange={handleVerificationComplete}
                />
            )}
        </div>
    );
}
