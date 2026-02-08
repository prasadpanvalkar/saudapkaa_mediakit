'use client';

import React, { useRef, useState, useEffect } from 'react';
import { toBlob } from 'html-to-image';
import { Download, Share2, LayoutTemplate, Check, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { RichTemplate } from './RichTemplate';

interface MarketingCanvasProps {
    property: any;
}

const TEMPLATE_STYLES = [
    { id: 'urgent', name: 'Urgent Sale', color: '#DC143C', icon: '🔥' },
    { id: 'premium', name: 'Premium', color: '#10B981', icon: '✨' },
    { id: 'modern', name: 'Modern', color: '#3B82F6', icon: '🏙️' },
    { id: 'luxury', name: 'Luxury', color: '#F59E0B', icon: '👑' },
    { id: 'clean', name: 'Clean', color: '#6B7280', icon: '⚪' },
] as const;

export default function MarketingCanvas({ property }: MarketingCanvasProps) {
    const templateRef = useRef<HTMLDivElement>(null);
    const [selectedStyle, setSelectedStyle] = useState<typeof TEMPLATE_STYLES[number]['id']>('urgent');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imagesLoaded, setImagesLoaded] = useState(false);

    // Preload images
    useEffect(() => {
        const preloadImages = async () => {
            setImagesLoaded(false);
            const images = property?.images || [];

            if (images.length === 0) {
                setImagesLoaded(true);
                return;
            }

            try {
                const imageUrls = images.slice(0, 3).map((img: any) => img.image || img);
                await Promise.all(
                    imageUrls.map((url: string) => {
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.crossOrigin = 'anonymous';
                            img.onload = resolve;
                            img.onerror = resolve;
                            img.src = url;
                        });
                    })
                );
                setImagesLoaded(true);
            } catch (err) {
                console.error('Image preload error:', err);
                setImagesLoaded(true);
            }
        };

        preloadImages();
    }, [property?.images, selectedStyle]);

    const generateImage = async (): Promise<Blob | null> => {
        if (!templateRef.current) {
            setError('Template not ready');
            return null;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const element = templateRef.current;

            // Store and remove transforms
            const originalStyles = {
                transform: element.style.transform,
                transition: element.style.transition,
                animation: element.style.animation,
            };

            element.style.transform = 'none';
            element.style.transition = 'none';
            element.style.animation = 'none';

            // Wait for fonts and renders
            await document.fonts.ready;
            await new Promise(resolve => setTimeout(resolve, 600));

            console.log('📸 Starting capture with html-to-image...');

            const blob = await toBlob(element, {
                pixelRatio: 2,
                backgroundColor: '#f5f5f5',
                cacheBust: true,
                style: {
                    transform: 'none',
                    transition: 'none',
                    animation: 'none'
                }
            });

            // Restore original styles
            element.style.transform = originalStyles.transform;
            element.style.transition = originalStyles.transition;
            element.style.animation = originalStyles.animation;

            if (blob) {
                console.log('✅ Blob created:', blob.size, 'bytes');
                return blob;
            } else {
                console.error('❌ Failed to create blob');
                setError('Failed to generate image');
                return null;
            }
        } catch (err) {
            console.error('❌ Image generation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate image');
            return null;
        } finally {
            setIsGenerating(false);
        }
    };



    const handleDownload = async () => {
        const blob = await generateImage();
        if (!blob) {
            setError('Failed to generate image. Please try again.');
            return;
        }

        try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const filename = `saudapakka_${property.title?.replace(/[^a-z0-9]/gi, '-') || 'property'}_${selectedStyle}_${Date.now()}.jpg`;
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('✅ Download complete:', filename);
        } catch (err) {
            console.error('❌ Download error:', err);
            setError('Download failed. Please try again.');
        }
    };

    const handleShare = async () => {
        if (!navigator.share) {
            setError('Sharing not supported on this device. Downloading instead...');
            await handleDownload();
            return;
        }

        const blob = await generateImage();
        if (!blob) {
            setError('Failed to generate image for sharing');
            return;
        }

        try {
            const file = new File([blob], `saudapakka-property.jpg`, { type: 'image/jpeg' });

            await navigator.share({
                files: [file],
                title: property.title || 'Property for Sale',
                text: `Check out this property: ${property.title || 'Premium Property'} in ${property.locality || property.city || 'Prime Location'}\n\nVisit Saudapakka.com for more details!`,
            });

            console.log('✅ Share successful');
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('ℹ️ Share cancelled by user');
                return;
            }
            console.error('❌ Share error:', err);
            setError('Share failed. Downloading instead...');
            await handleDownload();
        }
    };

    const currentTemplate = TEMPLATE_STYLES.find(t => t.id === selectedStyle);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'linear-gradient(to bottom right, #F9FAFB, #E5E7EB)',
            fontFamily: 'Arial, Helvetica, sans-serif'
        }}>
            {/* Toolbar */}
            <div style={{
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #E5E7EB',
                padding: '16px 24px',
                position: 'sticky',
                top: 0,
                zIndex: 20,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                }}>

                    {/* Template Selector */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        overflowX: 'auto',
                        paddingBottom: '8px'
                    }}>
                        <LayoutTemplate
                            style={{
                                color: '#9CA3AF',
                                marginRight: '8px',
                                flexShrink: 0
                            }}
                            size={20}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {TEMPLATE_STYLES.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => {
                                        setSelectedStyle(style.id);
                                        setError(null);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 16px',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        border: selectedStyle === style.id ? 'none' : '2px solid #E5E7EB',
                                        backgroundColor: selectedStyle === style.id ? '#111827' : '#FFFFFF',
                                        color: selectedStyle === style.id ? '#FFFFFF' : '#374151',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: selectedStyle === style.id ? '0 4px 14px rgba(0,0,0,0.25)' : '0 1px 2px rgba(0,0,0,0.05)',
                                        transform: selectedStyle === style.id ? 'scale(1.05)' : 'scale(1)',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedStyle !== style.id) {
                                            e.currentTarget.style.borderColor = '#9CA3AF';
                                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedStyle !== style.id) {
                                            e.currentTarget.style.borderColor = '#E5E7EB';
                                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                                        }
                                    }}
                                >
                                    <span style={{ fontSize: '16px' }}>{style.icon}</span>
                                    <span>{style.name}</span>
                                    {selectedStyle === style.id && <Check size={16} style={{ marginLeft: '4px' }} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={handleShare}
                            disabled={isGenerating || !imagesLoaded}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                backgroundColor: '#EFF6FF',
                                color: '#1D4ED8',
                                borderRadius: '12px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: (isGenerating || !imagesLoaded) ? 'not-allowed' : 'pointer',
                                opacity: (isGenerating || !imagesLoaded) ? 0.5 : 1,
                                transition: 'all 0.2s',
                                fontSize: '14px'
                            }}
                            onMouseEnter={(e) => {
                                if (!isGenerating && imagesLoaded) {
                                    e.currentTarget.style.backgroundColor = '#DBEAFE';
                                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#EFF6FF';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {isGenerating ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Share2 size={18} />}
                            <span>Share</span>
                        </button>

                        <button
                            onClick={handleDownload}
                            disabled={isGenerating || !imagesLoaded}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                backgroundColor: '#111827',
                                color: '#FFFFFF',
                                borderRadius: '12px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: (isGenerating || !imagesLoaded) ? 'not-allowed' : 'pointer',
                                opacity: (isGenerating || !imagesLoaded) ? 0.5 : 1,
                                boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s',
                                fontSize: '14px'
                            }}
                            onMouseEnter={(e) => {
                                if (!isGenerating && imagesLoaded) {
                                    e.currentTarget.style.backgroundColor = '#000000';
                                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#111827';
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={18} />
                                    <span>Download</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#991B1B',
                        fontSize: '14px'
                    }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            style={{
                                marginLeft: 'auto',
                                color: '#DC2626',
                                fontWeight: 600,
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Loading Images Indicator */}
                {!imagesLoaded && (
                    <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#EFF6FF',
                        border: '1px solid #93C5FD',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#1E40AF',
                        fontSize: '14px'
                    }}>
                        <Loader2 size={18} style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                        <span>Loading property images...</span>
                    </div>
                )}
            </div>

            {/* Preview Area */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px',
                position: 'relative'
            }}>
                <div style={{ position: 'relative' }}>
                    {/* Preview Label */}
                    <div style={{
                        position: 'absolute',
                        top: '-32px',
                        left: 0,
                        right: 0,
                        textAlign: 'center'
                    }}>
                        <span style={{
                            display: 'inline-block',
                            padding: '6px 16px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#4B5563',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid #E5E7EB'
                        }}>
                            {currentTemplate?.icon} {currentTemplate?.name} Template Preview
                        </span>
                    </div>

                    {/* Scaled Preview Container */}
                    <div style={{
                        position: 'relative',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        width: '540px',
                        height: '540px'
                    }}>
                        <div
                            ref={templateRef}
                            style={{
                                transform: 'scale(0.5)',
                                transformOrigin: 'top left',
                                width: '1080px',
                                height: '1080px'
                            }}
                        >
                            <RichTemplate
                                property={property}
                                templateStyle={selectedStyle}
                                id="marketing-template"
                            />
                        </div>

                        {/* Loading Overlay */}
                        {isGenerating && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(4px)',
                                zIndex: 30
                            }}>
                                <div style={{
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '16px',
                                    padding: '32px',
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                    textAlign: 'center'
                                }}>
                                    <Loader2 size={48} style={{
                                        animation: 'spin 1s linear infinite',
                                        marginLeft: 'auto',
                                        marginRight: 'auto',
                                        marginBottom: '16px',
                                        color: '#111827'
                                    }} />
                                    <p style={{
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        color: '#111827',
                                        marginBottom: '8px',
                                        margin: 0
                                    }}>Generating Image...</p>
                                    <p style={{
                                        fontSize: '14px',
                                        color: '#6B7280',
                                        margin: '8px 0 0 0'
                                    }}>This may take a few seconds</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quality Badge */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-32px',
                        left: 0,
                        right: 0,
                        textAlign: 'center'
                    }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 16px',
                            backgroundColor: '#111827',
                            color: '#FFFFFF',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                        }}>
                            <ImageIcon size={14} />
                            Full Resolution: 1080×1080 (2160×2160 at 2x)
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid #E5E7EB',
                padding: '16px 24px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                fontSize: '14px',
                color: '#6B7280'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#10B981',
                        borderRadius: '50%',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }} />
                    <span>Preview scaled to 50% • Download for full HD quality</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
                    <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#F3F4F6',
                        borderRadius: '999px',
                        fontWeight: 500
                    }}>
                        📱 Perfect for WhatsApp, Instagram & Facebook
                    </span>
                </div>
            </div>

            {/* Add CSS animation for spin */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
