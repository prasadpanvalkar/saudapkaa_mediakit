'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios'; // Use centralized api instance
import { TEMPLATES, MarketingTemplate } from '@/components/marketing/templates';
import MarketingCanvas from '@/components/marketing/MarketingCanvas';
import { ChevronLeft } from 'lucide-react';

export default function MarketingPage() {
    const params = useParams();
    const router = useRouter();
    // Handle potential array type for id (Next.js useParams behavior)
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    // Use proper typing or fallback
    const [property, setProperty] = useState<any>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<MarketingTemplate>(TEMPLATES[0]);
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
                // We use the centralized API which handles the token automatically
                const userResponse = await api.get('/api/user/me/');
                const userData = userResponse.data;

                // Verify ownership
                // Note: Ensure types match (string vs int). API usually returns string for UUIDs or ints.
                // Property owner ID might be an object or ID depending on serializer. 
                // Assuming it returns an ID based on analysis.
                if (String(propertyData.owner) !== String(userData.id)) {
                    console.error('Unauthorized: User does not own this property');
                    router.push('/dashboard/my-listings');
                    return;
                }

                setProperty(propertyData);
                setAuthorized(true);
            } catch (err) {
                console.error("Failed to fetch property or verify access", err);
                // On error (401/403/404), redirect
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

    // Prepare data for canvas
    const canvasData = {
        title: property.title || 'Property Title',
        price: property.total_price ? `₹${Number(property.total_price).toLocaleString()}` : 'Price On Request',
        location: property.locality || property.city || 'Location',
        contact: property.whatsapp_number || '+91 98765 43210', // Use real number or fallback
        // Ensure we have a valid list of images
        images: property.images && property.images.length > 0
            ? property.images.map((img: any) => typeof img === 'string' ? img : img.image)
            : ['/placeholder.jpg']
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <header className="flex items-center px-6 py-4 bg-white border-b shadow-sm z-10">
                <button onClick={() => router.back()} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Marketing Kit</h1>
                    <p className="text-sm text-gray-500">Generate social media posts for "{property.title}"</p>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Sidebar: Templates */}
                <aside className="w-80 bg-white border-r overflow-y-auto p-4 hidden md:block">
                    <h2 className="font-semibold mb-4 text-gray-700">Templates</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {TEMPLATES.map((tmpl) => (
                            <button
                                key={tmpl.id}
                                onClick={() => setSelectedTemplate(tmpl)}
                                className={`aspect-square rounded border-2 overflow-hidden transition-all ${selectedTemplate.id === tmpl.id ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                {/* Mini Preview */}
                                <div
                                    className="w-full h-full flex items-center justify-center text-xs text-center p-1"
                                    style={{ backgroundColor: tmpl.canvas.backgroundColor }} // Updated to new structure
                                >
                                    {tmpl.name}
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Content: Editor */}
                <section className="flex-1 flex justify-center items-start p-6 overflow-y-auto bg-gray-100">
                    <div className="w-full max-w-[500px]">
                        {/* Mobile Template Selector (Visible only on small screens) */}
                        <div className="md:hidden mb-4 overflow-x-auto whitespace-nowrap pb-2">
                            {TEMPLATES.map((tmpl) => (
                                <button
                                    key={tmpl.id}
                                    onClick={() => setSelectedTemplate(tmpl)}
                                    className={`inline-block w-20 h-20 mr-2 rounded border-2 ${selectedTemplate.id === tmpl.id ? 'border-blue-600' : 'border-gray-200'
                                        }`}
                                    style={{ backgroundColor: tmpl.canvas.backgroundColor }}
                                />
                            ))}
                        </div>

                        {/* Pass property ID for persistence */}
                        <MarketingCanvas
                            template={selectedTemplate}
                            data={canvasData}
                            propertyId={id as string}
                            onTemplateChange={setSelectedTemplate}
                        />

                        <p className="mt-4 text-xs text-center text-gray-400">
                            Pro Tip: Click on any text in the image to edit it directly.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
