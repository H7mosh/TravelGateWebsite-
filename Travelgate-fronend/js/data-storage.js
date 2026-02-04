/**
 * Data Storage Utility
 * Handles localStorage operations for admin-edited data
 * This is a temporary solution until a real dashboard is implemented
 */

const STORAGE_KEYS = {
    hotels: 'admin_hotels_data',
    groups: 'admin_groups_data',
    transfers: 'admin_transfers_data'
};

/**
 * Get stored data from localStorage
 * @param {string} key - Storage key (use STORAGE_KEYS constants)
 * @returns {any|null} Parsed data or null if not found
 */
function getStoredData(key) {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error(`[DataStorage] Error reading ${key}:`, error);
    }
    return null;
}

/**
 * Save data to localStorage
 * @param {string} key - Storage key (use STORAGE_KEYS constants)
 * @param {any} data - Data to store (will be JSON stringified)
 */
function setStoredData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`[DataStorage] Saved data to ${key}`);
    } catch (error) {
        console.error(`[DataStorage] Error saving ${key}:`, error);
        throw error;
    }
}

/**
 * Clear stored data from localStorage
 * @param {string} key - Storage key (use STORAGE_KEYS constants)
 */
function clearStoredData(key) {
    try {
        localStorage.removeItem(key);
        console.log(`[DataStorage] Cleared data from ${key}`);
    } catch (error) {
        console.error(`[DataStorage] Error clearing ${key}:`, error);
    }
}

/**
 * Check if stored data exists
 * @param {string} key - Storage key (use STORAGE_KEYS constants)
 * @returns {boolean} True if data exists
 */
function hasStoredData(key) {
    return localStorage.getItem(key) !== null;
}

/**
 * Clear all admin data from localStorage
 */
function clearAllAdminData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        clearStoredData(key);
    });
    console.log('[DataStorage] Cleared all admin data');
}

/**
 * Check if any admin data exists
 * @returns {boolean} True if any admin data exists
 */
function hasAnyAdminData() {
    return Object.values(STORAGE_KEYS).some(key => hasStoredData(key));
}

// Export to window for global access
window.dataStorage = {
    getStoredData,
    setStoredData,
    clearStoredData,
    hasStoredData,
    clearAllAdminData,
    hasAnyAdminData,
    STORAGE_KEYS
};
