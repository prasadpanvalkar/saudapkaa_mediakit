'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import MarketingCanvas from '@/components/marketing/MarketingCanvas';
import { ChevronLeft } from 'lucide-react';

export default function MarketingPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            if (!id) return;
            try {
                // 1. Fetch Property
                const propResponse = await api.get(`/api/properties/${id}/`);
                const propertyData = propResponse.data;

                // 2. Fetch User to verify ownership
                const userResponse = await api.get('/api/user/me/');
                const userData = userResponse.data;

                if (String(propertyData.owner) !== String(userData.id)) {
                    console.error('Unauthorized: User does not own this property');
                    router.push('/dashboard/my-listings');
                    return;
                }

                setProperty(propertyData);
                setAuthorized(true);
            } catch (err) {
                console.error("Failed to fetch property or verify access", err);
                router.push('/dashboard/my-listings');
            } finally {
                setLoading(false);
            }
        };

        checkAccess();
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!authorized || !property) return null;

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <header className="flex items-center px-6 py-4 bg-white border-b shadow-sm z-10 shrink-0">
                <button onClick={() => router.back()} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Marketing Kit</h1>
                    <p className="text-sm text-gray-500">Generate social media posts for "{property.title}"</p>
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative">
                <MarketingCanvas property={property} />
            </main>
        </div>
    );
}
