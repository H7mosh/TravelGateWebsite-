const API_CONFIG = {
    BASE_URL: 'https://api.travelgate.co/api',
    
    ENDPOINTS: {
        HOTELS: '/hotels',
        GROUPS: '/groups',
        GROUP_PROGRAMS: '/groupprograms',
        TRANSFERS: '/transfers',
        FLIGHT_PACKAGES: '/flightpackages',
        PACKAGES: '/packages',
        RESERVATIONS: '/reservations',
        SETTINGS: '/settings',
        CHECK_LIMIT: '/payment/check-reservation-limit',
        PAYMENT_EVENTS_BY_PAYMENT_ID: '/payment/events',
        PAYMENT_EVENTS_BY_INVOICE_ID: '/payment/invoice',
        VOUCHER_INQUIRY: '/voucher-inquiry',
        AUTH: '/auth',
        USERS: '/users'
    },
    
    getUrl(endpoint) {
        return `${this.BASE_URL}${endpoint}`;
    }
};

window.API_CONFIG = API_CONFIG;

