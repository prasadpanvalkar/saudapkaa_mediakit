export type UnitType =
    'FLAT' | 'VILLA_BUNGALOW' | 'PLOT' | 'LAND' | 'COMMERCIAL_UNIT';

export type ListingType = 'SALE' | 'RENT';

export interface BaseUnit {
    // Identity
    id: string;
    type: UnitType;
    subtype: string;
    name: string;
    title: string;
    description: string;
    descriptionManuallyEdited: boolean;
    listingType: ListingType;

    // Pricing
    total_price: string;
    price_per_sqft: string;
    maintenance_charges: number;
    maintenance_interval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME';

    // Area
    super_builtup_area: string;
    carpet_area: string;
    plot_area: string;

    // Configuration (FLAT, VILLA_BUNGALOW, COMMERCIAL_UNIT)
    bhk_config: number;
    bathrooms: number;
    balconies: number;
    furnishing_status: 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FULLY_FURNISHED';
    specific_floor: string;
    total_floors: string;
    facing: string;

    // Availability
    availability_status: 'READY' | 'UNDER_CONSTRUCTION';
    possession_date: string;
    age_of_construction: number;

    // Contact
    listed_by: 'OWNER' | 'BROKER' | 'BUILDER';
    whatsapp_number: string;
    video_url: string;

    // Residential Amenities (FLAT, VILLA_BUNGALOW, COMMERCIAL_UNIT)
    has_power_backup: boolean;
    has_lift: boolean;
    has_swimming_pool: boolean;
    has_clubhouse: boolean;
    has_gym: boolean;
    has_park: boolean;
    has_reserved_parking: boolean;
    has_security: boolean;
    is_vastu_compliant: boolean;
    has_intercom: boolean;
    has_piped_gas: boolean;
    has_wifi: boolean;

    // Plot Amenities (PLOT, LAND)
    has_drainage_line: boolean;
    has_one_gate_entry: boolean;
    has_jogging_park: boolean;
    has_children_park: boolean;
    has_temple: boolean;
    has_water_line: boolean;
    has_street_light: boolean;
    has_internal_roads: boolean;

    // Submission
    submissionStatus: 'idle' | 'submitting' | 'success' | 'error';
    submissionError?: string;
}

export interface ProjectDetails {
    projectName: string;
    locality: string;
    city: string;
    pincode: string;
    state: string;
    googleMapsUrl: string;
    reraNumber: string;
    builderName: string;
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    latitude: number;
    longitude: number;
    landmarks: string;
}

export interface MediaItem {
    id: string;
    url: string;
    file: File | null;
    taggedUnitIds: string[];
}
