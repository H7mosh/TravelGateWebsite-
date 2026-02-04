// Section Visibility Utility
// Checks which sections should be visible on the frontend

// Get API base URL (same pattern as other frontend files)
function getApiBaseUrl() {
    // Try to get from API_CONFIG first
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL) {
        return API_CONFIG.BASE_URL;
    }
    // Try window.API_BASE_URL
    if (typeof window !== 'undefined' && window.API_BASE_URL) {
        return window.API_BASE_URL;
    }
    // Default fallback
    return "https://api.travelgate.co/api";
}

// Initialize with undefined to force API check (don't default to true)
let sectionVisibility = {
    Hotels: undefined,  // Will be set by API
    Packages: undefined,
    Groups: undefined,
    GroupPrograms: undefined,
    Transfers: undefined,
    Flights: undefined
};

// Load section visibility from API
async function loadSectionVisibility() {
    try {
        // Get API base URL - use API_CONFIG if available, otherwise construct directly
        let apiBaseUrl;
        if (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL) {
            apiBaseUrl = API_CONFIG.BASE_URL;
        } else {
            // Fallback: construct directly
            apiBaseUrl = "https://api.travelgate.co/api";
        }
        
        console.log('[Section Visibility] Using API base URL:', apiBaseUrl);
        
        // Construct the full URL - API_CONFIG.BASE_URL already includes /api
        const apiUrl = `${apiBaseUrl}/settings/section-visibility`;
        console.log('[Section Visibility] Full API URL:', apiUrl);
        console.log('[Section Visibility] Fetching from:', apiUrl);
        console.log('[Section Visibility] Current sectionVisibility before API:', sectionVisibility);
        
        const response = await fetch(apiUrl);
        console.log('[Section Visibility] Response status:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('[Section Visibility] API Response (raw):', data);
            console.log('[Section Visibility] API Response (stringified):', JSON.stringify(data));
            console.log('[Section Visibility] Hotels value from API:', data.Hotels, 'Type:', typeof data.Hotels);
            console.log('[Section Visibility] Hotels === false?', data.Hotels === false);
            console.log('[Section Visibility] Hotels === "false"?', data.Hotels === "false");
            
            // Parse correctly - only hide if explicitly false
            // The API returns boolean values: true or false
            // We want: false = hidden, true/undefined = visible
            // IMPORTANT: Check for both boolean false and string "false"
            const parseBool = (value) => {
                if (value === false || value === "false" || value === "False") {
                    return false;
                }
                return true; // Default to visible
            };
            
            sectionVisibility = {
                Hotels: parseBool(data.Hotels),
                Packages: parseBool(data.Packages),
                Groups: parseBool(data.Groups),
                GroupPrograms: parseBool(data.GroupPrograms),
                Transfers: parseBool(data.Transfers),
                Flights: parseBool(data.Flights)
            };
            
            // Debug: Log each value in detail
            console.log('[Section Visibility] Raw API values:', {
                Hotels: data.Hotels,
                HotelsType: typeof data.Hotels,
                HotelsIsFalse: data.Hotels === false,
                HotelsIsTrue: data.Hotels === true,
                HotelsParsed: sectionVisibility.Hotels
            });
            console.log('[Section Visibility] Parsed visibility:', sectionVisibility);
            console.log('[Section Visibility] Hotels will be:', sectionVisibility.Hotels ? 'VISIBLE' : 'HIDDEN');
            
            // Double-check: if API says false, we must hide
            if (data.Hotels === false && sectionVisibility.Hotels !== false) {
                console.error('[Section Visibility] ERROR: API returned false but parsed as true! Fixing...');
                sectionVisibility.Hotels = false;
            }
            
            // Update global object
            if (typeof window !== 'undefined') {
                window.sectionVisibility = sectionVisibility;
            }
        } else {
            console.warn('[Section Visibility] Failed to load (status:', response.status, '), using defaults (all visible)');
            const errorText = await response.text().catch(() => '');
            console.warn('[Section Visibility] Error response:', errorText);
            // On error, default to all visible (but log the error)
            console.warn('[Section Visibility] API call failed, defaulting all sections to visible');
            sectionVisibility = {
                Hotels: true,
                Packages: true,
                Groups: true,
                GroupPrograms: true,
                Transfers: true,
                Flights: true
            };
            if (typeof window !== 'undefined') {
                window.sectionVisibility = sectionVisibility;
            }
            // Apply defaults
            applySectionVisibility();
        }
    } catch (error) {
        console.error('[Section Visibility] Error loading visibility:', error);
        console.error('[Section Visibility] Error details:', error.message, error.stack);
        // Default to all visible if API fails
    }
    
    // Only apply if we got valid data from API
    if (sectionVisibility.Hotels !== undefined) {
        console.log('[Section Visibility] API data loaded, applying visibility...');
        // Apply visibility after loading
        applySectionVisibility();
        
        // Prevent loading of hidden sections
        preventLoadingHiddenSections();
        
        // Re-apply after a short delay to catch any late-loading elements
        setTimeout(() => {
            console.log('[Section Visibility] Re-applying visibility after delay');
            applySectionVisibility();
        }, 500);
    } else {
        console.warn('[Section Visibility] No valid data from API, visibility not applied');
    }
    
    // Also re-apply when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(applySectionVisibility, 100);
        });
    }
    
    // Return promise for chaining
    return Promise.resolve();
}

// Apply section visibility to the page
function applySectionVisibility() {
    console.log('[Section Visibility] Applying visibility:', sectionVisibility);
    
    // Hotels section
    const hotelsSection = document.getElementById('hotels');
    const hotelsNavLink = document.querySelector('a[href="hotels.html"]');
    const hotelsServiceCard = document.querySelector('a[href="hotels.html"].service-card-link');
    
    // Only hide if explicitly set to false
    console.log('[Section Visibility] Checking Hotels - sectionVisibility.Hotels =', sectionVisibility.Hotels, 'Type:', typeof sectionVisibility.Hotels);
    
    if (sectionVisibility.Hotels === false) {
        console.log('[Section Visibility] ✓ Hiding Hotels section (API returned false)');
        if (hotelsSection) {
            hotelsSection.style.display = 'none';
            hotelsSection.style.visibility = 'hidden';
            hotelsSection.style.height = '0';
            hotelsSection.style.overflow = 'hidden';
            hotelsSection.style.margin = '0';
            hotelsSection.style.padding = '0';
            hotelsSection.classList.add('hidden-section');
            hotelsSection.setAttribute('data-hidden', 'true');
            
            // Use MutationObserver to prevent it from being shown
            if (!hotelsSection._visibilityObserver) {
                hotelsSection._visibilityObserver = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                            const display = hotelsSection.style.display;
                            if (display !== 'none' && display !== '') {
                                console.log('[Section Visibility] Detected attempt to show Hotels section, hiding again');
                                hotelsSection.style.display = 'none';
                                hotelsSection.style.visibility = 'hidden';
                                hotelsSection.classList.add('hidden-section');
                            }
                        }
                    });
                });
                hotelsSection._visibilityObserver.observe(hotelsSection, {
                    attributes: true,
                    attributeFilter: ['style', 'class']
                });
            }
        }
        if (hotelsNavLink) {
            hotelsNavLink.style.display = 'none';
        }
        if (hotelsServiceCard) {
            hotelsServiceCard.style.display = 'none';
        }
        // Also hide the parent service card if it exists
        const hotelsServiceCardParent = hotelsServiceCard?.closest('.service-card');
        if (hotelsServiceCardParent) {
            hotelsServiceCardParent.style.display = 'none';
        }
    } else {
        // Show Hotels section (default or explicitly true)
        console.log('[Section Visibility] Showing Hotels section (visible:', sectionVisibility.Hotels, ')');
        if (hotelsSection) {
            hotelsSection.style.display = '';
            hotelsSection.style.visibility = '';
            hotelsSection.style.height = '';
            hotelsSection.style.overflow = '';
            hotelsSection.style.margin = '';
            hotelsSection.style.padding = '';
            hotelsSection.classList.remove('hidden-section');
            hotelsSection.removeAttribute('data-hidden');
            hotelsSection.removeAttribute('data-visibility-pending'); // Remove pending attribute when showing
            
            // Disconnect observer if it exists
            if (hotelsSection._visibilityObserver) {
                hotelsSection._visibilityObserver.disconnect();
                hotelsSection._visibilityObserver = null;
            }
        }
        if (hotelsNavLink) hotelsNavLink.style.display = '';
        if (hotelsServiceCard) hotelsServiceCard.style.display = '';
    }
    
    // Packages section
    const packagesSection = document.getElementById('packages');
    const packagesNavLink = document.querySelector('a[href="#packages"]');
    
    if (sectionVisibility.Packages === false) {
        if (packagesSection) {
            packagesSection.style.display = 'none';
            packagesSection.classList.add('hidden-section');
        }
        if (packagesNavLink) packagesNavLink.style.display = 'none';
    } else {
        if (packagesSection) {
            packagesSection.style.display = '';
            packagesSection.classList.remove('hidden-section');
        }
        if (packagesNavLink) packagesNavLink.style.display = '';
    }
    
    // Groups section
    const groupsSection = document.getElementById('groups');
    const groupsNavLink = document.querySelector('a[href="groups.html"]');
    const groupsServiceCard = document.querySelector('a[href="groups.html"].service-card-link');
    
    if (sectionVisibility.Groups === false) {
        if (groupsSection) {
            groupsSection.style.display = 'none';
            groupsSection.classList.add('hidden-section');
        }
        if (groupsNavLink) groupsNavLink.style.display = 'none';
        if (groupsServiceCard) groupsServiceCard.style.display = 'none';
    } else {
        if (groupsSection) {
            groupsSection.style.display = '';
            groupsSection.classList.remove('hidden-section');
        }
        if (groupsNavLink) groupsNavLink.style.display = '';
        if (groupsServiceCard) groupsServiceCard.style.display = '';
    }
    
    // Group Programs section
    const groupProgramsSection = document.getElementById('group-programs');
    const groupProgramsNavLink = document.querySelector('a[href="group-programs.html"]');
    
    if (sectionVisibility.GroupPrograms === false) {
        if (groupProgramsSection) {
            groupProgramsSection.style.display = 'none';
            groupProgramsSection.classList.add('hidden-section');
        }
        if (groupProgramsNavLink) groupProgramsNavLink.style.display = 'none';
    } else {
        if (groupProgramsSection) {
            groupProgramsSection.style.display = '';
            groupProgramsSection.classList.remove('hidden-section');
        }
        if (groupProgramsNavLink) groupProgramsNavLink.style.display = '';
    }
    
    // Transfers section
    const transfersSection = document.getElementById('transfers');
    const transfersNavLink = document.querySelector('a[href="transfers.html"]');
    const transfersServiceCard = document.querySelector('a[href="transfers.html"].service-card-link');
    
    if (sectionVisibility.Transfers === false) {
        if (transfersSection) {
            transfersSection.style.display = 'none';
            transfersSection.classList.add('hidden-section');
        }
        if (transfersNavLink) transfersNavLink.style.display = 'none';
        if (transfersServiceCard) transfersServiceCard.style.display = 'none';
    } else {
        if (transfersSection) {
            transfersSection.style.display = '';
            transfersSection.classList.remove('hidden-section');
        }
        if (transfersNavLink) transfersNavLink.style.display = '';
        if (transfersServiceCard) transfersServiceCard.style.display = '';
    }
    
    // Flights section
    const flightsSection = document.getElementById('flights');
    const flightsNavLink = document.querySelector('a[href="flights.html"]');
    const flightsServiceCard = document.querySelector('a[href="flights.html"].service-card-link');
    
    if (sectionVisibility.Flights === false) {
        if (flightsSection) {
            flightsSection.style.display = 'none';
            flightsSection.classList.add('hidden-section');
        }
        if (flightsNavLink) flightsNavLink.style.display = 'none';
        if (flightsServiceCard) flightsServiceCard.style.display = 'none';
    } else {
        if (flightsSection) {
            flightsSection.style.display = '';
            flightsSection.classList.remove('hidden-section');
        }
        if (flightsNavLink) flightsNavLink.style.display = '';
        if (flightsServiceCard) flightsServiceCard.style.display = '';
    }
    
    console.log('[Section Visibility] Applied visibility settings');
}

// Prevent loading of hidden sections
function preventLoadingHiddenSections() {
    // Prevent hotels from loading if hidden (only if explicitly false)
    if (sectionVisibility.Hotels === false) {
        const hotelsSection = document.getElementById('hotels');
        if (hotelsSection) {
            hotelsSection.style.display = 'none';
        }
        // Stop hotel loading if it hasn't started yet
        if (typeof window.loadHotels === 'function') {
            const originalLoadHotels = window.loadHotels;
            window.loadHotels = function() {
                console.log('[Section Visibility] Hotels section is hidden, skipping load');
                return;
            };
        }
    }
    
    // Prevent packages from loading if hidden (only if explicitly false)
    if (sectionVisibility.Packages === false) {
        const packagesSection = document.getElementById('packages');
        if (packagesSection) {
            packagesSection.style.display = 'none';
        }
    }
    
    // Prevent groups from loading if hidden (only if explicitly false)
    if (sectionVisibility.Groups === false) {
        const groupsSection = document.getElementById('groups');
        if (groupsSection) {
            groupsSection.style.display = 'none';
        }
    }
    
    // Prevent group programs from loading if hidden (only if explicitly false)
    if (sectionVisibility.GroupPrograms === false) {
        const groupProgramsSection = document.getElementById('group-programs');
        if (groupProgramsSection) {
            groupProgramsSection.style.display = 'none';
        }
    }
    
    // Prevent transfers from loading if hidden (only if explicitly false)
    if (sectionVisibility.Transfers === false) {
        const transfersSection = document.getElementById('transfers');
        if (transfersSection) {
            transfersSection.style.display = 'none';
        }
    }
    
    // Prevent flights from loading if hidden (only if explicitly false)
    if (sectionVisibility.Flights === false) {
        const flightsSection = document.getElementById('flights');
        if (flightsSection) {
            flightsSection.style.display = 'none';
        }
    }
}

// Check if a section is visible
function isSectionVisible(sectionName) {
    return sectionVisibility[sectionName] !== false;
}

// Global flag to track if visibility has been loaded
let sectionVisibilityLoaded = false;
let sectionVisibilityPromise = null;

// Initialize on page load - load visibility FIRST before other scripts
(function() {
    // Load visibility immediately, synchronously if possible
    console.log('[Section Visibility] Initializing...');
    console.log('[Section Visibility] Document ready state:', document.readyState);
    
    // Don't hide by default - wait for API to tell us what to hide
    // This prevents hiding everything if API fails
    
    // Create a promise that resolves when visibility is loaded
    sectionVisibilityPromise = new Promise((resolve) => {
        function loadAndResolve() {
            loadSectionVisibility().then(() => {
                sectionVisibilityLoaded = true;
                console.log('[Section Visibility] ✓ Visibility loaded and applied');
                resolve();
            }).catch((error) => {
                console.error('[Section Visibility] Error loading:', error);
                sectionVisibilityLoaded = true; // Mark as loaded even on error
                resolve(); // Resolve anyway so other scripts can continue
            });
        }
        
        // Load visibility as soon as possible
        if (document.readyState === 'loading') {
            // DOM still loading, wait for it
            document.addEventListener('DOMContentLoaded', function() {
                console.log('[Section Visibility] DOM loaded, loading visibility...');
                loadAndResolve();
            });
        } else {
            // DOM already loaded, load visibility immediately
            console.log('[Section Visibility] DOM already loaded, loading visibility immediately...');
            // Small delay to ensure DOM is fully ready
            setTimeout(() => {
                loadAndResolve();
            }, 50);
        }
    });
    
    // Make functions globally available
    window.sectionVisibility = sectionVisibility;
    window.isSectionVisible = function(sectionName) {
        if (typeof sectionVisibility === 'undefined') {
            return true; // Default to visible if not loaded yet
        }
        // Only hide if explicitly false, otherwise show (default to visible)
        return sectionVisibility[sectionName] !== false;
    };
    
    // Export for debugging
    window.loadSectionVisibility = loadSectionVisibility;
    window.applySectionVisibility = applySectionVisibility;
    window.sectionVisibilityPromise = sectionVisibilityPromise;
    window.waitForSectionVisibility = function(callback) {
        if (sectionVisibilityLoaded) {
            callback();
        } else if (sectionVisibilityPromise) {
            sectionVisibilityPromise.then(callback);
        } else {
            setTimeout(() => window.waitForSectionVisibility(callback), 100);
        }
    };
})();

