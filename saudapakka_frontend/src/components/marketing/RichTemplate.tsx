'use client';

import React from 'react';

export interface RichTemplateProps {
    property: any;
    templateStyle: 'urgent' | 'premium' | 'modern' | 'luxury' | 'clean';
    id?: string;
}

const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (!numPrice || isNaN(numPrice)) return 'Price On Request';

    if (numPrice >= 10000000) {
        return `₹${(numPrice / 10000000).toFixed(2)} Cr`;
    } else if (numPrice >= 100000) {
        return `₹${(numPrice / 100000).toFixed(2)} L`;
    } else {
        return `₹${numPrice.toLocaleString('en-IN')}`;
    }
};

const COLORS = {
    urgent: { primary: '#DC143C', secondary: '#8B0000', accent: '#FFD700', text: '#1F2937', light: '#FFF5F5' },
    premium: { primary: '#10B981', secondary: '#065F46', accent: '#34D399', text: '#111827', light: '#ECFDF5' },
    modern: { primary: '#3B82F6', secondary: '#1E40AF', accent: '#60A5FA', text: '#1E293B', light: '#EFF6FF' },
    luxury: { primary: '#D4AF37', secondary: '#111827', accent: '#F59E0B', text: '#F3F4F6', light: '#1F2937' },
    clean: { primary: '#4B5563', secondary: '#1F2937', accent: '#9CA3AF', text: '#374151', light: '#F9FAFB' }
} as const;

// Enhanced data extraction helpers
const getPropertyData = (property: any) => {
    return {
        title: property?.title || property?.property_name || '3 BHK Premium Flat',
        locality: property?.locality || property?.area || 'Prime Location',
        city: property?.city || 'Pune',
        bedrooms: property?.bedrooms || property?.bhk_type || 3,
        carpet_area: property?.carpet_area || property?.area_sqft || property?.built_up_area || 1200,
        price: property?.total_price || property?.price || property?.expected_price || 0,
        // Multiple possible contact field names
        contact: property?.contact_number ||
            property?.owner_phone ||
            property?.phone ||
            property?.mobile_number ||
            property?.contact ||
            '+91 9730416763',
        furnished: property?.furnished_status || property?.furnishing || 'Semi-Furnished',
        parking: property?.parking || property?.parking_available || 'Available',
        description: property?.description || property?.about || '',
        property_type: property?.property_type || 'Residential Apartment',
        images: Array.isArray(property?.images) ? property.images : []
    };
};

const getAmenities = (property: any) => {
    const data = getPropertyData(property);
    return [
        data.furnished && `${data.furnished}`,
        data.parking && `${data.parking} Parking`,
        property?.balconies && `${property.balconies} Balcony`,
        '24×7 Water Supply',
        'Power Backup',
        'Gated Society'
    ].filter(Boolean).slice(0, 6);
};

// ==================== URGENT TEMPLATE ====================
const UrgentTemplate: React.FC<{ property: any, id?: string }> = ({ property, id }) => {
    const theme = COLORS.urgent;
    const data = getPropertyData(property);
    const location = `${data.locality}, ${data.city}`;
    const price = formatPrice(data.price);
    const mainImage = data.images[0]?.image || data.images[0] || '/api/placeholder/600/400';
    const subImages = data.images.slice(1, 3);
    const amenities = getAmenities(property);

    return (
        <div id={id || "marketing-template"} style={{
            width: '1080px',
            height: '1080px',
            position: 'relative',
            backgroundColor: '#F9FAFB',
            fontFamily: 'Arial, Helvetica, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            transform: 'none',
            transition: 'none',
            animation: 'none'
        }}>
            {/* RED URGENT HEADER */}
            <div style={{
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                height: '130px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 10px 25px rgba(220, 20, 60, 0.3)',
                overflow: 'hidden'
            }}>
                {/* Decorative circles */}
                <div style={{
                    position: 'absolute',
                    left: '-40px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
                    border: '4px solid rgba(255,255,255,0.2)'
                }} />
                <div style={{
                    position: 'absolute',
                    right: '-40px',
                    bottom: '-40px',
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
                    border: '4px solid rgba(255,255,255,0.2)'
                }} />

                <h1 style={{
                    color: 'white',
                    fontSize: '76px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    margin: 0,
                    textShadow: '4px 4px 12px rgba(0,0,0,0.5)',
                    letterSpacing: '4px',
                    zIndex: 1
                }}>
                    🔥 URGENT SALE 🔥
                </h1>
            </div>

            {/* MAIN CONTENT */}
            <div style={{
                display: 'flex',
                flex: 1,
                overflow: 'hidden',
                height: 'calc(100% - 130px - 52px)'
            }}>
                {/* LEFT INFO COLUMN - 45% */}
                <div style={{
                    width: '45%',
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    backgroundColor: 'white',
                    borderRight: '4px solid #E5E7EB'
                }}>
                    {/* LOCATION */}
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderLeft: `7px solid ${theme.primary}`,
                        boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
                        borderRadius: '8px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '36px', lineHeight: 1 }}>📍</span>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#6B7280',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1.5px',
                                    marginBottom: '6px'
                                }}>Location</div>
                                <div style={{
                                    fontSize: '30px',
                                    color: '#111827',
                                    fontWeight: 'bold',
                                    lineHeight: 1.2
                                }}>{location}</div>
                            </div>
                        </div>
                    </div>

                    {/* HIGHLIGHTS */}
                    <div style={{
                        background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                        padding: '20px',
                        borderRadius: '12px',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(124, 58, 237, 0.35)'
                    }}>
                        <h3 style={{
                            fontSize: '17px',
                            fontWeight: 'bold',
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            opacity: 0.95
                        }}>⭐ HIGHLIGHTS</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            <span style={{
                                backgroundColor: 'rgba(255,255,255,0.25)',
                                padding: '8px 18px',
                                borderRadius: '25px',
                                fontSize: '19px',
                                fontWeight: 700,
                                border: '2px solid rgba(255,255,255,0.3)'
                            }}>
                                🏠 {data.bedrooms} BHK
                            </span>
                            <span style={{
                                backgroundColor: 'rgba(255,255,255,0.25)',
                                padding: '8px 18px',
                                borderRadius: '25px',
                                fontSize: '19px',
                                fontWeight: 700,
                                border: '2px solid rgba(255,255,255,0.3)'
                            }}>
                                📐 {data.carpet_area} Sqft
                            </span>
                            <span style={{
                                backgroundColor: 'rgba(255,255,255,0.25)',
                                padding: '8px 18px',
                                borderRadius: '25px',
                                fontSize: '19px',
                                fontWeight: 700,
                                border: '2px solid rgba(255,255,255,0.3)'
                            }}>
                                ✅ Clear Title
                            </span>
                        </div>
                    </div>

                    {/* AMENITIES */}
                    <div style={{
                        flex: 1,
                        backgroundColor: '#FFFBEB',
                        border: '3px solid #FCD34D',
                        borderRadius: '12px',
                        padding: '18px',
                        boxShadow: '0 2px 8px rgba(252, 211, 77, 0.25)'
                    }}>
                        <h3 style={{
                            fontSize: '21px',
                            fontWeight: 'bold',
                            color: '#92400E',
                            marginBottom: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{ fontSize: '26px' }}>⭐</span> Amenities
                        </h3>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '11px'
                        }}>
                            {amenities.map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '19px',
                                    color: '#1F2937',
                                    gap: '12px'
                                }}>
                                    <span style={{
                                        color: theme.primary,
                                        fontSize: '20px',
                                        fontWeight: 'bold'
                                    }}>✓</span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{
                            marginTop: '14px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            textAlign: 'center',
                            padding: '12px',
                            borderRadius: '10px',
                            fontWeight: 'bold',
                            fontSize: '18px',
                            border: '2px dashed #FBBF24'
                        }}>
                            💰 Bank Loan Available
                        </div>
                    </div>

                    {/* PRICE */}
                    <div style={{
                        background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
                        color: 'white',
                        padding: '22px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        boxShadow: '0 6px 20px rgba(37, 99, 235, 0.45)'
                    }}>
                        <div style={{
                            fontSize: '15px',
                            textTransform: 'uppercase',
                            letterSpacing: '2.5px',
                            marginBottom: '8px',
                            opacity: 0.9,
                            fontWeight: 600
                        }}>OFFER PRICE</div>
                        <div style={{
                            fontSize: '56px',
                            fontWeight: 900,
                            lineHeight: 1,
                            marginBottom: '8px',
                            textShadow: '3px 3px 6px rgba(0,0,0,0.3)'
                        }}>{price}</div>
                        <div style={{
                            fontSize: '17px',
                            fontStyle: 'italic',
                            opacity: 0.9
                        }}>(Fixed & Final)</div>
                    </div>

                    {/* CONTACT - MOST PROMINENT */}
                    <div style={{
                        background: 'linear-gradient(135deg, #DC143C 0%, #991B1B 100%)',
                        padding: '22px',
                        color: 'white',
                        boxShadow: '0 6px 20px rgba(220, 20, 60, 0.4)',
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: '3px solid rgba(255,255,255,0.2)'
                    }}>
                        <div style={{
                            fontSize: '15px',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            marginBottom: '10px',
                            opacity: 0.95,
                            fontWeight: 600
                        }}>📞 CONTACT NOW</div>
                        <div style={{
                            fontSize: '38px',
                            fontWeight: 900,
                            letterSpacing: '1px',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                        }}>{data.contact}</div>
                    </div>
                </div>

                {/* RIGHT IMAGE COLUMN - 55% */}
                <div style={{
                    width: '55%',
                    padding: '28px 28px 28px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    backgroundColor: '#F3F4F6'
                }}>
                    {/* MAIN IMAGE */}
                    <div style={{
                        flex: 1,
                        borderRadius: '18px',
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                        border: '6px solid white'
                    }}>
                        <img
                            src={mainImage}
                            alt="Property"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                            crossOrigin="anonymous"
                        />

                        {/* WATERMARK - More visible */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%) rotate(-18deg)',
                            fontSize: '92px',
                            fontWeight: 900,
                            color: 'rgba(255, 255, 255, 0.35)',
                            textShadow: '4px 4px 8px rgba(0,0,0,0.5), -2px -2px 4px rgba(255,255,255,0.3)',
                            letterSpacing: '6px',
                            whiteSpace: 'nowrap',
                            zIndex: 10,
                            pointerEvents: 'none',
                            fontFamily: 'Arial Black, Arial, sans-serif',
                            WebkitTextStroke: '2px rgba(0,0,0,0.1)'
                        }}>
                            SAUDAPAKKA.COM
                        </div>

                        {/* VERIFIED BADGE */}
                        <div style={{
                            position: 'absolute',
                            bottom: '24px',
                            right: '24px',
                            backgroundColor: '#10B981',
                            color: 'white',
                            padding: '12px 28px',
                            borderRadius: '50px',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            boxShadow: '0 6px 16px rgba(16, 185, 129, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            border: '2px solid rgba(255,255,255,0.3)'
                        }}>
                            <span style={{ fontSize: '24px' }}>✅</span>
                            Verified
                        </div>
                    </div>

                    {/* SUB IMAGES */}
                    <div style={{
                        height: '190px',
                        display: 'flex',
                        gap: '20px'
                    }}>
                        {subImages.length > 0 ? (
                            subImages.map((img: any, idx: number) => (
                                <div key={idx} style={{
                                    flex: 1,
                                    borderRadius: '14px',
                                    overflow: 'hidden',
                                    border: '4px solid white',
                                    boxShadow: '0 6px 15px rgba(0,0,0,0.12)'
                                }}>
                                    <img
                                        src={img.image || img}
                                        alt={`View ${idx + 1}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                        crossOrigin="anonymous"
                                    />
                                </div>
                            ))
                        ) : (
                            <>
                                <div style={{
                                    flex: 1,
                                    backgroundColor: '#D1D5DB',
                                    borderRadius: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '56px',
                                    border: '4px solid white'
                                }}>🏢</div>
                                <div style={{
                                    flex: 1,
                                    backgroundColor: '#D1D5DB',
                                    borderRadius: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '56px',
                                    border: '4px solid white'
                                }}>🌳</div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div style={{
                height: '52px',
                backgroundColor: theme.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '19px',
                fontWeight: 'bold',
                letterSpacing: '3px',
                textTransform: 'uppercase'
            }}>
                Create your free listing at WWW.SAUDAPAKKA.COM
            </div>
        </div>
    );
};

// ==================== PREMIUM TEMPLATE ====================
const PremiumTemplate: React.FC<{ property: any, id?: string }> = ({ property, id }) => {
    const theme = COLORS.premium;
    const data = getPropertyData(property);
    const location = `${data.locality}, ${data.city}`;
    const price = formatPrice(data.price);
    const mainImage = data.images[0]?.image || data.images[0] || '/api/placeholder/600/400';
    const amenities = getAmenities(property);

    return (
        <div id={id || "marketing-template"} style={{
            width: '1080px',
            height: '1080px',
            backgroundColor: theme.light,
            fontFamily: 'Arial, Helvetica, sans-serif',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            transform: 'none',
            transition: 'none',
            animation: 'none'
        }}>
            <div style={{
                padding: '50px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '35px'
            }}>
                {/* HEADER */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: '19px',
                        letterSpacing: '4px',
                        color: theme.primary,
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        marginBottom: '12px'
                    }}>
                        ✨ Premium Residence
                    </div>
                    <h1 style={{
                        color: theme.secondary,
                        fontSize: '68px',
                        fontWeight: 900,
                        margin: '0 0 18px 0',
                        lineHeight: 1.1,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        {data.title}
                    </h1>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '28px',
                        color: '#4B5563',
                        backgroundColor: 'white',
                        padding: '14px 32px',
                        borderRadius: '40px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        border: `2px solid ${theme.light}`
                    }}>
                        <span style={{ fontSize: '30px' }}>📍</span> {location}
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    gap: '35px',
                    overflow: 'hidden'
                }}>
                    {/* LEFT - IMAGE */}
                    <div style={{
                        flex: 3,
                        position: 'relative',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
                        border: '8px solid white'
                    }}>
                        <img
                            src={mainImage}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                            crossOrigin="anonymous"
                        />
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.05)'
                        }} />

                        {/* WATERMARK */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%) rotate(-12deg)',
                            fontSize: '95px',
                            fontWeight: 900,
                            color: 'rgba(255, 255, 255, 0.35)',
                            textShadow: '4px 4px 8px rgba(0,0,0,0.4)',
                            whiteSpace: 'nowrap',
                            zIndex: 10,
                            pointerEvents: 'none',
                            letterSpacing: '8px'
                        }}>
                            SAUDAPAKKA
                        </div>

                        {/* PROPERTY TYPE BADGE */}
                        <div style={{
                            position: 'absolute',
                            top: '30px',
                            left: '30px',
                            backgroundColor: theme.primary,
                            color: 'white',
                            padding: '12px 28px',
                            borderRadius: '50px',
                            fontSize: '22px',
                            fontWeight: 'bold',
                            boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
                            border: '2px solid rgba(255,255,255,0.3)'
                        }}>
                            {data.property_type}
                        </div>
                    </div>

                    {/* RIGHT - INFO */}
                    <div style={{
                        flex: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px'
                    }}>
                        {/* FEATURES BOX */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '32px',
                            borderRadius: '24px',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                            flex: 1,
                            border: `3px solid ${theme.light}`
                        }}>
                            <h3 style={{
                                color: theme.secondary,
                                fontSize: '26px',
                                fontWeight: 'bold',
                                marginBottom: '24px',
                                borderBottom: `3px solid ${theme.light}`,
                                paddingBottom: '14px'
                            }}>
                                ⭐ Features
                            </h3>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}>
                                {amenities.map((item, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '20px',
                                        color: '#374151',
                                        gap: '12px'
                                    }}>
                                        <span style={{
                                            color: theme.primary,
                                            fontSize: '24px'
                                        }}>✓</span>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PRICE BOX */}
                        <div style={{
                            background: `linear-gradient(135deg, ${theme.secondary} 0%, ${theme.primary} 100%)`,
                            color: 'white',
                            padding: '32px',
                            borderRadius: '24px',
                            textAlign: 'center',
                            boxShadow: '0 8px 20px rgba(6, 95, 70, 0.3)'
                        }}>
                            <div style={{
                                fontSize: '18px',
                                textTransform: 'uppercase',
                                letterSpacing: '3px',
                                opacity: 0.9,
                                marginBottom: '8px'
                            }}>
                                Asking Price
                            </div>
                            <div style={{
                                fontSize: '52px',
                                fontWeight: 900,
                                margin: '12px 0',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                            }}>
                                {price}
                            </div>
                            <div style={{
                                marginTop: '16px',
                                paddingTop: '16px',
                                borderTop: '2px solid rgba(255,255,255,0.3)'
                            }}>
                                <div style={{
                                    fontSize: '16px',
                                    opacity: 0.9,
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px'
                                }}>
                                    Contact Now
                                </div>
                                <div style={{
                                    fontSize: '32px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px'
                                }}>
                                    <span style={{ fontSize: '28px' }}>📞</span>
                                    {data.contact}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div style={{
                height: '52px',
                backgroundColor: theme.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                letterSpacing: '3px'
            }}>
                WWW.SAUDAPAKKA.COM
            </div>
        </div>
    );
};

// ==================== MODERN TEMPLATE ====================
const ModernTemplate: React.FC<{ property: any, id?: string }> = ({ property, id }) => {
    const theme = COLORS.modern;
    const data = getPropertyData(property);
    const location = `${data.locality}, ${data.city}`;
    const price = formatPrice(data.price);
    const mainImage = data.images[0]?.image || data.images[0] || '/api/placeholder/600/400';

    return (
        <div id={id || "marketing-template"} style={{
            width: '1080px',
            height: '1080px',
            backgroundColor: '#FFFFFF',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Arial, Helvetica, sans-serif',
            transform: 'none',
            transition: 'none',
            animation: 'none'
        }}>
            {/* TOP IMAGE SECTION */}
            <div style={{
                height: '62%',
                position: 'relative'
            }}>
                <img
                    src={mainImage}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                    crossOrigin="anonymous"
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 70%)'
                }} />

                {/* WATERMARK */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '110px',
                    fontWeight: 900,
                    color: 'rgba(255, 255, 255, 0.25)',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    pointerEvents: 'none',
                    letterSpacing: '10px',
                    textShadow: '3px 3px 8px rgba(0,0,0,0.5)'
                }}>
                    SAUDAPAKKA
                </div>

                {/* PROPERTY INFO OVERLAY */}
                <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '50px',
                    right: '50px',
                    color: 'white',
                    zIndex: 11
                }}>
                    <div style={{
                        backgroundColor: theme.primary,
                        padding: '10px 28px',
                        display: 'inline-block',
                        fontWeight: 'bold',
                        fontSize: '22px',
                        marginBottom: '20px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '2px'
                    }}>
                        FOR SALE
                    </div>
                    <h1 style={{
                        fontSize: '76px',
                        fontWeight: 900,
                        lineHeight: 1.1,
                        margin: '0 0 16px 0',
                        textShadow: '0 6px 16px rgba(0,0,0,0.6)'
                    }}>
                        {data.title}
                    </h1>
                    <p style={{
                        fontSize: '34px',
                        fontWeight: 400,
                        opacity: 0.95,
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span style={{ fontSize: '36px' }}>📍</span> {location}
                    </p>
                </div>
            </div>

            {/* BOTTOM INFO SECTION */}
            <div style={{
                flex: 1,
                display: 'flex',
                backgroundColor: '#F8FAFC'
            }}>
                {/* LEFT - INFO CARDS */}
                <div style={{
                    flex: 1,
                    padding: '50px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '24px'
                    }}>
                        {/* PRICE CARD */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '28px',
                            borderRadius: '20px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            border: '2px solid #E2E8F0'
                        }}>
                            <div style={{
                                fontSize: '16px',
                                color: '#64748B',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                Price
                            </div>
                            <div style={{
                                fontSize: '34px',
                                fontWeight: 'bold',
                                color: theme.secondary,
                                lineHeight: 1.2
                            }}>
                                {price}
                            </div>
                        </div>

                        {/* CONFIG CARD */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '28px',
                            borderRadius: '20px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            border: '2px solid #E2E8F0'
                        }}>
                            <div style={{
                                fontSize: '16px',
                                color: '#64748B',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                Configuration
                            </div>
                            <div style={{
                                fontSize: '34px',
                                fontWeight: 'bold',
                                color: theme.secondary
                            }}>
                                {data.bedrooms} BHK
                            </div>
                        </div>

                        {/* CONTACT CARD - Full Width */}
                        <div style={{
                            backgroundColor: theme.secondary,
                            padding: '28px',
                            borderRadius: '20px',
                            gridColumn: 'span 2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '16px',
                            fontWeight: 'bold',
                            color: 'white',
                            boxShadow: '0 6px 16px rgba(30, 64, 175, 0.3)',
                            fontSize: '28px'
                        }}>
                            <span style={{ fontSize: '32px' }}>📞</span>
                            {data.contact}
                        </div>
                    </div>
                </div>

                {/* RIGHT - OVERVIEW */}
                <div style={{
                    width: '420px',
                    backgroundColor: 'white',
                    padding: '50px 45px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    borderLeft: '3px solid #E2E8F0'
                }}>
                    <h3 style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        marginBottom: '24px',
                        color: theme.secondary,
                        borderBottom: `3px solid ${theme.light}`,
                        paddingBottom: '14px'
                    }}>
                        Overview
                    </h3>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            fontSize: '22px',
                            color: '#475569'
                        }}>
                            <span style={{ fontSize: '28px' }}>🏠</span>
                            <span>{data.property_type}</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            fontSize: '22px',
                            color: '#475569'
                        }}>
                            <span style={{ fontSize: '28px' }}>📐</span>
                            <span>{data.carpet_area} Sqft</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            fontSize: '22px',
                            color: '#475569'
                        }}>
                            <span style={{ fontSize: '28px' }}>✅</span>
                            <span>Verified Property</span>
                        </div>
                    </div>
                    <div style={{
                        marginTop: 'auto',
                        fontWeight: 'bold',
                        letterSpacing: '3px',
                        fontSize: '18px',
                        color: theme.primary,
                        textAlign: 'center',
                        padding: '16px',
                        backgroundColor: theme.light,
                        borderRadius: '12px'
                    }}>
                        WWW.SAUDAPAKKA.COM
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==================== LUXURY TEMPLATE ====================
const LuxuryTemplate: React.FC<{ property: any, id?: string }> = ({ property, id }) => {
    const theme = COLORS.luxury;
    const data = getPropertyData(property);
    const price = formatPrice(data.price);
    const mainImage = data.images[0]?.image || data.images[0] || '/api/placeholder/600/400';
    const location = `${data.locality}, ${data.city}`;

    return (
        <div id={id || "marketing-template"} style={{
            width: '1080px',
            height: '1080px',
            backgroundColor: '#0F172A',
            color: '#F3F4F6',
            fontFamily: 'Arial, Helvetica, sans-serif',
            position: 'relative',
            transform: 'none',
            transition: 'none',
            animation: 'none'
        }}>
            <div style={{
                border: `28px solid ${theme.primary}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                {/* IMAGE SECTION */}
                <div style={{
                    height: '600px',
                    position: 'relative',
                    borderBottom: `5px solid ${theme.primary}`
                }}>
                    <img
                        src={mainImage}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                        crossOrigin="anonymous"
                    />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(15,23,42,0.7))'
                    }} />

                    {/* WATERMARK */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '85px',
                        fontWeight: 900,
                        color: 'rgba(212, 175, 55, 0.45)',
                        letterSpacing: '12px',
                        zIndex: 10,
                        pointerEvents: 'none',
                        textShadow: '3px 3px 10px rgba(0,0,0,0.7)'
                    }}>
                        LUXURY
                    </div>

                    {/* LOCATION BADGE */}
                    <div style={{
                        position: 'absolute',
                        bottom: '30px',
                        left: '30px',
                        right: '30px',
                        backgroundColor: 'rgba(212, 175, 55, 0.95)',
                        color: '#111827',
                        padding: '18px 32px',
                        borderRadius: '8px',
                        fontSize: '28px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.5)'
                    }}>
                        📍 {location}
                    </div>
                </div>

                {/* INFO SECTION */}
                <div style={{
                    flex: 1,
                    padding: '50px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    <div style={{
                        color: theme.primary,
                        letterSpacing: '10px',
                        fontSize: '22px',
                        textTransform: 'uppercase',
                        marginBottom: '20px',
                        fontWeight: 'bold'
                    }}>
                        ✦ Exquisite Living ✦
                    </div>

                    <h1 style={{
                        fontSize: '68px',
                        fontWeight: 900,
                        margin: '0 0 30px 0',
                        lineHeight: 1.2,
                        color: '#F9FAFB'
                    }}>
                        {data.title}
                    </h1>

                    <div style={{
                        display: 'flex',
                        gap: '60px',
                        margin: '0 0 45px 0',
                        fontSize: '30px',
                        color: '#D1D5DB'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '34px' }}>🏠</span> {data.bedrooms} Bedrooms
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '34px' }}>📐</span> {data.carpet_area} Sq.Ft
                        </span>
                    </div>

                    <div style={{
                        fontSize: '76px',
                        color: theme.primary,
                        margin: '0 0 45px 0',
                        fontWeight: 900,
                        fontFamily: 'Arial, sans-serif',
                        textShadow: '3px 3px 8px rgba(0,0,0,0.5)'
                    }}>
                        {price}
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        border: `3px solid ${theme.primary}`,
                        padding: '20px 50px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(212, 175, 55, 0.1)'
                    }}>
                        <span style={{ fontSize: '36px' }}>📞</span>
                        <span style={{
                            fontSize: '36px',
                            color: theme.primary,
                            fontWeight: 'bold',
                            letterSpacing: '2px'
                        }}>
                            {data.contact}
                        </span>
                    </div>

                    {/* SAUDAPAKKA BADGE */}
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: theme.primary,
                        fontSize: '16px',
                        letterSpacing: '4px',
                        fontWeight: 'bold',
                        opacity: 0.7
                    }}>
                        WWW.SAUDAPAKKA.COM
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==================== CLEAN TEMPLATE ====================
const CleanTemplate: React.FC<{ property: any, id?: string }> = ({ property, id }) => {
    const theme = COLORS.clean;
    const data = getPropertyData(property);
    const location = `${data.locality}, ${data.city}`;
    const price = formatPrice(data.price);
    const mainImage = data.images[0]?.image || data.images[0] || '/api/placeholder/600/400';

    return (
        <div id={id || "marketing-template"} style={{
            width: '1080px',
            height: '1080px',
            backgroundColor: 'white',
            padding: '70px',
            borderRadius: '0',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Arial, Helvetica, sans-serif',
            transform: 'none',
            transition: 'none',
            animation: 'none'
        }}>
            {/* MAIN IMAGE */}
            <div style={{
                flex: 1,
                borderRadius: '32px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 25px 50px rgba(0,0,0,0.12)',
                border: '6px solid #F3F4F6'
            }}>
                <img
                    src={mainImage}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                    crossOrigin="anonymous"
                />

                {/* WATERMARK */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-8deg)',
                    fontSize: '105px',
                    fontWeight: 900,
                    color: 'rgba(255, 255, 255, 0.45)',
                    zIndex: 10,
                    pointerEvents: 'none',
                    letterSpacing: '8px',
                    textShadow: '4px 4px 10px rgba(0,0,0,0.3)'
                }}>
                    SAUDAPAKKA
                </div>

                {/* BADGE */}
                <div style={{
                    position: 'absolute',
                    top: '45px',
                    left: '45px',
                    background: 'white',
                    padding: '14px 36px',
                    borderRadius: '100px',
                    fontSize: '26px',
                    fontWeight: 'bold',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    border: '3px solid #F3F4F6'
                }}>
                    ✨ Featured
                </div>
            </div>

            {/* BOTTOM INFO */}
            <div style={{ marginTop: '65px' }}>
                {/* TITLE AND PRICE */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '50px',
                    gap: '40px'
                }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{
                            fontSize: '68px',
                            fontWeight: 900,
                            color: '#111827',
                            margin: '0 0 20px 0',
                            lineHeight: 1.1
                        }}>
                            {data.title}
                        </h1>
                        <p style={{
                            fontSize: '38px',
                            color: '#6B7280',
                            margin: 0,
                            fontWeight: 400,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <span style={{ fontSize: '40px' }}>📍</span> {location}
                        </p>
                    </div>
                    <div style={{
                        textAlign: 'right',
                        minWidth: '350px'
                    }}>
                        <div style={{
                            fontSize: '22px',
                            color: '#9CA3AF',
                            textTransform: 'uppercase',
                            marginBottom: '10px',
                            letterSpacing: '2px'
                        }}>
                            Price
                        </div>
                        <div style={{
                            fontSize: '60px',
                            fontWeight: 'bold',
                            color: theme.secondary,
                            lineHeight: 1
                        }}>
                            {price}
                        </div>
                    </div>
                </div>

                <hr style={{
                    border: 'none',
                    borderTop: '3px solid #F3F4F6',
                    margin: '45px 0'
                }} />

                {/* DETAILS AND CONTACT */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    {/* LEFT - DETAILS */}
                    <div style={{
                        display: 'flex',
                        gap: '50px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '30px',
                            color: '#374151',
                            gap: '14px'
                        }}>
                            <span style={{ fontSize: '36px' }}>🛏️</span> {data.bedrooms} Beds
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '30px',
                            color: '#374151',
                            gap: '14px'
                        }}>
                            <span style={{ fontSize: '36px' }}>📐</span> {data.carpet_area} Sqft
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '30px',
                            color: '#374151',
                            gap: '14px'
                        }}>
                            <span style={{ fontSize: '36px' }}>✅</span> Verified
                        </div>
                    </div>

                    {/* RIGHT - CONTACT */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        backgroundColor: '#2563EB',
                        padding: '20px 45px',
                        borderRadius: '100px',
                        boxShadow: '0 6px 20px rgba(37, 99, 235, 0.3)'
                    }}>
                        <span style={{
                            fontSize: '34px',
                            color: 'white'
                        }}>
                            📞
                        </span>
                        <span style={{
                            fontSize: '38px',
                            fontWeight: 'bold',
                            color: 'white',
                            letterSpacing: '1px'
                        }}>
                            {data.contact}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==================== MAIN EXPORT ====================
export const RichTemplate: React.FC<RichTemplateProps> = ({ property, templateStyle, id }) => {
    const elementId = id || "marketing-template";

    switch (templateStyle) {
        case 'urgent':
            return <UrgentTemplate property={property} id={elementId} />;
        case 'premium':
            return <PremiumTemplate property={property} id={elementId} />;
        case 'modern':
            return <ModernTemplate property={property} id={elementId} />;
        case 'luxury':
            return <LuxuryTemplate property={property} id={elementId} />;
        case 'clean':
            return <CleanTemplate property={property} id={elementId} />;
        default:
            return <UrgentTemplate property={property} id={elementId} />;
    }
};
