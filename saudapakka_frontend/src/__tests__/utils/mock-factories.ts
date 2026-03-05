import { BaseUnit, ProjectDetails, MediaItem } from '@/components/builder/types';

export const createMockUnit = (overrides: Partial<BaseUnit> = {}): BaseUnit => ({
    id: 'unit-id-001',
    type: 'FLAT',
    subtype: '',
    name: 'Unit 101',
    title: '',
    description: '',
    descriptionManuallyEdited: false,
    listingType: 'SALE',
    total_price: '',
    price_per_sqft: '',
    maintenance_charges: 0,
    maintenance_interval: 'MONTHLY',
    super_builtup_area: '',
    carpet_area: '',
    plot_area: '',
    bhk_config: 2,
    bathrooms: 1,
    balconies: 0,
    furnishing_status: 'UNFURNISHED',
    specific_floor: '',
    total_floors: '',
    facing: '',
    availability_status: 'READY',
    possession_date: '',
    age_of_construction: 0,
    listed_by: 'BUILDER',
    whatsapp_number: '',
    video_url: '',
    has_power_backup: false,
    has_lift: false,
    has_swimming_pool: false,
    has_clubhouse: false,
    has_gym: false,
    has_park: false,
    has_reserved_parking: false,
    has_security: false,
    is_vastu_compliant: false,
    has_intercom: false,
    has_piped_gas: false,
    has_wifi: false,
    has_drainage_line: false,
    has_one_gate_entry: false,
    has_jogging_park: false,
    has_children_park: false,
    has_temple: false,
    has_water_line: false,
    has_street_light: false,
    has_internal_roads: false,
    submissionStatus: 'idle',
    ...overrides,
});

export const createCompleteUnit = (overrides: Partial<BaseUnit> = {}): BaseUnit =>
    createMockUnit({
        total_price: '5000000',
        carpet_area: '1200',
        specific_floor: '4',
        total_floors: '10',
        bhk_config: 2,
        title: '2 BHK Flat for Sale in Jalna, Jalna',
        ...overrides,
    });

export const createMockProjectDetails = (
    overrides: Partial<ProjectDetails> = {}
): ProjectDetails => ({
    projectName: 'Sauda Heights',
    locality: 'Main Road',
    city: 'Jalna',
    pincode: '431203',
    state: 'Maharashtra',
    googleMapsUrl: '',
    reraNumber: '',
    builderName: 'Test Builder',
    landmarks: '',
    addressLine1: 'Building A',
    addressLine2: '',
    addressLine3: '',
    latitude: 19.8762,
    longitude: 75.3433,
    ...overrides,
});

export const createMockMediaItem = (
    overrides: Partial<MediaItem> = {}
): MediaItem => ({
    id: 'media-id-001',
    url: 'blob:mock-url-123',
    file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
    taggedUnitIds: [],
    ...overrides,
});

export const createMockBuilderUser = (overrides = {}) => ({
    id: 'user-001',
    full_name: 'Test Builder',
    email: 'builder@test.com',
    role_category: 'BUILDER',
    is_kyc_verified: true,
    is_active_seller: true,
    is_active_broker: false,
    is_staff: false,
    ...overrides,
});

export const createMockBuyerUser = (overrides = {}) => ({
    ...createMockBuilderUser(),
    role_category: 'BUYER',
    ...overrides,
});
