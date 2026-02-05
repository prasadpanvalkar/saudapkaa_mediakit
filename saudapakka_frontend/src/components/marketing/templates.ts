export interface MarketingTemplate {
    id: string;
    name: string;
    thumbnail: string;
    canvas: {
        width: number;
        height: number;
        backgroundColor: string;
    };
    objects: TemplateObject[];
}

export interface ShadowConfig {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
}

export interface TemplateObject {
    type: 'image' | 'text' | 'rect' | 'circle';
    left: number;
    top: number;
    width?: number;
    height?: number;
    fill?: string;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string | number;
    textAlign?: string;
    opacity?: number;
    originX?: string;
    originY?: string;
    id?: string;
    stroke?: string;
    strokeWidth?: number;
    radius?: number; // For circles
    angle?: number; // For rotation
    shadow?: ShadowConfig; // New: Shadow support
}

export const templates: MarketingTemplate[] = [
    // ============================================
    // TEMPLATE 1: CLEAN PROFESSIONAL
    // High contrast, clear info, corporate look
    // ============================================
    {
        id: 'professional',
        name: 'Clean Professional',
        thumbnail: '/templates/professional-thumb.jpg',
        canvas: {
            width: 1080,
            height: 1080,
            backgroundColor: '#ffffff'
        },
        objects: [
            // Property Image (Top 65%)
            {
                type: 'image',
                left: 0,
                top: 0,
                width: 1080,
                height: 700
            },

            // Dark Gradient Overlay on Image Bottom for text readability if needed
            {
                type: 'rect',
                left: 0,
                top: 500,
                width: 1080,
                height: 200,
                fill: 'transparent' // could use gradient if fabric supported easy gradients in JSON, or just solid bar below
            },

            // Green Layout Bar (Bottom 35%)
            {
                type: 'rect',
                left: 0,
                top: 700,
                width: 1080,
                height: 380,
                fill: '#2D5F3F'
            },

            // Watermark
            {
                type: 'text',
                text: 'SAUDAPAKKA.COM',
                left: 540,
                top: 350,
                fontSize: 90,
                fontWeight: 900,
                fontFamily: 'Arial',
                fill: 'rgba(255, 255, 255, 0.25)', // 25% opacity
                textAlign: 'center',
                originX: 'center',
                originY: 'center',
                angle: -15,
                stroke: '#000000',
                strokeWidth: 2,
                id: 'watermark'
            },

            // Price - High Contrast White on Green
            {
                type: 'text',
                text: '{{price}}',
                left: 60,
                top: 750,
                fontSize: 72,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fill: '#ffffff',
                shadow: { color: 'rgba(0,0,0,0.3)', blur: 4, offsetX: 2, offsetY: 2 },
                id: 'price'
            },

            // Title
            {
                type: 'text',
                text: '{{title}}',
                left: 60,
                top: 840,
                fontSize: 36,
                fontWeight: 600,
                fontFamily: 'Arial',
                fill: '#E8F5E9',
                id: 'title'
            },

            // Address
            {
                type: 'text',
                text: '📍 {{address}}',
                left: 60,
                top: 910,
                fontSize: 24,
                fontFamily: 'Arial',
                fill: '#ffffff',
                id: 'address'
            },

            // Contact
            {
                type: 'text',
                text: '📞 {{contact}}',
                left: 60,
                top: 960,
                fontSize: 24,
                fontFamily: 'Arial',
                fill: '#ffffff',
                fontWeight: 'bold',
                id: 'contact'
            },

            // Website Footer
            {
                type: 'text',
                text: 'www.saudapakka.com',
                left: 1020,
                top: 1030,
                fontSize: 24,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fill: '#4A9B6D',
                textAlign: 'right',
                originX: 'right',
                id: 'website'
            }
        ]
    },

    // ============================================
    // TEMPLATE 2: MODERN CARD
    // Floating card style, very popular on IG
    // ============================================
    {
        id: 'modern-card',
        name: 'Modern Card',
        thumbnail: '/templates/modern-card-thumb.jpg',
        canvas: {
            width: 1080,
            height: 1080,
            backgroundColor: '#f0f2f5'
        },
        objects: [
            // Background Image (Blurred or scaled) - simulated by main image
            {
                type: 'image',
                left: 0,
                top: 0,
                width: 1080,
                height: 1080,
                opacity: 0.2
            },

            // Main Content Card
            {
                type: 'rect',
                left: 60,
                top: 60,
                width: 960,
                height: 960,
                fill: '#ffffff',
                shadow: { color: 'rgba(0,0,0,0.2)', blur: 20, offsetX: 0, offsetY: 10 }
            },

            // Property Image inside card
            {
                type: 'image',
                left: 60,
                top: 60,
                width: 960,
                height: 600
            },

            // Watermark on Image
            {
                type: 'text',
                text: 'SAUDAPAKKA.COM',
                left: 540,
                top: 360,
                fontSize: 80,
                fontWeight: 900,
                fontFamily: 'Arial',
                fill: 'rgba(255, 255, 255, 0.25)',
                textAlign: 'center',
                originX: 'center',
                originY: 'center',
                stroke: 'rgba(0,0,0,0.2)',
                strokeWidth: 2,
                angle: -10,
                id: 'watermark'
            },

            // Info Area
            {
                type: 'text',
                text: '{{title}}',
                left: 100,
                top: 700,
                fontSize: 42,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fill: '#333333',
                id: 'title'
            },

            {
                type: 'text',
                text: '{{price}}',
                left: 100,
                top: 760,
                fontSize: 56,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fill: '#2D5F3F',
                id: 'price'
            },

            // Divider
            {
                type: 'rect',
                left: 100,
                top: 840,
                width: 880,
                height: 2,
                fill: '#eeeeee'
            },

            {
                type: 'text',
                text: '📍 {{address}}',
                left: 100,
                top: 880,
                fontSize: 24,
                fontFamily: 'Arial',
                fill: '#666666',
                id: 'address'
            },

            {
                type: 'text',
                text: '📞 {{contact}}',
                left: 100,
                top: 930,
                fontSize: 24,
                fontFamily: 'Arial',
                fill: '#666666',
                id: 'contact'
            },

            // Logo / Brand
            {
                type: 'text',
                text: 'SAUDAPAKKA',
                left: 980,
                top: 700,
                fontSize: 24,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fill: '#4A9B6D',
                textAlign: 'right',
                originX: 'right',
                id: 'logo'
            }
        ]
    },

    // ============================================
    // TEMPLATE 3: BOLD BANNER
    // Strong visual impact
    // ============================================
    {
        id: 'bold-banner',
        name: 'Bold Banner',
        thumbnail: '/templates/bold-banner-thumb.jpg',
        canvas: {
            width: 1080,
            height: 1080,
            backgroundColor: '#111111'
        },
        objects: [
            // Full Screen Image
            {
                type: 'image',
                left: 0,
                top: 0,
                width: 1080,
                height: 1080
            },

            // Text protection overlay (gradient)
            {
                type: 'rect',
                left: 0,
                top: 0,
                width: 1080,
                height: 1080,
                fill: '#000000',
                opacity: 0.3
            },

            // Diagonal Banner
            {
                type: 'rect',
                left: -100,
                top: 800,
                width: 1500,
                height: 400,
                fill: '#2D5F3F',
                angle: -5,
                opacity: 0.95,
                shadow: { color: 'black', blur: 10, offsetX: 0, offsetY: 5 }
            },

            // Watermark
            {
                type: 'text',
                text: 'SAUDAPAKKA.COM',
                left: 540,
                top: 540,
                fontSize: 100,
                fontWeight: 900,
                fontFamily: 'Arial',
                fill: 'rgba(255, 255, 255, 0.2)',
                textAlign: 'center',
                originX: 'center',
                originY: 'center',
                angle: -20,
                stroke: 'rgba(255,255,255,0.4)',
                strokeWidth: 3,
                id: 'watermark'
            },

            // Price on Banner
            {
                type: 'text',
                text: '{{price}}',
                left: 100,
                top: 820,
                fontSize: 80,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fill: '#ffffff',
                shadow: { color: 'rgba(0,0,0,0.5)', blur: 5, offsetX: 3, offsetY: 3 },
                angle: -5,
                id: 'price'
            },

            // Contact Below
            {
                type: 'text',
                text: 'Call: {{contact}}',
                left: 120,
                top: 920,
                fontSize: 32,
                fontFamily: 'Arial',
                fill: '#e0e0e0',
                angle: -5,
                id: 'contact'
            },

            // Top Logo
            {
                type: 'rect',
                left: 800,
                top: 50,
                width: 250,
                height: 70,
                fill: 'white',

            },
            {
                type: 'text',
                text: 'SAUDAPAKKA',
                left: 925,
                top: 85,
                fontSize: 28,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fill: '#2D5F3F',
                originX: 'center',
                originY: 'center',
                id: 'logo'
            }
        ]
    },

    // ============================================
    // TEMPLATE 4: SPLIT SCREEN
    // Balanced info and visual
    // ============================================
    {
        id: 'split-screen',
        name: 'Split Screen',
        thumbnail: '/templates/split-screen-thumb.jpg',
        canvas: {
            width: 1080,
            height: 1080,
            backgroundColor: '#ffffff'
        },
        objects: [
            // Left Half - Info
            {
                type: 'rect',
                left: 0,
                top: 0,
                width: 540,
                height: 1080,
                fill: '#1a1a1a'
            },
            // Logo
            {
                type: 'text',
                text: 'SAUDAPAKKA',
                left: 60,
                top: 100,
                fontSize: 40,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fill: '#4A9B6D',
                id: 'logo'
            },

            {
                type: 'text',
                text: 'FOR SALE',
                left: 60,
                top: 250,
                fontSize: 30,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fill: 'white',
                stroke: '#4A9B6D',
                strokeWidth: 1,
                id: 'label'
            },

            {
                type: 'text',
                text: '{{price}}',
                left: 60,
                top: 320,
                fontSize: 70,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fill: '#ffffff',
                id: 'price'
            },

            {
                type: 'text',
                text: '{{title}}',
                left: 60,
                top: 450,
                width: 420,
                fontSize: 36,
                fontWeight: '600',
                fontFamily: 'Arial',
                fill: '#cccccc',
                id: 'title'
            },

            {
                type: 'text',
                text: '📍 {{address}}',
                left: 60,
                top: 700,
                fontSize: 24,
                fontFamily: 'Arial',
                fill: '#999999',
                id: 'address'
            },
            {
                type: 'text',
                text: '📞 {{contact}}',
                left: 60,
                top: 760,
                fontSize: 24,
                fontFamily: 'Arial',
                fill: '#999999',
                id: 'contact'
            },


            // Right Half - Image
            {
                type: 'image',
                left: 540,
                top: 0,
                width: 540,
                height: 1080
            },

            // Watermark Vertical
            {
                type: 'text',
                text: 'SAUDAPAKKA.COM',
                left: 810,
                top: 540,
                fontSize: 60,
                fontWeight: 900,
                fontFamily: 'Arial',
                fill: 'rgba(255, 255, 255, 0.3)',
                textAlign: 'center',
                originX: 'center',
                originY: 'center',
                angle: 90,
                stroke: '#000000',
                strokeWidth: 2,
                id: 'watermark'
            }
        ]
    },

    // ============================================
    // TEMPLATE 5: LUXURY DARK
    // Ultra Premium
    // ============================================
    {
        id: 'luxury-dark',
        name: 'Luxury Dark',
        thumbnail: '/templates/luxury-dark-thumb.jpg',
        canvas: {
            width: 1080,
            height: 1080,
            backgroundColor: '#000000'
        },
        objects: [
            // Image
            {
                type: 'image',
                left: 0,
                top: 0,
                width: 1080,
                height: 1080,
                opacity: 0.6
            },

            // Top/Bottom Cinematic Bars
            {
                type: 'rect',
                left: 0,
                top: 0,
                width: 1080,
                height: 150,
                fill: 'black'
            },
            {
                type: 'rect',
                left: 0,
                top: 930,
                width: 1080,
                height: 150,
                fill: 'black'
            },

            // Gold Frame
            {
                type: 'rect',
                left: 50,
                top: 50,
                width: 980,
                height: 980,
                fill: 'transparent',
                stroke: '#d4af37',
                strokeWidth: 4
            },

            // Watermark
            {
                type: 'text',
                text: 'SAUDAPAKKA',
                left: 540,
                top: 540,
                fontSize: 90,
                fontWeight: 900,
                fontFamily: 'serif',
                fill: 'rgba(212, 175, 55, 0.2)', // Gold tint
                textAlign: 'center',
                originX: 'center',
                originY: 'center',
                id: 'watermark'
            },

            // Details
            {
                type: 'text',
                text: '{{price}}',
                left: 540,
                top: 960,
                fontSize: 60,
                fontWeight: 'bold',
                fontFamily: 'serif',
                fill: '#d4af37', // Gold
                textAlign: 'center',
                originX: 'center',
                id: 'price'
            },
            {
                type: 'text',
                text: '{{title}}',
                left: 540,
                top: 880,
                fontSize: 40,
                fontFamily: 'serif',
                fill: '#ffffff',
                textAlign: 'center',
                originX: 'center',
                shadow: { color: 'black', blur: 10, offsetX: 2, offsetY: 2 },
                id: 'title'
            },
            {
                type: 'text',
                text: 'SAUDAPAKKA LUXURY COLLECTION',
                left: 540,
                top: 80,
                fontSize: 24,
                fontFamily: 'serif',
                fill: '#d4af37',
                textAlign: 'center',
                originX: 'center',
                id: 'header'
            }
        ]
    }
];

export const TEMPLATES = templates;
