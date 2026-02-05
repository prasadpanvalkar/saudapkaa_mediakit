'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { MarketingTemplate, TEMPLATES } from './templates'; // Import TEMPLATES for restoration
import { Download, Share2, RefreshCw } from 'lucide-react';
import { saveCustomization, loadCustomization } from './utils/localStorage';

interface PropertyData {
    title: string;
    price: string;
    location: string;
    contact?: string;
    images: string[];
}

interface MarketingCanvasProps {
    template: MarketingTemplate;
    data: PropertyData;
    propertyId: string;
    onTemplateChange?: (template: MarketingTemplate) => void;
}

export default function MarketingCanvas({ template, data, propertyId, onTemplateChange }: MarketingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Show toast helper
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // --- Persistence: Load ---
    useEffect(() => {
        if (!propertyId) return;
        const saved = loadCustomization(propertyId);
        if (saved && saved.templateId && onTemplateChange) {
            const savedTemplate = TEMPLATES.find(t => t.id === saved.templateId);
            if (savedTemplate && savedTemplate.id !== template.id) {
                onTemplateChange(savedTemplate);
            }
        }
    }, [propertyId]); // Run once on mount per property

    // --- Persistence: Save ---
    useEffect(() => {
        if (!propertyId || !template) return;
        saveCustomization(propertyId, {
            templateId: template.id
        });
    }, [template, propertyId]);

    // --- Initialize Canvas ---
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 500,
            height: 500,
            backgroundColor: '#f3f4f6',
        });

        // Scale: 500px preview / 1080px actual
        const scale = 500 / 1080;
        canvas.setZoom(scale);

        setFabricCanvas(canvas);

        return () => {
            canvas.dispose();
        };
    }, []);

    // --- Helper: Load Image with CORS Fallback ---
    const loadPropertyImage = async (imageUrl: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Try CORS first

            img.onload = () => resolve(img);

            img.onerror = () => {
                console.warn('CORS failed for:', imageUrl, 'Retrying without CORS...');
                // Fallback: Try without crossOrigin (tainted canvas, export might fail but display works)
                // Note: If export logic uses toDataURL, it WILL fail with tainted canvas.
                // But at least the user sees the image.
                const fallbackImg = new Image();
                fallbackImg.onload = () => resolve(fallbackImg);
                fallbackImg.onerror = () => reject(new Error('Failed to load image'));
                fallbackImg.src = imageUrl;
            };

            img.src = imageUrl;
        });
    };

    // --- Helper: Format Price ---
    const formatPrice = (price: number | string): string => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        if (!numPrice || isNaN(numPrice)) return 'Price On Request';
        if (numPrice >= 10000000) { // 1 Crore+
            return `₹${(numPrice / 10000000).toFixed(2)} Cr`;
        } else if (numPrice >= 100000) { // 1 Lakh+
            return `₹${(numPrice / 100000).toFixed(2)} L`;
        } else {
            return `₹${numPrice.toLocaleString('en-IN')}`;
        }
    };

    // --- Render Canvas ---
    useEffect(() => {
        if (!fabricCanvas) return;

        const loadTemplate = async () => {
            setLoading(true);
            try {
                fabricCanvas.clear();
                fabricCanvas.backgroundColor = template.canvas.backgroundColor;

                // Sort objects so we draw in order
                for (const obj of template.objects) {
                    if (obj.type === 'image') {
                        // This is the property image slot
                        const imageUrl = data.images[currentImageIndex] || '/placeholder.jpg';
                        if (imageUrl) {
                            try {
                                const imgElement = await loadPropertyImage(imageUrl);
                                const fImg = new fabric.Image(imgElement);

                                // Fit logic based on obj dimensions
                                if (obj.width && obj.height) {
                                    const scaleX = obj.width / fImg.width!;
                                    const scaleY = obj.height / fImg.height!;
                                    const scale = Math.max(scaleX, scaleY);
                                    fImg.scale(scale);

                                    fImg.set({
                                        left: obj.left + (obj.width / 2),
                                        top: obj.top + (obj.height / 2),
                                        originX: 'center',
                                        originY: 'center',
                                        opacity: obj.opacity || 1
                                    });

                                    // Clip to rect if needed (basic implementation)
                                    // For now relying on order / overlay
                                } else {
                                    fImg.set({
                                        left: obj.left,
                                        top: obj.top,
                                        opacity: obj.opacity || 1
                                    });
                                }

                                fImg.set({
                                    selectable: false,
                                    evented: false,
                                    angle: obj.angle || 0
                                });

                                fabricCanvas.add(fImg);
                                fabricCanvas.sendObjectToBack(fImg);
                            } catch (e) {
                                console.error("Failed to load image", e);
                            }
                        }
                    } else if (obj.type === 'text') {
                        let textContent = obj.text || '';

                        // Replace placeholders with actual data
                        // Handle price formatting
                        if (textContent.includes('{{price}}')) {
                            textContent = textContent.replace('{{price}}', formatPrice(data.price));
                        }

                        textContent = textContent
                            .replace('{{title}}', data.title || 'Property Title')
                            .replace('{{address}}', data.location || '')
                            .replace('{{contact}}', data.contact || '+91 98765 43210');

                        const textOptions: any = {
                            left: obj.left,
                            top: obj.top,
                            fontSize: obj.fontSize,
                            fontFamily: obj.fontFamily,
                            fill: obj.fill,
                            fontWeight: obj.fontWeight as string | number, // Cast for Fabric
                            textAlign: (obj.textAlign || 'left') as any,
                            originX: (obj.originX || 'left') as fabric.TOriginX,
                            originY: (obj.originY || 'top') as fabric.TOriginY,
                            width: obj.width || 600,
                            angle: obj.angle || 0,
                            editable: obj.id !== 'watermark',
                            selectable: obj.id !== 'watermark'
                        };

                        // Add shadow if specified
                        if (obj.shadow) {
                            textOptions.shadow = new fabric.Shadow({
                                color: obj.shadow.color,
                                blur: obj.shadow.blur,
                                offsetX: obj.shadow.offsetX,
                                offsetY: obj.shadow.offsetY
                            });
                        }

                        // Add stroke if specified
                        if (obj.stroke) {
                            textOptions.stroke = obj.stroke;
                            textOptions.strokeWidth = obj.strokeWidth || 1;
                        }

                        const text = new fabric.Textbox(textContent, textOptions);
                        fabricCanvas.add(text);
                    } else if (obj.type === 'rect') {
                        const rectOptions: any = {
                            left: obj.left,
                            top: obj.top,
                            width: obj.width,
                            height: obj.height,
                            fill: obj.fill,
                            opacity: obj.opacity || 1,
                            selectable: false,
                            evented: false,
                            angle: obj.angle || 0
                        };

                        // Add shadow if specified
                        if (obj.shadow) {
                            rectOptions.shadow = new fabric.Shadow({
                                color: obj.shadow.color,
                                blur: obj.shadow.blur,
                                offsetX: obj.shadow.offsetX,
                                offsetY: obj.shadow.offsetY
                            });
                        }
                        if (obj.stroke) {
                            rectOptions.stroke = obj.stroke;
                            rectOptions.strokeWidth = obj.strokeWidth || 1;
                        }

                        const rect = new fabric.Rect(rectOptions);
                        fabricCanvas.add(rect);
                    } else if (obj.type === 'circle') { // Add support for Circle
                        const circleOptions: any = {
                            left: obj.left,
                            top: obj.top,
                            radius: obj.radius,
                            fill: obj.fill,
                            opacity: obj.opacity || 1,
                            selectable: false,
                            evented: false,
                            angle: obj.angle || 0
                        };

                        if (obj.shadow) {
                            circleOptions.shadow = new fabric.Shadow({
                                color: obj.shadow.color,
                                blur: obj.shadow.blur,
                                offsetX: obj.shadow.offsetX,
                                offsetY: obj.shadow.offsetY
                            });
                        }

                        const circle = new fabric.Circle(circleOptions);
                        fabricCanvas.add(circle);
                    }
                }

                // Watermark handled in template now, removed hardcoded one

                fabricCanvas.renderAll();
            } finally {
                setLoading(false);
                setImageLoading(false);
            }
        };

        loadTemplate();

    }, [fabricCanvas, template, currentImageIndex, data]);

    // --- Actions ---

    const handleImageSwap = () => {
        if (!data.images || data.images.length <= 1) return;
        setImageLoading(true);
        setCurrentImageIndex((prev) => (prev + 1) % data.images.length);
    };

    const handleDownload = () => {
        if (!fabricCanvas) return;
        try {
            const dataURL = fabricCanvas.toDataURL({
                format: 'jpeg',
                quality: 0.9,
                multiplier: 1080 / 500
            });

            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `property-${data.title.slice(0, 10)}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast('Image downloaded successfully!', 'success');
        } catch (err) {
            console.error("Download failed", err);
            showToast('Download failed. Check console.', 'error');
        }
    };

    const handleShare = async () => {
        if (!fabricCanvas) return;
        try {
            const dataURL = fabricCanvas.toDataURL({
                format: 'jpeg',
                quality: 0.9,
                multiplier: 1080 / 500
            });

            const blob = await (await fetch(dataURL)).blob();
            const file = new File([blob], 'listing.jpg', { type: 'image/jpeg' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: data.title,
                    text: `Check out this property: ${data.title} - ${data.price}`
                });
                showToast('Shared successfully!', 'success');
            } else {
                showToast('Sharing not supported on this device', 'error');
            }
        } catch (err) {
            console.error("Share failed", err);
            showToast('Share failed. Please download instead.', 'error');
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Editor Toolbar */}
            <div className="flex justify-between items-center p-2 bg-white rounded shadow-sm">
                <button
                    onClick={handleImageSwap}
                    disabled={imageLoading || !data.images || data.images.length <= 1}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700 disabled:opacity-50"
                >
                    {imageLoading ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" /> Swap...
                        </>
                    ) : (
                        <>
                            <RefreshCw size={16} /> Swap Image ({currentImageIndex + 1}/{data.images.length})
                        </>
                    )}
                </button>
            </div>

            {/* Canvas Area */}
            <div className="relative border rounded shadow-lg overflow-hidden bg-gray-50 flex justify-center items-center">
                <canvas ref={canvasRef} width={500} height={500} className="max-w-full" />
                {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/75 z-10">Loading Template...</div>}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded hover:bg-gray-900 shadow-md transition-colors"
                >
                    <Download size={18} /> Download
                </button>
                <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow-md transition-colors"
                >
                    <Share2 size={18} /> Share
                </button>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl z-50 font-medium text-sm animate-fade-in-up ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
