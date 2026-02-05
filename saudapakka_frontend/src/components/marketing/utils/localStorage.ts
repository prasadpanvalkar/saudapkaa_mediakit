export interface SavedCustomization {
    templateId: string;
    lastUsed: string; // ISO timestamp
    customText?: {
        [key: string]: string; // e.g., { "title": "Custom Title", "price": "Custom Price" }
    };
}

/**
 * Save user's template selection and customizations for a property
 */
export const saveCustomization = (propertyId: string, data: Partial<SavedCustomization>): void => {
    try {
        const key = `marketing_kit_${propertyId}`;
        const existing = loadCustomization(propertyId) || {} as Partial<SavedCustomization>; // Cast to Partial to allow property access

        const updated: SavedCustomization = {
            templateId: existing.templateId || '',
            // lastUsed: existing.lastUsed || new Date().toISOString(), // Removed duplicate, we set it below
            ...existing,
            ...data,
            lastUsed: new Date().toISOString() // Override with current time
        } as SavedCustomization;

        localStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
        console.error('Failed to save customization:', error);
    }
};

/**
 * Load saved customizations for a property
 */
export const loadCustomization = (propertyId: string): SavedCustomization | null => {
    try {
        const key = `marketing_kit_${propertyId}`;
        const saved = localStorage.getItem(key);

        if (!saved) return null;

        return JSON.parse(saved);
    } catch (error) {
        console.error('Failed to load customization:', error);
        return null;
    }
};

/**
 * Clear saved customizations for a property
 */
export const clearCustomization = (propertyId: string): void => {
    try {
        const key = `marketing_kit_${propertyId}`;
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Failed to clear customization:', error);
    }
};
