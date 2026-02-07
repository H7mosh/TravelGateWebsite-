/**
 * API Configuration
 * Centralized configuration for API endpoints and contact info
 */
const API_CONFIG = {
    // Base URL for the API
    BASE_URL: 'https://api.travelgate.co/api',

    // Company contact phone - used wherever phone is displayed on the website
    CONTACT_PHONE: '07504575459',
    CONTACT_PHONE_DISPLAY: '+964 750 457 5459',
    CONTACT_PHONE_TEL: '+9647504575459',
    CONTACT_PHONE_WHATSAPP: '9647504575459',
    
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

