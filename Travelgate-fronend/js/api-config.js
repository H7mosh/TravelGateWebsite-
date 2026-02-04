/**
 * API Configuration
 * Centralized configuration for API endpoints
 */
const API_CONFIG = {
    // Base URL for the API
    BASE_URL: 'https://api.travelgate.co/api',
    
    // API Endpoints
    ENDPOINTS: {
        HOTELS: '/hotels',
        GROUPS: '/groups',
        GROUP_PROGRAMS: '/GroupPrograms',  // Controller name: GroupProgramsController
        TRANSFERS: '/transfers',
        FLIGHT_PACKAGES: '/flightpackages',
        RESERVATIONS: '/reservations',
        RESERVATIONS_BY_VOUCHER: '/reservations/by-voucher',
        VOUCHER_INQUIRY_SEND: '/voucher-inquiry/send'
    },
    
    /**
     * Get full URL for an endpoint
     * @param {string} endpoint - The endpoint path
     * @returns {string} Full URL
     */
    getUrl(endpoint) {
        return `${this.BASE_URL}${endpoint}`;
    }
};

