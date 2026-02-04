/**
 * Admin Lite - Temporary Data Editor
 * Allows editing JSON data via localStorage
 */

// Data storage
let hotelsData = [];
let groupsData = [];
let transfersData = [];
let originalHotelsData = [];
let originalGroupsData = [];
let originalTransfersData = [];

// Current editing state
let currentSection = 'hotels';

// Removed File System Access API code - not needed for deployed static sites

/**
 * Initialize admin page
 */
async function init() {
    console.log('[Admin] Initializing...');
    updateStorageStatus();
    await loadAllData();
    updateStatsCards();
    renderHotelsTable();
    renderGroupsTable();
    renderTransfersTable();
}

/**
 * Update storage status badge
 */
function updateStorageStatus() {
    const statusEl = document.getElementById('storageStatus');
    if (!statusEl) return;
    
    const hasData = window.dataStorage && window.dataStorage.hasAnyAdminData();
    if (hasData) {
        statusEl.className = 'status-indicator has-data';
        statusEl.innerHTML = '<span class="status-dot"></span><span>Has edited data</span>';
    } else {
        statusEl.className = 'status-indicator no-data';
        statusEl.innerHTML = '<span class="status-dot"></span><span>No edited data</span>';
    }
}

/**
 * Update stats cards
 */
function updateStatsCards() {
    const hotelsCount = document.getElementById('hotelsCount');
    const groupsCount = document.getElementById('groupsCount');
    const transfersCount = document.getElementById('transfersCount');
    
    if (hotelsCount) hotelsCount.textContent = hotelsData.length || 0;
    if (groupsCount) groupsCount.textContent = groupsData.length || 0;
    if (transfersCount) transfersCount.textContent = transfersData.length || 0;
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    const alertArea = document.getElementById('alertArea');
    if (!alertArea) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show alert-custom`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertArea.innerHTML = '';
    alertArea.appendChild(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 300);
        }
    }, 5000);
}

/**
 * Load all data from API
 */
async function loadAllData() {
    try {
        // Load hotels from API
        const hotelsResponse = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.HOTELS));
        if (!hotelsResponse.ok) throw new Error(`Hotels API error: ${hotelsResponse.status}`);
        hotelsData = await hotelsResponse.json();
        originalHotelsData = JSON.parse(JSON.stringify(hotelsData));
        console.log('[Admin] Loaded hotels from API:', hotelsData.length);
        
        // Load groups from API
        const groupsResponse = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GROUPS));
        if (!groupsResponse.ok) throw new Error(`Groups API error: ${groupsResponse.status}`);
        groupsData = await groupsResponse.json();
        originalGroupsData = JSON.parse(JSON.stringify(groupsData));
        console.log('[Admin] Loaded groups from API:', groupsData.length);
        
        // Load transfers from API
        const transfersResponse = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.TRANSFERS));
        if (!transfersResponse.ok) throw new Error(`Transfers API error: ${transfersResponse.status}`);
        transfersData = await transfersResponse.json();
        originalTransfersData = JSON.parse(JSON.stringify(transfersData));
        console.log('[Admin] Loaded transfers from API:', transfersData.length);
        
        // Check if localStorage has edited data
        if (window.dataStorage) {
            const storedHotels = window.dataStorage.getStoredData(window.dataStorage.STORAGE_KEYS.hotels);
            if (storedHotels) {
                hotelsData = storedHotels;
                console.log('[Admin] Using edited hotels from localStorage');
            }
            
            const storedGroups = window.dataStorage.getStoredData(window.dataStorage.STORAGE_KEYS.groups);
            if (storedGroups) {
                groupsData = storedGroups;
                console.log('[Admin] Using edited groups from localStorage');
            }
            
            const storedTransfers = window.dataStorage.getStoredData(window.dataStorage.STORAGE_KEYS.transfers);
            if (storedTransfers) {
                transfersData = storedTransfers;
                console.log('[Admin] Using edited transfers from localStorage');
            }
        }
    } catch (error) {
        console.error('[Admin] Error loading data:', error);
        showAlert('Error loading data. Please refresh the page.', 'danger');
    }
}

/**
 * Show section tab
 */
function showSection(section) {
    // Update sidebar menu items
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    const menuItems = {
        'hotels': document.getElementById('menuHotels'),
        'groups': document.getElementById('menuGroups'),
        'transfers': document.getElementById('menuTransfers')
    };
    if (menuItems[section]) {
        menuItems[section].classList.add('active');
    }
    
    // Update sections
    document.querySelectorAll('.section-tab').forEach(tab => tab.classList.remove('active'));
    const targetSection = document.getElementById(`${section}Section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    currentSection = section;
    
    // Close mobile sidebar
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('mobile-open');
    }
}

/**
 * Render hotels table
 */
function renderHotelsTable() {
    const container = document.getElementById('hotelsTableContainer');
    if (!container) return;
    
    if (!hotelsData.length) {
        container.innerHTML = '<div class="alert alert-info">No hotels data available.</div>';
        return;
    }
    
    let html = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Hotel Name</th>
                        <th>City</th>
                        <th>Country</th>
                        <th>Stars</th>
                        <th>Single Price</th>
                        <th>Double Price</th>
                        <th>Family Price</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    hotelsData.forEach((hotel, index) => {
        html += `
            <tr>
                <td>${hotel.id}</td>
                <td>
                    <input type="text" class="editable-input" 
                           value="${escapeHtml(hotel.name)}" 
                           data-field="name" 
                           data-index="${index}"
                           onchange="updateHotel(${index}, 'name', this.value)">
                </td>
                <td>
                    <input type="text" class="editable-input" 
                           value="${escapeHtml(hotel.city)}" 
                           data-field="city" 
                           data-index="${index}"
                           onchange="updateHotel(${index}, 'city', this.value)">
                </td>
                <td>
                    <input type="text" class="editable-input" 
                           value="${escapeHtml(hotel.country)}" 
                           data-field="country" 
                           data-index="${index}"
                           onchange="updateHotel(${index}, 'country', this.value)">
                </td>
                <td>
                    <input type="number" class="editable-input" 
                           value="${hotel.stars}" 
                           min="1" max="5" step="0.5"
                           data-field="stars" 
                           data-index="${index}"
                           onchange="updateHotel(${index}, 'stars', parseFloat(this.value))">
                </td>
                <td>
                    <input type="number" class="editable-input" 
                           value="${hotel.prices.single}" 
                           min="0" step="1000"
                           data-field="price-single" 
                           data-index="${index}"
                           onchange="updateHotelPrice(${index}, 'single', parseInt(this.value))">
                </td>
                <td>
                    <input type="number" class="editable-input" 
                           value="${hotel.prices.double}" 
                           min="0" step="1000"
                           data-field="price-double" 
                           data-index="${index}"
                           onchange="updateHotelPrice(${index}, 'double', parseInt(this.value))">
                </td>
                <td>
                    <input type="number" class="editable-input" 
                           value="${hotel.prices.family}" 
                           min="0" step="1000"
                           data-field="price-family" 
                           data-index="${index}"
                           onchange="updateHotelPrice(${index}, 'family', parseInt(this.value))">
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
    updateStatsCards();
}

/**
 * Update hotel field
 */
function updateHotel(index, field, value) {
    if (index >= 0 && index < hotelsData.length) {
        hotelsData[index][field] = value;
        console.log(`[Admin] Updated hotel ${index}.${field} = ${value}`);
    }
}

/**
 * Update hotel price
 */
function updateHotelPrice(index, priceType, value) {
    if (index >= 0 && index < hotelsData.length && hotelsData[index].prices) {
        hotelsData[index].prices[priceType] = value;
        console.log(`[Admin] Updated hotel ${index}.prices.${priceType} = ${value}`);
    }
}

/**
 * Render groups table
 */
function renderGroupsTable() {
    const container = document.getElementById('groupsTableContainer');
    if (!container || !groupsData.length) return;
    
    let html = '<div class="accordion" id="groupsAccordion">';
    
    groupsData.forEach((group, groupIndex) => {
        const accordionId = `group-${group.id}`;
        html += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading-${group.id}">
                    <button class="accordion-button ${groupIndex === 0 ? '' : 'collapsed'}" 
                            type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target="#${accordionId}"
                            aria-expanded="${groupIndex === 0 ? 'true' : 'false'}">
                        <strong>${escapeHtml(group.name)}</strong> - ${escapeHtml(group.destination)}, ${escapeHtml(group.country)}
                    </button>
                </h2>
                <div id="${accordionId}" 
                     class="accordion-collapse collapse ${groupIndex === 0 ? 'show' : ''}" 
                     data-bs-parent="#groupsAccordion">
                    <div class="accordion-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label>Group Name:</label>
                                <input type="text" class="form-control" 
                                       value="${escapeHtml(group.name)}" 
                                       onchange="updateGroup(${groupIndex}, 'name', this.value)">
                            </div>
                            <div class="col-md-3">
                                <label>Destination:</label>
                                <input type="text" class="form-control" 
                                       value="${escapeHtml(group.destination)}" 
                                       onchange="updateGroup(${groupIndex}, 'destination', this.value)">
                            </div>
                            <div class="col-md-3">
                                <label>Country:</label>
                                <input type="text" class="form-control" 
                                       value="${escapeHtml(group.country)}" 
                                       onchange="updateGroup(${groupIndex}, 'country', this.value)">
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label>Validity From:</label>
                                <input type="date" class="form-control" 
                                       value="${group.validityDates?.from || ''}" 
                                       onchange="updateGroupValidityDate(${groupIndex}, 'from', this.value)">
                            </div>
                            <div class="col-md-6">
                                <label>Validity To:</label>
                                <input type="date" class="form-control" 
                                       value="${group.validityDates?.to || ''}" 
                                       onchange="updateGroupValidityDate(${groupIndex}, 'to', this.value)">
                            </div>
                        </div>
                        <hr>
                        <h5>Hotels in this Group:</h5>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Hotel Name</th>
                                        <th>Stars</th>
                                        <th>Double</th>
                                        <th>Triple</th>
                                        <th>Single</th>
                                        <th>Child w/Bed</th>
                                        <th>Child w/o Bed</th>
                                        <th>Infant</th>
                                    </tr>
                                </thead>
                                <tbody>
        `;
        
        if (group.hotels && group.hotels.length > 0) {
            group.hotels.forEach((hotel, hotelIndex) => {
                html += `
                    <tr>
                        <td>
                            <input type="text" class="form-control form-control-sm" 
                                   value="${escapeHtml(hotel.name)}" 
                                   onchange="updateGroupHotel(${groupIndex}, ${hotelIndex}, 'name', this.value)">
                        </td>
                        <td>
                            <input type="number" class="form-control form-control-sm" 
                                   value="${hotel.stars}" 
                                   min="1" max="5" step="0.5"
                                   onchange="updateGroupHotel(${groupIndex}, ${hotelIndex}, 'stars', parseFloat(this.value))">
                        </td>
                        <td>
                            <input type="number" class="form-control form-control-sm" 
                                   value="${hotel.prices?.double || 0}" 
                                   min="0"
                                   onchange="updateGroupHotelPrice(${groupIndex}, ${hotelIndex}, 'double', parseInt(this.value))">
                        </td>
                        <td>
                            <input type="number" class="form-control form-control-sm" 
                                   value="${hotel.prices?.triple || 0}" 
                                   min="0"
                                   onchange="updateGroupHotelPrice(${groupIndex}, ${hotelIndex}, 'triple', parseInt(this.value))">
                        </td>
                        <td>
                            <input type="number" class="form-control form-control-sm" 
                                   value="${hotel.prices?.single || 0}" 
                                   min="0"
                                   onchange="updateGroupHotelPrice(${groupIndex}, ${hotelIndex}, 'single', parseInt(this.value))">
                        </td>
                        <td>
                            <input type="number" class="form-control form-control-sm" 
                                   value="${hotel.prices?.childWithBed || 0}" 
                                   min="0"
                                   onchange="updateGroupHotelPrice(${groupIndex}, ${hotelIndex}, 'childWithBed', parseInt(this.value))">
                        </td>
                        <td>
                            <input type="number" class="form-control form-control-sm" 
                                   value="${hotel.prices?.childWithoutBed || 0}" 
                                   min="0"
                                   onchange="updateGroupHotelPrice(${groupIndex}, ${hotelIndex}, 'childWithoutBed', parseInt(this.value))">
                        </td>
                        <td>
                            <input type="number" class="form-control form-control-sm" 
                                   value="${hotel.prices?.infant || 0}" 
                                   min="0"
                                   onchange="updateGroupHotelPrice(${groupIndex}, ${hotelIndex}, 'infant', parseInt(this.value))">
                        </td>
                    </tr>
                `;
            });
        }
        
        html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    updateStatsCards();
}

/**
 * Update group field
 */
function updateGroup(index, field, value) {
    if (index >= 0 && index < groupsData.length) {
        groupsData[index][field] = value;
        console.log(`[Admin] Updated group ${index}.${field} = ${value}`);
    }
}

/**
 * Update group validity date
 */
function updateGroupValidityDate(index, dateType, value) {
    if (index >= 0 && index < groupsData.length) {
        if (!groupsData[index].validityDates) {
            groupsData[index].validityDates = {};
        }
        groupsData[index].validityDates[dateType] = value;
        console.log(`[Admin] Updated group ${index}.validityDates.${dateType} = ${value}`);
    }
}

/**
 * Update group hotel field
 */
function updateGroupHotel(groupIndex, hotelIndex, field, value) {
    if (groupIndex >= 0 && groupIndex < groupsData.length &&
        groupsData[groupIndex].hotels &&
        hotelIndex >= 0 && hotelIndex < groupsData[groupIndex].hotels.length) {
        groupsData[groupIndex].hotels[hotelIndex][field] = value;
        console.log(`[Admin] Updated group ${groupIndex}.hotels[${hotelIndex}].${field} = ${value}`);
    }
}

/**
 * Update group hotel price
 */
function updateGroupHotelPrice(groupIndex, hotelIndex, priceType, value) {
    if (groupIndex >= 0 && groupIndex < groupsData.length &&
        groupsData[groupIndex].hotels &&
        hotelIndex >= 0 && hotelIndex < groupsData[groupIndex].hotels.length) {
        if (!groupsData[groupIndex].hotels[hotelIndex].prices) {
            groupsData[groupIndex].hotels[hotelIndex].prices = {};
        }
        groupsData[groupIndex].hotels[hotelIndex].prices[priceType] = value;
        console.log(`[Admin] Updated group ${groupIndex}.hotels[${hotelIndex}].prices.${priceType} = ${value}`);
    }
}

/**
 * Render transfers table
 */
function renderTransfersTable() {
    const container = document.getElementById('transfersTableContainer');
    if (!container) return;
    
    if (!transfersData.length) {
        container.innerHTML = '<div class="alert alert-info">No transfers data available.</div>';
        return;
    }
    
    let html = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Route</th>
                        <th>Service Type</th>
                        <th>Trip Type</th>
                        <th>Price (IQD)</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    transfersData.forEach((transfer, index) => {
        html += `
            <tr>
                <td>${transfer.id}</td>
                <td>
                    <input type="text" class="editable-input" 
                           value="${escapeHtml(transfer.route)}" 
                           data-field="route" 
                           data-index="${index}"
                           onchange="updateTransfer(${index}, 'route', this.value)">
                </td>
                <td>
                    <input type="text" class="editable-input" 
                           value="${escapeHtml(transfer.serviceType)}" 
                           data-field="serviceType" 
                           data-index="${index}"
                           onchange="updateTransfer(${index}, 'serviceType', this.value)">
                </td>
                <td>
                    <select class="editable-input" 
                            data-field="tripType" 
                            data-index="${index}"
                            onchange="updateTransfer(${index}, 'tripType', this.value)">
                        <option value="one-way" ${transfer.tripType === 'one-way' ? 'selected' : ''}>One-way</option>
                        <option value="round-trip" ${transfer.tripType === 'round-trip' ? 'selected' : ''}>Round-trip</option>
                    </select>
                </td>
                <td>
                    <input type="number" class="editable-input" 
                           value="${transfer.price}" 
                           min="0" step="1000"
                           data-field="price" 
                           data-index="${index}"
                           onchange="updateTransfer(${index}, 'price', parseInt(this.value))">
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
    updateStatsCards();
}

/**
 * Update transfer field
 */
function updateTransfer(index, field, value) {
    if (index >= 0 && index < transfersData.length) {
        transfersData[index][field] = value;
        console.log(`[Admin] Updated transfer ${index}.${field} = ${value}`);
    }
}

/**
 * Save all changes to localStorage
 */
function saveAllChanges() {
    if (!window.dataStorage) {
        showAlert('Data storage utility not available.', 'danger');
        return;
    }
    
    try {
        // Save to localStorage
        window.dataStorage.setStoredData(window.dataStorage.STORAGE_KEYS.hotels, hotelsData);
        window.dataStorage.setStoredData(window.dataStorage.STORAGE_KEYS.groups, groupsData);
        window.dataStorage.setStoredData(window.dataStorage.STORAGE_KEYS.transfers, transfersData);
        
        updateStorageStatus();
        updateStatsCards();
        
        showAlert('✅ All changes saved! Your edits are now automatically active on the website - no manual steps needed!', 'success');
    } catch (error) {
        console.error('[Admin] Error saving data:', error);
        showAlert('Error saving data. ' + error.message, 'danger');
    }
}


/**
 * Export all JSON files (fallback - downloads files)
 */
function exportAllJSON() {
    // Export hotels.json
    downloadJSON(hotelsData, 'hotels.json');
    
    // Small delay between downloads to avoid browser blocking
    setTimeout(() => {
        // Export group.json (matching original filename)
        downloadJSON(groupsData, 'group.json');
    }, 200);
    
    setTimeout(() => {
        // Export transfers.json
        downloadJSON(transfersData, 'transfers.json');
    }, 400);
}

/**
 * Download JSON file
 */
function downloadJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}

/**
 * Clear all stored data
 */
function clearAllData() {
    if (!confirm('Are you sure you want to clear all stored data? This cannot be undone.')) {
        return;
    }
    
    if (window.dataStorage) {
        window.dataStorage.clearAllAdminData();
        
        // Reload original data
        hotelsData = JSON.parse(JSON.stringify(originalHotelsData));
        groupsData = JSON.parse(JSON.stringify(originalGroupsData));
        transfersData = JSON.parse(JSON.stringify(originalTransfersData));
        
        // Re-render tables
        renderHotelsTable();
        renderGroupsTable();
        renderTransfersTable();
        
        updateStorageStatus();
        updateStatsCards();
        showAlert('All stored data cleared. Using original JSON data.', 'info');
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export functions to window for inline event handlers
window.showSection = showSection;
window.updateHotel = updateHotel;
window.updateHotelPrice = updateHotelPrice;
window.updateGroup = updateGroup;
window.updateGroupValidityDate = updateGroupValidityDate;
window.updateGroupHotel = updateGroupHotel;
window.updateGroupHotelPrice = updateGroupHotelPrice;
window.updateTransfer = updateTransfer;
window.saveAllChanges = saveAllChanges;
window.clearAllData = clearAllData;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Admin] DOM loaded, initializing...');
    init();
});
