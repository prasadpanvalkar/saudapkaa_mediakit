


export const waitForGoogleMaps = (timeoutMs = 10000): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            resolve();
            return;
        }

        if (window.google?.maps) {
            resolve();
            return;
        }

        const interval = setInterval(() => {
            if (window.google?.maps) {
                clearInterval(interval);
                resolve();
            }
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            if (!window.google?.maps) {
                reject(new Error("Google Maps load timeout"));
            }
        }, timeoutMs);
    });
};

// Singleton getters for services
let geocoder: google.maps.Geocoder | null = null;
// let placesService: google.maps.places.PlacesService | null = null;
let sessionToken: google.maps.places.AutocompleteSessionToken | null = null;

export const getGeocoder = async (): Promise<google.maps.Geocoder> => {
    await waitForGoogleMaps();
    if (!geocoder) {
        geocoder = new google.maps.Geocoder();
    }
    return geocoder;
};

// PlacesService requires a map or node, so often created per-component. 
// But AutocompleteService is what we need for search.
let autocompleteService: google.maps.places.AutocompleteService | null = null;

export const getAutocompleteService = async (): Promise<google.maps.places.AutocompleteService> => {
    await waitForGoogleMaps();
    if (!autocompleteService) {
        autocompleteService = new google.maps.places.AutocompleteService();
    }
    return autocompleteService;
};

export const getSessionToken = async (): Promise<google.maps.places.AutocompleteSessionToken> => {
    await waitForGoogleMaps();

    // Additional wait for Places library specifically
    if (!google.maps.places) {
        await new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                if (google.maps.places) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
            // Fallback timeout
            setTimeout(() => { clearInterval(interval); resolve(); }, 3000);
        });
    }

    if (!google.maps.places) {
        // Should ideally handle this more gracefully or retry, but for now log it
        console.warn("Google Maps Places library missing despite wait.");
        throw new Error("Google Maps Places library not loaded");
    }

    if (!sessionToken) {
        sessionToken = new google.maps.places.AutocompleteSessionToken();
    }
    return sessionToken;
};

export const refreshSessionToken = async () => {
    await waitForGoogleMaps();
    sessionToken = new google.maps.places.AutocompleteSessionToken();
    return sessionToken;
};
