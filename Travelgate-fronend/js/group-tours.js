/**
 * Group Tours System
 * Handles loading and displaying group tour packages from group.json
 */

console.log('=== GROUP TOURS SCRIPT LOADED ===');

// Groups data storage
let groupsData = [];
let selectedGroup = null;
let selectedGroupHotel = null;
let selectedGroupRoomType = null;

console.log('=== GROUP TOURS VARIABLES INITIALIZED ===');

// ===========================
// Utility Functions
// ===========================

// Format currency (IQD)
function formatIQD(value) {
    if (!value) return 'N/A';
    return Number(value).toLocaleString('en-US') + ' IQD';
}

// Render stars
function renderStars(count) {
    if (!count) return '';
    const fullStars = Math.floor(count);
    const halfStar = count % 1 >= 0.5;
    let stars = '⭐'.repeat(fullStars);
    if (halfStar) stars += '½';
    return stars;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return dateString;
    }
}

// Get minimum price from hotels
function getMinPrice(group) {
    if (!group.hotels || group.hotels.length === 0) return null;
    
    let minPrice = Infinity;
    group.hotels.forEach(hotel => {
        if (hotel.prices) {
            const prices = Object.values(hotel.prices).filter(p => p && p > 0);
            if (prices.length > 0) {
                const hotelMin = Math.min(...prices);
                if (hotelMin < minPrice) minPrice = hotelMin;
            }
        }
    });
    
    return minPrice === Infinity ? null : minPrice;
}

// ===========================
// Group Card Building
// ===========================

function buildGroupCard(group) {
    const minPrice = getMinPrice(group);
    const priceText = minPrice ? `starts at ${formatIQD(minPrice)}` : 'Contact for pricing';
    
    // Generate a rating (you can add this to your JSON data later)
    const rating = '4.8';
    const reviewCount = Math.floor(Math.random() * 500) + 100; // Random for now
    
    return `
        <div class="col-md-6 col-xl-4">
            <div class="group-card h-100" data-group-id="${group.id}" onclick="openGroupDetailsModal(${group.id})">
                <div class="group-card-image">
                    <img src="${group.image}" alt="${group.name}" loading="lazy" onerror="this.src='assets/images/logo.svg'">
                </div>
                <div class="group-price-badge">${priceText}</div>
                <div class="group-card-content">
                    <h4 class="group-name">${group.name}</h4>
                    <div class="group-meta">
                        <div class="group-rating">
                            <i class="bi bi-star-fill"></i>
                            <span>${rating} (${reviewCount.toLocaleString()})</span>
                        </div>
                    </div>
                    <p class="group-location">
                        <i class="bi bi-geo-alt-fill"></i>
                        ${group.destination}, ${group.country}
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Render all groups (renamed to avoid collision with i18n.js) with optional limit for homepage
function renderGroupTours(groups, limit = null) {
    console.log('[Group Tours] renderGroupTours called with:', groups);
    const container = document.getElementById('groups-list');
    console.log('[Group Tours] Container:', container);
    
    if (!container) {
        console.error('[Group Tours] groups-list container not found in DOM!');
        return;
    }
    
    // Validate groups data
    if (!groups || !Array.isArray(groups) || groups.length === 0) {
        console.warn('[Group Tours] No groups data provided or empty array');
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">
                    <p>No group tours available at the moment.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Change container to use row layout like hotels
    if (!container.classList.contains('row')) {
        container.className = 'row g-4';
    }
    
    // Limit groups if specified (for homepage)
    const groupsToShow = limit ? groups.slice(0, limit) : groups;
    
    console.log('[Group Tours] Building HTML for', groupsToShow.length, 'groups');
    let html = '';
    groupsToShow.forEach((group, index) => {
        const cardHtml = buildGroupCard(group);
        console.log(`[Group Tours] Built card ${index + 1}:`, cardHtml.substring(0, 100) + '...');
        html += cardHtml;
    });
    
    console.log('[Group Tours] Total HTML length:', html.length);
    console.log('[Group Tours] Setting innerHTML...');
    container.innerHTML = html;
    
    // Verify cards were added
    const renderedCards = container.querySelectorAll('.group-card');
    console.log('[Group Tours] ✓ Rendered', renderedCards.length, 'group cards in DOM');
    console.log('[Group Tours] Container innerHTML length:', container.innerHTML.length);
    console.log('[Group Tours] Container children count:', container.children.length);
}

// Load groups from JSON file
async function loadGroups() {
    console.log('[Group Tours] loadGroups() called');
    console.log('[Group Tours] Current URL:', window.location.href);
    console.log('[Group Tours] Pathname:', window.location.pathname);
    console.log('[Group Tours] Protocol:', window.location.protocol);
    
    const container = document.getElementById('groups-list');
    if (!container) {
        console.error('[Group Tours] Container #groups-list not found!');
        return;
    }
    
    // Show loading state
    console.log('[Group Tours] Container found, attempting to load data...');
    
    // Always fetch from API first (localStorage is now only used as fallback)
    console.log('[Group Tours] Loading from API...');
    
    try {
        const apiUrl = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GROUPS);
        console.log(`[Group Tours] 🔄 Fetching from API: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        console.log(`[Group Tours] Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('[Group Tours] ✓ API response received!');
            console.log('[Group Tours] Number of groups:', data ? data.length : 0);
            console.log('[Group Tours] First group:', data[0]);
            
            if (data && Array.isArray(data) && data.length > 0) {
                groupsData = data;
                console.log(`[Group Tours] ✓ Storing ${data.length} groups in groupsData`);
                
                // Check if we're on the homepage - limit to 4 groups
                const isHomePage = window.location.pathname === '/' || 
                                  window.location.pathname.endsWith('index.html') || 
                                  window.location.pathname.endsWith('/') ||
                                  window.location.pathname.includes('index') ||
                                  !window.location.pathname.includes('groups.html');
                
                const limit = isHomePage ? 4 : null;
                console.log('[Group Tours] Is homepage?', isHomePage, 'Limit:', limit);
                
                renderGroupTours(groupsData, limit);
                
                // Store in localStorage as cache/backup
                if (window.dataStorage) {
                    window.dataStorage.setStoredData(window.dataStorage.STORAGE_KEYS.groups, groupsData);
                    console.log('[Group Tours] ✓ Data cached to localStorage');
                }
                return; // Success!
            } else {
                console.warn('[Group Tours] Groups data is empty or invalid');
            }
            } else {
                const errorText = await response.text();
                console.error(`[Group Tours] ❌ HTTP ${response.status}: ${response.statusText}`);
                console.error(`[Group Tours] Error response:`, errorText);
            }
        } catch (error) {
            console.error(`[Group Tours] ❌ Error loading from API:`, error);
            console.error(`[Group Tours] Error details:`, error.message, error.stack);
        }
        
        // Error handling - fallback to localStorage if API fails
        console.error('[Group Tours] ❌❌❌ Could not load groups from API ❌❌❌');
        
        // Fallback to localStorage if available
        if (window.dataStorage && window.dataStorage.hasStoredData(window.dataStorage.STORAGE_KEYS.groups)) {
            console.log('[Group Tours] 🔄 Falling back to localStorage data...');
            const storedData = window.dataStorage.getStoredData(window.dataStorage.STORAGE_KEYS.groups);
            if (storedData && Array.isArray(storedData) && storedData.length > 0) {
                groupsData = storedData;
                console.log(`[Group Tours] ✓ Using ${storedData.length} groups from localStorage (fallback)`);
                
                const isHomePage = window.location.pathname === '/' || 
                                  window.location.pathname.endsWith('index.html') || 
                                  window.location.pathname.endsWith('/') ||
                                  window.location.pathname.includes('index') ||
                                  !window.location.pathname.includes('groups.html');
                
                const limit = isHomePage ? 4 : null;
                console.log('[Group Tours] Is homepage?', isHomePage, 'Limit:', limit);
                
                renderGroupTours(groupsData, limit);
                return; // Success!
            }
        }
        
        // Show error if both API and localStorage fail
        if (container) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <h5><i class="bi bi-exclamation-triangle"></i> Failed to load group tours</h5>
                        <p>Unable to connect to the API server.</p>
                        <p class="small text-muted">API URL: ${API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GROUPS)}</p>
                        <p class="small text-muted">Make sure the backend server is running.</p>
                        <p class="small text-muted">Check browser console (F12) for detailed error messages.</p>
                    </div>
                </div>
            `;
        }
}

// ===========================
// Group Details Modal Functions
// ===========================

function openGroupDetailsModal(groupId) {
    const group = groupsData.find(g => g.id === groupId);
    if (!group) {
        console.error('Group not found:', groupId);
        return;
    }
    
    // Store selected group and reset selections
    selectedGroup = group;
    selectedGroupHotel = null;
    selectedGroupRoomType = null;
    
    // Clear any existing room selection area
    const existingArea = document.getElementById('roomSelectionArea');
    if (existingArea) {
        existingArea.closest('.row')?.remove();
    }
    
    // Reset Book Now button text
    const bookNowBtn = document.querySelector('#groupDetailsModal .btn-primary');
    if (bookNowBtn) {
        bookNowBtn.innerHTML = `<i class="bi bi-calendar-check"></i> Book Now`;
    }
    
    // Create or get modal
    let modal = document.getElementById('groupDetailsModal');
    if (!modal) {
        modal = createGroupDetailsModal();
        document.body.appendChild(modal);
    }
    
    // Populate modal with group data
    populateGroupModal(group);
    
    // Show modal using Bootstrap
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

function createGroupDetailsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'groupDetailsModal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', 'groupDetailsModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="groupDetailsModalLabel">
                        <i class="bi bi-info-circle"></i> Group Tour Details
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="groupModalBody">
                    <!-- Content will be populated dynamically -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="openGroupReservationModal()" id="bookGroupBtn">
                        <i class="bi bi-calendar-check"></i> Book Now
                    </button>
                    <button type="button" class="btn btn-outline-primary" onclick="contactForGroup()">
                        <i class="bi bi-telephone"></i> Contact Us
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

function populateGroupModal(group) {
    const modalBody = document.getElementById('groupModalBody');
    if (!modalBody) return;
    
    const validityText = group.validityDates 
        ? `${formatDate(group.validityDates.from)}${group.validityDates.to ? ' - ' + formatDate(group.validityDates.to) : ''}`
        : 'Contact for dates';
    
    let includesHtml = '';
    if (group.includes && group.includes.length > 0) {
        includesHtml = `
            <div class="mb-4">
                <h6 class="text-success mb-2"><i class="bi bi-check-circle-fill"></i> Includes:</h6>
                <div class="d-flex flex-wrap gap-2">
                    ${group.includes.map(item => `<span class="badge bg-success bg-opacity-10 text-success border border-success">${item}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    let excludesHtml = '';
    if (group.excludes && group.excludes.length > 0) {
        excludesHtml = `
            <div class="mb-4">
                <h6 class="text-danger mb-2"><i class="bi bi-x-circle-fill"></i> Excludes:</h6>
                <div class="d-flex flex-wrap gap-2">
                    ${group.excludes.map(item => `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger">${item}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    let itineraryHtml = '';
    if (group.itinerary && group.itinerary.details) {
        itineraryHtml = `
            <div class="mb-4">
                <h5 class="mb-3"><i class="bi bi-calendar-event text-primary"></i> Itinerary (${group.itinerary.days} days)</h5>
                <div class="itinerary-list">
                    ${group.itinerary.details.map(day => `
                        <div class="itinerary-day mb-3 p-3 border rounded">
                            <div class="d-flex align-items-start">
                                <div class="day-number me-3 text-center" style="min-width: 50px;">
                                    <span class="badge bg-primary rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 40px; height: 40px; font-size: 1rem;">${day.day}</span>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="mb-1 fw-bold">${day.title}</h6>
                                    <p class="mb-0 text-muted small">${day.description}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    let hotelsHtml = '';
    if (group.hotels && group.hotels.length > 0) {
        // Group hotels by star rating
        const hotelsByStars = {};
        group.hotels.forEach(hotel => {
            const stars = Math.floor(hotel.stars || 0);
            if (!hotelsByStars[stars]) hotelsByStars[stars] = [];
            hotelsByStars[stars].push(hotel);
        });
        
        // Sort star ratings descending
        const sortedStars = Object.keys(hotelsByStars).sort((a, b) => b - a);
        
        hotelsHtml = `
            <div class="mb-4">
                <div class="alert alert-info d-flex align-items-center mb-3" role="alert">
                    <i class="bi bi-info-circle-fill me-2" style="font-size: 1.25rem;"></i>
                    <div>
                        <strong>How to Book:</strong> Click on a hotel card below to select it. Then choose a room type when it appears below.
                    </div>
                </div>
                <h5 class="mb-3"><i class="bi bi-building"></i> Available Hotels</h5>
                ${sortedStars.map(starRating => `
                    <div class="mb-4">
                        <h6 class="text-primary mb-3">
                            ${renderStars(parseInt(starRating))} ${parseInt(starRating) === 5 ? '5 Star' : parseInt(starRating) === 4 ? '4 Star' : parseInt(starRating) === 3 ? '3 Star' : starRating + ' Star'} Hotels
                        </h6>
                        <div class="row g-3">
                            ${hotelsByStars[starRating].map(hotel => {
                                const prices = hotel.prices || {};
                                const minPrice = Math.min(...Object.values(prices).filter(p => p && p > 0));
                                
                                // Format price types nicely
                                const priceItems = [];
                                if (prices.single) priceItems.push(`<span class="badge bg-light text-dark">Single: ${formatIQD(prices.single)}</span>`);
                                if (prices.double) priceItems.push(`<span class="badge bg-light text-dark">Double: ${formatIQD(prices.double)}</span>`);
                                if (prices.triple) priceItems.push(`<span class="badge bg-light text-dark">Triple: ${formatIQD(prices.triple)}</span>`);
                                if (prices.adult) priceItems.push(`<span class="badge bg-light text-dark">Adult: ${formatIQD(prices.adult)}</span>`);
                                
                                return `
                                    <div class="col-md-6">
                                        <div class="hotel-option-card p-3 border rounded h-100" 
                                             data-hotel-name="${hotel.name}" 
                                             data-hotel-prices='${JSON.stringify(prices)}'
                                             onclick="selectGroupHotel(this)">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="mb-0 fw-bold">${hotel.name}</h6>
                                                <span class="text-warning">${renderStars(hotel.stars)}</span>
                                            </div>
                                            ${hotel.note ? `<p class="small text-muted mb-2"><i class="bi bi-info-circle"></i> ${hotel.note}</p>` : ''}
                                            <div class="hotel-prices mt-2">
                                                <div class="mb-2">
                                                    <strong class="text-primary">From ${formatIQD(minPrice)}</strong>
                                                </div>
                                                <div class="d-flex flex-wrap gap-1">
                                                    ${priceItems.join('')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    let itinerariesHtml = '';
    if (group.itineraries && group.itineraries.length > 0) {
        itinerariesHtml = `
            <div class="mb-4">
                <div class="alert alert-info d-flex align-items-center mb-3" role="alert">
                    <i class="bi bi-info-circle-fill me-2" style="font-size: 1.25rem;"></i>
                    <div>
                        <strong>How to Book:</strong> Click on a hotel card below to select it. Then choose a room type when it appears below.
                    </div>
                </div>
                <h5 class="mb-3"><i class="bi bi-map"></i> Available Itineraries</h5>
                ${group.itineraries.map((itinerary, idx) => `
                    <div class="itinerary-option mb-4 p-3 border rounded bg-light">
                        <h6 class="text-primary mb-3">${itinerary.name}</h6>
                        ${itinerary.hotels && itinerary.hotels.length > 0 ? `
                            <div class="row g-3">
                                ${itinerary.hotels.map(hotel => {
                                    const prices = hotel.prices || {};
                                    const minPrice = Math.min(...Object.values(prices).filter(p => p && p > 0));
                                    
                                    const priceItems = [];
                                    if (prices.single) priceItems.push(`<span class="badge bg-light text-dark">Single: ${formatIQD(prices.single)}</span>`);
                                    if (prices.double) priceItems.push(`<span class="badge bg-light text-dark">Double: ${formatIQD(prices.double)}</span>`);
                                    if (prices.triple) priceItems.push(`<span class="badge bg-light text-dark">Triple: ${formatIQD(prices.triple)}</span>`);
                                    if (prices.adult) priceItems.push(`<span class="badge bg-light text-dark">Adult: ${formatIQD(prices.adult)}</span>`);
                                    if (prices.child) priceItems.push(`<span class="badge bg-light text-dark">Child: ${formatIQD(prices.child)}</span>`);
                                    
                                    return `
                                        <div class="col-md-6">
                                            <div class="hotel-option-card p-3 border rounded bg-white h-100" 
                                                 data-hotel-name="${hotel.name}" 
                                                 data-hotel-prices='${JSON.stringify(prices)}'
                                                 onclick="selectGroupHotel(this)">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 class="mb-0 fw-bold small">${hotel.name}</h6>
                                                    <span class="text-warning">${renderStars(hotel.stars)}</span>
                                                </div>
                                                <div class="hotel-prices mt-2">
                                                    <div class="mb-2">
                                                        <strong class="text-primary small">From ${formatIQD(minPrice)}</strong>
                                                    </div>
                                                    <div class="d-flex flex-wrap gap-1">
                                                        ${priceItems.join('')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    modalBody.innerHTML = `
        <div class="group-details">
            <div class="text-center mb-4">
                <img src="${group.image}" alt="${group.name}" class="img-fluid rounded mb-3" style="max-height: 250px; width: 100%; object-fit: cover;" onerror="this.src='assets/images/logo.svg'">
                <h4 class="mb-2">${group.name}</h4>
                <p class="text-muted mb-0">
                    <i class="bi bi-geo-alt-fill"></i> ${group.destination}, ${group.country}
                </p>
            </div>
            
            <div class="group-info-card p-3 mb-4 bg-light rounded">
                <div class="row g-2">
                    <div class="col-md-6">
                        <p class="mb-2"><strong><i class="bi bi-calendar text-primary"></i> Validity:</strong><br><span class="small">${validityText}</span></p>
                    </div>
                    ${group.airport ? `
                        <div class="col-md-6">
                            <p class="mb-2"><strong><i class="bi bi-airplane text-primary"></i> Airport:</strong><br><span class="small">${group.airport}</span></p>
                        </div>
                    ` : ''}
                    ${group.flightDays ? `
                        <div class="col-md-6">
                            <p class="mb-2"><strong><i class="bi bi-calendar-week text-primary"></i> Flight Days:</strong><br><span class="small">${group.flightDays}</span></p>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            ${includesHtml}
            ${excludesHtml}
            ${itineraryHtml}
            ${hotelsHtml}
            ${itinerariesHtml}
            
            ${group.notes ? `
                <div class="alert alert-warning mb-0">
                    <i class="bi bi-info-circle"></i> <strong>Note:</strong> ${group.notes}
                </div>
            ` : ''}
        </div>
    `;
}

// Hotel and Room Selection Functions
function selectGroupHotel(hotelCard) {
    // Remove previously selected hotel
    document.querySelectorAll('.hotel-option-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Mark this hotel as selected
    hotelCard.classList.add('selected');
    
    // Get hotel data
    const hotelName = hotelCard.getAttribute('data-hotel-name');
    const pricesData = JSON.parse(hotelCard.getAttribute('data-hotel-prices'));
    
    // Store selected hotel
    selectedGroupHotel = {
        name: hotelName,
        prices: pricesData
    };
    
    // Show room type selection
    showRoomTypeSelection(hotelName, pricesData, hotelCard);
}

function showRoomTypeSelection(hotelName, prices, hotelCard) {
    // Remove any existing room selection area
    const existingArea = document.getElementById('roomSelectionArea');
    if (existingArea) {
        existingArea.remove();
    }
    
    // Create room selection area
    const roomTypes = [];
    if (prices.single) roomTypes.push({ type: 'Single', price: prices.single, icon: 'person', description: 'One bed for single occupancy' });
    if (prices.double) roomTypes.push({ type: 'Double', price: prices.double, icon: 'people', description: 'Two beds or one double bed' });
    if (prices.triple) roomTypes.push({ type: 'Triple', price: prices.triple, icon: 'people-fill', description: 'Three beds for triple occupancy' });
    if (prices.adult) roomTypes.push({ type: 'Adult', price: prices.adult, icon: 'person-check', description: 'Price per adult' });
    if (prices.child) roomTypes.push({ type: 'Child', price: prices.child, icon: 'person', description: 'Price per child' });
    
    if (roomTypes.length === 0) return;
    
    const roomSelectionHtml = `
        <div class="col-12">
            <div id="roomSelectionArea" class="room-selection-area">
                <h5 class="room-selection-title">
                    <i class="bi bi-door-open"></i> Step 2: Select Room Type for <span class="hotel-name-highlight">${hotelName}</span>
                </h5>
                <div class="row g-3">
                    ${roomTypes.map(room => `
                        <div class="col-md-6">
                            <div class="room-type-option" onclick="selectRoomType(this, '${room.type}', ${room.price})">
                                <div class="room-info">
                                    <h6><i class="bi bi-${room.icon}"></i> ${room.type} Room</h6>
                                    <p>${room.description}</p>
                                </div>
                                <div class="room-price">
                                    <div class="price">${formatIQD(room.price)}</div>
                                    <div class="period">per person</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Find the hotel card's parent column
    const hotelColumn = hotelCard.closest('.col-md-6');
    if (hotelColumn) {
        // Insert the room selection area right after this column's parent row
        const hotelRow = hotelCard.closest('.row');
        if (hotelRow && hotelRow.parentElement) {
            // Create a new row for the room selection that spans full width
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = `<div class="row g-3">${roomSelectionHtml}</div>`;
            hotelRow.parentElement.insertBefore(tempDiv.firstChild, hotelRow.nextSibling);
            
            // Scroll to room selection with smooth animation
            setTimeout(() => {
                const roomArea = document.getElementById('roomSelectionArea');
                if (roomArea) {
                    roomArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 150);
        }
    }
}

function selectRoomType(roomCard, roomType, price) {
    // Remove previously selected room type
    document.querySelectorAll('.room-type-option').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Mark this room type as selected
    roomCard.classList.add('selected');
    
    // Store selected room type
    selectedGroupRoomType = {
        type: roomType,
        price: price
    };
    
    // Enable the Book Now button
    updateBookNowButton();
}

function updateBookNowButton() {
    const bookNowBtn = document.querySelector('#groupDetailsModal .btn-primary');
    if (bookNowBtn && selectedGroupHotel && selectedGroupRoomType) {
        bookNowBtn.innerHTML = `<i class="bi bi-calendar-check"></i> Book Now - ${selectedGroupRoomType.type} Room at ${selectedGroupHotel.name}`;
        bookNowBtn.classList.add('pulse');
        setTimeout(() => bookNowBtn.classList.remove('pulse'), 1000);
    }
}

function preselectHotelAndRoomType() {
    if (!selectedGroupHotel || !selectedGroupRoomType) return;
    
    // Find and select the hotel
    const hotelSelect = document.getElementById('groupHotelSelect');
    if (hotelSelect) {
        // Find the option that matches the selected hotel name
        const options = hotelSelect.querySelectorAll('option');
        for (let option of options) {
            if (option.textContent.includes(selectedGroupHotel.name)) {
                hotelSelect.value = option.value;
                // Trigger change event to update room types
                const event = new Event('change', { bubbles: true });
                hotelSelect.dispatchEvent(event);
                break;
            }
        }
    }
    
    // Wait a bit for room types to update, then select the room type
    setTimeout(() => {
        const roomTypeSelect = document.getElementById('groupRoomTypeSelect');
        if (roomTypeSelect) {
            // Convert room type to lowercase for matching
            const roomTypeValue = selectedGroupRoomType.type.toLowerCase();
            roomTypeSelect.value = roomTypeValue;
            
            // Trigger change event to update price
            const event = new Event('change', { bubbles: true });
            roomTypeSelect.dispatchEvent(event);
        }
    }, 200);
}

function contactForGroup() {
    // Scroll to contact section
    const contactSection = document.getElementById('contact');
    if (contactSection) {
        const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
        const targetPosition = contactSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('groupDetailsModal'));
        if (modal) modal.hide();
    }
}

// ===========================
// Group Reservation Functions
// ===========================

function openGroupReservationModal() {
    if (!selectedGroup) {
        alert('Please select a group tour first');
        return;
    }

    // Check if user selected hotel and room type
    if (!selectedGroupHotel || !selectedGroupRoomType) {
        alert('Please select a hotel and room type first');
        return;
    }

    // Check if group has hotels (either direct hotels or hotels in itineraries)
    const hasDirectHotels = selectedGroup.hotels && selectedGroup.hotels.length > 0;
    const hasItineraryHotels = selectedGroup.itineraries && selectedGroup.itineraries.length > 0 && 
                               selectedGroup.itineraries.some(it => it.hotels && it.hotels.length > 0);
    
    if (!hasDirectHotels && !hasItineraryHotels) {
        alert('No hotels available for this group tour. Please contact us for more information.');
        return;
    }

    // Create or get reservation modal
    let modal = document.getElementById('groupReservationModal');
    if (!modal) {
        modal = createGroupReservationModal();
        document.body.appendChild(modal);
    }

    // Populate reservation modal
    populateGroupReservationModal();
    
    // Pre-select hotel and room type
    setTimeout(() => {
        preselectHotelAndRoomType();
    }, 100);

    // Close details modal
    const detailsModal = bootstrap.Modal.getInstance(document.getElementById('groupDetailsModal'));
    if (detailsModal) detailsModal.hide();

    // Show reservation modal
    const reservationModal = new bootstrap.Modal(modal);
    reservationModal.show();
}

function createGroupReservationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'groupReservationModal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', 'groupReservationModalLabel');
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="groupReservationModalLabel">
                        <i class="bi bi-calendar-check me-2"></i>Book Group Tour
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="groupReservationModalBody">
                    <!-- Content will be populated dynamically -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="confirmGroupReservationBtn" onclick="handleGroupReservation()">
                        <span id="groupBtnText">Confirm Booking</span>
                        <span id="groupBtnSpinner" class="spinner-border spinner-border-sm ms-2" style="display: none;"></span>
                    </button>
                </div>
            </div>
        </div>
    `;

    return modal;
}

function populateGroupReservationModal() {
    const modalBody = document.getElementById('groupReservationModalBody');
    if (!modalBody || !selectedGroup) return;

    // Check if group has itineraries (like Thailand) or direct hotels
    const hasItineraries = selectedGroup.itineraries && selectedGroup.itineraries.length > 0;
    const hasDirectHotels = selectedGroup.hotels && selectedGroup.hotels.length > 0;

    // Build itinerary options if group has itineraries
    let itineraryOptionsHtml = '';
    if (hasItineraries) {
        itineraryOptionsHtml = selectedGroup.itineraries.map(itinerary => 
            `<option value="${itinerary.id}" data-itinerary='${JSON.stringify(itinerary)}'>${itinerary.name}</option>`
        ).join('');
    }

    // Build hotel options (for direct hotels or will be populated from itinerary)
    let hotelOptionsHtml = '';
    if (hasDirectHotels) {
        hotelOptionsHtml = selectedGroup.hotels.map(hotel => {
            const minPrice = Math.min(...Object.values(hotel.prices || {}).filter(p => p && p > 0));
            return `<option value="${hotel.id}" data-hotel='${JSON.stringify(hotel)}'>${hotel.name} ${renderStars(hotel.stars)} - From ${formatIQD(minPrice)}</option>`;
        }).join('');
    }

    // Build room type options (common types)
    const roomTypes = [
        { value: 'single', label: 'Single Room' },
        { value: 'double', label: 'Double Room' },
        { value: 'triple', label: 'Triple Room' },
        { value: 'adult', label: 'Adult' },
        { value: 'child', label: 'Child' },
        { value: 'childWithBed', label: 'Child with Bed' },
        { value: 'childWithoutBed', label: 'Child without Bed' },
        { value: 'infant', label: 'Infant' }
    ];

    let roomTypeOptionsHtml = roomTypes.map(rt => 
        `<option value="${rt.value}">${rt.label}</option>`
    ).join('');

    modalBody.innerHTML = `
        <div class="group-reservation-form">
            <!-- Group Info Summary -->
            <div class="reservation-summary mb-4 p-3 bg-light rounded">
                <h6 class="mb-2">Tour Package</h6>
                <strong>${selectedGroup.name}</strong>
                <p class="text-muted mb-0 small">
                    <i class="bi bi-geo-alt-fill"></i> ${selectedGroup.destination}, ${selectedGroup.country}
                </p>
            </div>

            ${hasItineraries ? `
            <!-- Itinerary Selection (for groups with itineraries like Thailand) -->
            <div class="mb-3">
                <label for="groupItinerarySelect" class="form-label">
                    <i class="bi bi-map"></i> Select Itinerary <span class="text-danger">*</span>
                </label>
                <select class="form-select" id="groupItinerarySelect" required onchange="updateGroupHotelsFromItinerary()">
                    <option value="">-- Select an itinerary --</option>
                    ${itineraryOptionsHtml}
                </select>
            </div>
            ` : ''}

            <!-- Hotel Selection -->
            <div class="mb-3">
                <label for="groupHotelSelect" class="form-label">
                    <i class="bi bi-building"></i> Select Hotel <span class="text-danger">*</span>
                </label>
                <select class="form-select" id="groupHotelSelect" required onchange="updateGroupRoomTypes()" ${hasItineraries ? 'disabled' : ''}>
                    <option value="">-- Select ${hasItineraries ? 'an itinerary first' : 'a hotel'} --</option>
                    ${hotelOptionsHtml}
                </select>
            </div>

            <!-- Room Type Selection -->
            <div class="mb-3">
                <label for="groupRoomTypeSelect" class="form-label">
                    <i class="bi bi-door-open"></i> Room Type <span class="text-danger">*</span>
                </label>
                <select class="form-select" id="groupRoomTypeSelect" required onchange="updateGroupPrice()">
                    <option value="">-- Select room type --</option>
                    ${roomTypeOptionsHtml}
                </select>
            </div>

            <!-- Price Display -->
            <div class="mb-3">
                <div class="reservation-summary-item p-2 bg-primary bg-opacity-10 rounded">
                    <span class="fw-bold">Total Price:</span>
                    <span id="groupSelectedPrice" class="fw-bold text-primary">--</span>
                </div>
            </div>

            <!-- Customer Information -->
            <div class="customer-info-section mt-4">
                <h6><i class="bi bi-person-fill"></i> Your Information</h6>
                
                <div class="row mb-3">
                    <div class="col-md-4">
                        <label for="groupCustomerFirstName" class="form-label">First Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="groupCustomerFirstName" placeholder="John" required>
                    </div>
                    <div class="col-md-4">
                        <label for="groupCustomerSecondName" class="form-label">Second Name</label>
                        <input type="text" class="form-control" id="groupCustomerSecondName" placeholder="Middle">
                    </div>
                    <div class="col-md-4">
                        <label for="groupCustomerSurname" class="form-label">Surname <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="groupCustomerSurname" placeholder="Doe" required>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="groupCustomerPhone" class="form-label">
                            <i class="bi bi-telephone me-1"></i>Phone Number <span class="text-danger">*</span>
                        </label>
                        <input type="tel" class="form-control" id="groupCustomerPhone" placeholder="+964 750 XXX XXXX" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="groupCustomerEmail" class="form-label">
                            <i class="bi bi-envelope me-1"></i>Email Address <span class="text-danger">*</span>
                        </label>
                        <input type="email" class="form-control" id="groupCustomerEmail" placeholder="john@example.com" required>
                    </div>
                </div>
            </div>

            <!-- Terms and Conditions -->
            <div class="mb-3 mt-4">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="groupReservationTerms" required>
                    <label class="form-check-label" for="groupReservationTerms">
                        <strong>I understand that this reservation is non-refundable under any circumstances or excuse.</strong>
                        <span class="text-danger">*</span>
                    </label>
                </div>
            </div>

            <!-- Error Message -->
            <div id="groupReservationError" class="alert alert-danger" style="display: none;"></div>
        </div>
    `;
}

function updateGroupHotelsFromItinerary() {
    const itinerarySelect = document.getElementById('groupItinerarySelect');
    const hotelSelect = document.getElementById('groupHotelSelect');
    
    if (!itinerarySelect || !hotelSelect) return;

    const selectedItineraryId = itinerarySelect.value;
    if (!selectedItineraryId) {
        hotelSelect.innerHTML = '<option value="">-- Select an itinerary first --</option>';
        hotelSelect.disabled = true;
        selectedGroupHotel = null;
        return;
    }

    // Get itinerary data
    const itineraryOption = itinerarySelect.options[itinerarySelect.selectedIndex];
    const itineraryData = JSON.parse(itineraryOption.getAttribute('data-itinerary'));

    // Build hotel options from itinerary
    if (itineraryData.hotels && itineraryData.hotels.length > 0) {
        let hotelOptionsHtml = '<option value="">-- Select a hotel --</option>';
        hotelOptionsHtml += itineraryData.hotels.map(hotel => {
            const minPrice = Math.min(...Object.values(hotel.prices || {}).filter(p => p && p > 0));
            return `<option value="${hotel.id}" data-hotel='${JSON.stringify(hotel)}'>${hotel.name} ${renderStars(hotel.stars)} - From ${formatIQD(minPrice)}</option>`;
        }).join('');
        
        hotelSelect.innerHTML = hotelOptionsHtml;
        hotelSelect.disabled = false;
    } else {
        hotelSelect.innerHTML = '<option value="">No hotels available</option>';
        hotelSelect.disabled = true;
    }

    // Reset room types
    const roomTypeSelect = document.getElementById('groupRoomTypeSelect');
    if (roomTypeSelect) {
        roomTypeSelect.innerHTML = '<option value="">-- Select room type --</option>';
    }
    updateGroupPrice();
}

function updateGroupRoomTypes() {
    const hotelSelect = document.getElementById('groupHotelSelect');
    const roomTypeSelect = document.getElementById('groupRoomTypeSelect');
    
    if (!hotelSelect || !roomTypeSelect) return;

    const selectedHotelId = hotelSelect.value;
    if (!selectedHotelId) {
        roomTypeSelect.innerHTML = '<option value="">-- Select room type --</option>';
        selectedGroupHotel = null;
        return;
    }

    // Get hotel data
    const hotelOption = hotelSelect.options[hotelSelect.selectedIndex];
    const hotelData = JSON.parse(hotelOption.getAttribute('data-hotel'));
    selectedGroupHotel = hotelData;

    // Get available room types from hotel prices
    const availableRoomTypes = Object.keys(hotelData.prices || {});
    
    // Update room type options
    const roomTypeLabels = {
        single: 'Single Room',
        double: 'Double Room',
        triple: 'Triple Room',
        adult: 'Adult',
        child: 'Child',
        childWithBed: 'Child with Bed',
        childWithoutBed: 'Child without Bed',
        infant: 'Infant',
        child2to6: 'Child (2-6 years)',
        infant0to2: 'Infant (0-2 years)',
        singleSupplement: 'Single Supplement'
    };

    let optionsHtml = '<option value="">-- Select room type --</option>';
    availableRoomTypes.forEach(rt => {
        const label = roomTypeLabels[rt] || rt;
        optionsHtml += `<option value="${rt}">${label}</option>`;
    });

    roomTypeSelect.innerHTML = optionsHtml;
    updateGroupPrice();
}

function updateGroupPrice() {
    const roomTypeSelect = document.getElementById('groupRoomTypeSelect');
    const priceDisplay = document.getElementById('groupSelectedPrice');
    
    if (!roomTypeSelect || !priceDisplay || !selectedGroupHotel) {
        if (priceDisplay) priceDisplay.textContent = '--';
        return;
    }

    const roomType = roomTypeSelect.value;
    selectedGroupRoomType = roomType;

    if (!roomType) {
        priceDisplay.textContent = '--';
        return;
    }

    const price = selectedGroupHotel.prices[roomType];
    if (price) {
        priceDisplay.textContent = formatIQD(price);
    } else {
        priceDisplay.textContent = 'N/A';
    }
}

async function handleGroupReservation() {
    if (!selectedGroup || !selectedGroupHotel || !selectedGroupRoomType) {
        showGroupReservationError('Please select a hotel and room type');
        return;
    }

    // Get customer info
    const firstName = document.getElementById('groupCustomerFirstName').value.trim();
    const secondName = document.getElementById('groupCustomerSecondName').value.trim();
    const surname = document.getElementById('groupCustomerSurname').value.trim();
    const customerPhone = document.getElementById('groupCustomerPhone').value.trim();
    const customerEmail = document.getElementById('groupCustomerEmail').value.trim();

    // Validate required fields
    if (!firstName || !surname || !customerPhone || !customerEmail) {
        showGroupReservationError('Please fill in all required fields');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
        showGroupReservationError('Please enter a valid email address');
        return;
    }
    
    // Validate phone contains digits
    if (customerPhone.length < 5 || !/\d/.test(customerPhone)) {
        showGroupReservationError('Phone number must be at least 5 characters and contain digits');
        return;
    }
    
    // Combine names and validate
    const customerName = `${firstName} ${secondName} ${surname}`.trim();
    if (customerName.toLowerCase() === 'guest' || customerName.toLowerCase() === 'n/a') {
        showGroupReservationError('Please enter your real name');
        return;
    }

    // Validate terms checkbox
    const termsCheckbox = document.getElementById('groupReservationTerms');
    if (!termsCheckbox || !termsCheckbox.checked) {
        showGroupReservationError('You must agree to the non-refundable terms to proceed');
        return;
    }

    // Get amount
    const amount = selectedGroupHotel.prices[selectedGroupRoomType];
    if (!amount || amount <= 0) {
        showGroupReservationError('Invalid price. Please select a valid room type.');
        return;
    }

    // Hide error
    hideGroupReservationError();

    // Show loading
    setGroupButtonLoading(true);

    try {
        // Use shared reservation utility
        if (!window.reservationUtils) {
            throw new Error('Reservation utilities not loaded');
        }

        await window.reservationUtils.completeReservationFlow({
            reservationType: 'Group',
            groupId: String(selectedGroup.id),
            hotelId: selectedGroupHotel.id,
            hotelName: selectedGroupHotel.name,
            city: selectedGroup.destination,
            country: selectedGroup.country,
            roomType: selectedGroupRoomType,
            amount: amount,
            customerName: customerName,
            customerPhone: customerPhone,
            customerEmail: customerEmail
        }, {
            paymentData: {
                hotelId: selectedGroupHotel.id,
                hotelName: selectedGroupHotel.name,
                roomType: selectedGroupRoomType,
                groupId: String(selectedGroup.id),
                customerName: customerName,
                customerPhone: customerPhone,
                customerEmail: customerEmail
            },
            onError: (error) => {
                showGroupReservationError(error.message || 'An error occurred. Please try again.');
                setGroupButtonLoading(false);
            }
        });

    } catch (error) {
        console.error('Group reservation error:', error);
        showGroupReservationError(error.message || 'An error occurred. Please try again.');
        setGroupButtonLoading(false);
    }
}

function showGroupReservationError(message) {
    const errorDiv = document.getElementById('groupReservationError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        // Use warning style for reservation limits/disabled, danger for other errors
        if (message.includes('disabled') || 
            message.includes('limit') || 
            message.includes("can't accept")) {
            errorDiv.className = 'alert alert-warning mt-3';
        } else {
            errorDiv.className = 'alert alert-danger mt-3';
        }
    }
}

function hideGroupReservationError() {
    const errorDiv = document.getElementById('groupReservationError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

function setGroupButtonLoading(loading) {
    const btn = document.getElementById('confirmGroupReservationBtn');
    const btnText = document.getElementById('groupBtnText');
    const btnSpinner = document.getElementById('groupBtnSpinner');

    if (loading) {
        if (btn) btn.disabled = true;
        if (btnText) btnText.textContent = 'Processing...';
        if (btnSpinner) btnSpinner.style.display = 'inline-block';
    } else {
        if (btn) btn.disabled = false;
        if (btnText) btnText.textContent = 'Confirm Booking';
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}

// ===========================
// Initialize on Page Load
// ===========================

// Initialize when DOM is ready
console.log('[Group Tours] Initialization block executing...');
console.log('[Group Tours] Document readyState:', document.readyState);

if (document.readyState === 'loading') {
    console.log('[Group Tours] Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[Group Tours] ✓ DOM loaded event fired!');
        console.log('[Group Tours] Calling loadGroups() in 100ms...');
        setTimeout(() => {
            console.log('[Group Tours] Now calling loadGroups()...');
            loadGroups();
        }, 100);
    });
} else {
    // DOM is already loaded
    console.log('[Group Tours] ✓ DOM already loaded!');
    console.log('[Group Tours] Calling loadGroups() in 100ms...');
    setTimeout(() => {
        console.log('[Group Tours] Now calling loadGroups()...');
        loadGroups();
    }, 100);
}

console.log('[Group Tours] Initialization block complete.');

// Add a visual indicator that the script loaded
setTimeout(() => {
    const indicator = document.getElementById('groupsLoadingIndicator');
    if (indicator) {
        indicator.innerHTML = '<i class="bi bi-gear-fill"></i> Script loaded, attempting to fetch data...';
        indicator.className = 'alert alert-info';
    }
}, 50);

// Export functions for global access
window.openGroupDetailsModal = openGroupDetailsModal;
window.contactForGroup = contactForGroup;
window.openGroupReservationModal = openGroupReservationModal;
window.updateGroupHotelsFromItinerary = updateGroupHotelsFromItinerary;
window.updateGroupRoomTypes = updateGroupRoomTypes;
window.updateGroupPrice = updateGroupPrice;
window.handleGroupReservation = handleGroupReservation;
window.selectGroupHotel = selectGroupHotel;
window.selectRoomType = selectRoomType;

