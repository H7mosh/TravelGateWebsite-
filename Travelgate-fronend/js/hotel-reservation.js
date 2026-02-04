/**
 * Hotel Reservation System
 * Handles hotel card rendering, reservation modal, and payment integration
 */

console.log('[Hotels] hotel-reservation.js script loaded');

// ===========================
// Configuration
// ===========================
// API Base URL - using shared constant from reservation-utils.js
// reservation-utils.js loads first and sets window.API_BASE_URL
// Fallback if reservation-utils.js hasn't loaded yet
if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = "https://api.travelgate.co/api";
}

// Helper function to get API base URL (avoids const redeclaration)
function getApiBaseUrl() {
    return window.API_BASE_URL || "https://api.travelgate.co/api";
}

// Hotels data storage
let hotelsData = [];
let selectedHotel = null;
let selectedRoomType = 'single';

// ===========================
// Utility Functions
// ===========================

// Format currency (IQD)
function formatIQD(value) {
    return value.toLocaleString('en-US') + ' IQD';
}

// Render stars
function renderStars(count) {
    return '⭐'.repeat(count);
}

// Get room type label
function getRoomTypeInfo(type) {
    const roomTypes = {
        single: { key: 'single', label: 'Single Room' },
        double: { key: 'double', label: 'Double Room' },
        family: { key: 'family', label: 'Family Room' }
    };
    return roomTypes[type] || { key: type, label: type };
}

// ===========================
// Hotel Card Building
// ===========================


function buildHotelCard(hotel) {
    const minPrice = Math.min(hotel.prices.single, hotel.prices.double, hotel.prices.family);
    const maxPrice = Math.max(hotel.prices.single, hotel.prices.double, hotel.prices.family);
    
    const priceText = formatIQD(minPrice);
    
    // Estimate rooms/bathrooms based on hotel stars (you can customize this)
    const rooms = hotel.stars >= 4 ? '4' : hotel.stars >= 3 ? '3' : '2';
    const bathrooms = hotel.stars >= 4 ? '3' : hotel.stars >= 3 ? '2' : '1';
    
    return `
        <div class="col-md-6 col-xl-4">
            <div class="hotel-card h-100" data-hotel-id="${hotel.id}" onclick="openHotelDetailsModal(${hotel.id})">
                <div class="hotel-card-image">
                    <img src="${hotel.image}" alt="${hotel.name}" loading="lazy">
                </div>
                <div class="hotel-card-content">
                    <p class="hotel-location">
                        <i class="bi bi-geo-alt-fill"></i>
                        ${hotel.city}, ${hotel.country}
                    </p>
                    <h4 class="hotel-name">${hotel.name}</h4>
                    <div class="hotel-amenities">
                        <span><i class="bi bi-door-closed-fill"></i> ${rooms}</span>
                        <span><i class="bi bi-droplet-fill"></i> ${bathrooms}</span>
                    </div>
                    <p class="hotel-price-range">${priceText}</p>
                </div>
            </div>
        </div>
    `;
}

// Render all hotels (with optional limit for homepage)
function renderHotels(hotels, limit = null) {
    const container = document.getElementById('hotelCardsContainer');
    if (!container) {
        console.error('hotelCardsContainer not found in DOM');
        return;
    }
    
    if (!hotels || hotels.length === 0) {
        console.warn('No hotels data to render');
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">
                    <h5>No hotels available</h5>
                    <p>Please check back later.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Limit hotels if specified (for homepage)
    const hotelsToShow = limit ? hotels.slice(0, limit) : hotels;
    
    let html = '';
    hotelsToShow.forEach(hotel => {
        html += buildHotelCard(hotel);
    });
    container.innerHTML = html;
    console.log(`Rendered ${hotelsToShow.length} hotels successfully${limit ? ' (limited from ' + hotels.length + ')' : ''}`);
}

// Load hotels from JSON file
async function loadHotels() {
    console.log('[Hotels] ===== Starting hotel load process =====');
    const container = document.getElementById('hotelCardsContainer');
    
    if (!container) {
        console.error('[Hotels] ❌ hotelCardsContainer element not found in DOM');
        console.error('[Hotels] Available elements:', document.querySelectorAll('[id*="hotel"]'));
        return;
    }
    
    console.log('[Hotels] ✓ Container found:', container);
    
    // Always fetch from API first (localStorage is now only used as fallback)
    console.log('[Hotels] Loading from API...');
    
    try {
        const apiUrl = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.HOTELS);
        console.log(`[Hotels] 🔄 Fetching from API: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        console.log(`[Hotels] Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`[Hotels] ✓ API response received!`, data);
            console.log(`[Hotels] Data type:`, Array.isArray(data) ? 'Array' : typeof data);
            console.log(`[Hotels] Data length:`, data?.length);
            
            if (data && Array.isArray(data) && data.length > 0) {
                hotelsData = data;
                console.log(`[Hotels] ✓ Storing ${data.length} hotels in hotelsData`);
                console.log(`[Hotels] 🔄 Calling renderHotels...`);
                
                // Check if we're on the homepage - limit to 3 hotels
                const isHomePage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
                const limit = isHomePage ? 3 : null;
                
                renderHotels(hotelsData, limit);
                
                // Store in localStorage as cache/backup
                if (window.dataStorage) {
                    window.dataStorage.setStoredData(window.dataStorage.STORAGE_KEYS.hotels, hotelsData);
                    console.log('[Hotels] ✓ Data cached to localStorage');
                }
                console.log(`[Hotels] ✓✓✓ Hotels rendered successfully! ✓✓✓`);
                return;
            } else {
                console.warn(`[Hotels] ⚠️ Data is not a valid array or is empty`);
                console.warn(`[Hotels] Data:`, data);
            }
        } else {
            const errorText = await response.text();
            console.error(`[Hotels] ❌ HTTP ${response.status}: ${response.statusText}`);
            console.error(`[Hotels] Error response:`, errorText);
        }
    } catch (error) {
        console.error(`[Hotels] ❌ Error loading from API:`, error);
        console.error(`[Hotels] Error details:`, error.message, error.stack);
    }
    
    // Error handling - fallback to localStorage if API fails
    console.error('[Hotels] ❌❌❌ Could not load hotels from API ❌❌❌');
    
    // Fallback to localStorage if available
    if (window.dataStorage && window.dataStorage.hasStoredData(window.dataStorage.STORAGE_KEYS.hotels)) {
        console.log('[Hotels] 🔄 Falling back to localStorage data...');
        const storedData = window.dataStorage.getStoredData(window.dataStorage.STORAGE_KEYS.hotels);
        if (storedData && Array.isArray(storedData) && storedData.length > 0) {
            hotelsData = storedData;
            console.log(`[Hotels] ✓ Using ${storedData.length} hotels from localStorage (fallback)`);
            
            const isHomePage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
            const limit = isHomePage ? 3 : null;
            
            renderHotels(hotelsData, limit);
            console.log(`[Hotels] ✓✓✓ Hotels rendered from localStorage fallback! ✓✓✓`);
            return;
        }
    }
    
    // Show error if both API and localStorage fail
    if (container) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <h5>Failed to load hotels</h5>
                    <p>Unable to connect to the API server.</p>
                    <p class="small text-muted">API URL: ${API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.HOTELS)}</p>
                    <p class="small text-muted">Make sure the backend server is running.</p>
                    <p class="small text-muted">Check browser console (F12) for detailed error messages.</p>
                </div>
            </div>
        `;
    }
}

// ===========================
// Hotel Details Modal Functions
// ===========================

function openHotelDetailsModal(hotelId) {
    selectedHotel = hotelsData.find(h => h.id === hotelId);
    if (!selectedHotel) {
        console.error('Hotel not found:', hotelId);
        return;
    }
    
    // Set default room type
    selectedRoomType = 'single';
    
    // Update modal content with hotel details
    const modalHotelName = document.getElementById('detailsHotelName');
    if (modalHotelName) modalHotelName.textContent = selectedHotel.name;
    
    const modalHotelImage = document.getElementById('detailsHotelImage');
    if (modalHotelImage) modalHotelImage.src = selectedHotel.image;
    
    const modalHotelLocation = document.getElementById('detailsHotelLocation');
    if (modalHotelLocation) {
        modalHotelLocation.textContent = `${selectedHotel.city}, ${selectedHotel.country}`;
    }
    
    const modalHotelStars = document.getElementById('detailsHotelStars');
    if (modalHotelStars) modalHotelStars.textContent = renderStars(selectedHotel.stars);
    
    // Display room prices
    const singleInfo = getRoomTypeInfo('single');
    const doubleInfo = getRoomTypeInfo('double');
    const familyInfo = getRoomTypeInfo('family');
    
    const roomPricesList = document.getElementById('roomPricesList');
    if (roomPricesList) {
        roomPricesList.innerHTML = `
            <div class="room-price-item">
                <div class="room-price-item-left">
                    <i class="bi bi-person"></i>
                    <div class="room-price-item-info">
                        <span class="room-name">${singleInfo.label}</span>
                        <span class="room-capacity">1 Guest</span>
                    </div>
                </div>
                <strong>${formatIQD(selectedHotel.prices.single)}</strong>
            </div>
            <div class="room-price-item">
                <div class="room-price-item-left">
                    <i class="bi bi-people"></i>
                    <div class="room-price-item-info">
                        <span class="room-name">${doubleInfo.label}</span>
                        <span class="room-capacity">2 Guests</span>
                    </div>
                </div>
                <strong>${formatIQD(selectedHotel.prices.double)}</strong>
            </div>
            <div class="room-price-item">
                <div class="room-price-item-left">
                    <i class="bi bi-house-door"></i>
                    <div class="room-price-item-info">
                        <span class="room-name">${familyInfo.label}</span>
                        <span class="room-capacity">4+ Guests</span>
                    </div>
                </div>
                <strong>${formatIQD(selectedHotel.prices.family)}</strong>
            </div>
        `;
    }
    
    // Show modal using Bootstrap
    const modalElement = document.getElementById('hotelDetailsModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

function proceedToReservation() {
    if (typeof showComingSoonMessage === 'function') {
        showComingSoonMessage();
        return;
    }
    // Close hotel details modal
    const detailsModal = bootstrap.Modal.getInstance(document.getElementById('hotelDetailsModal'));
    if (detailsModal) detailsModal.hide();
    
    // Open reservation form modal
    openReservationModal();
}

// ===========================
// Reservation Modal Functions
// ===========================

function openReservationModal() {
    if (!selectedHotel) {
        console.error('No hotel selected');
        return;
    }
    
    // Update modal content
    const modalHotelName = document.getElementById('modalHotelName');
    if (modalHotelName) modalHotelName.textContent = selectedHotel.name;
    
    const modalHotelLocation = document.getElementById('modalHotelLocation');
    if (modalHotelLocation) {
        const locationSpan = modalHotelLocation.querySelector('span');
        if (locationSpan) {
            locationSpan.textContent = `${selectedHotel.city}, ${selectedHotel.country}`;
        }
    }
    
    const modalHotelStars = document.getElementById('modalHotelStars');
    if (modalHotelStars) modalHotelStars.textContent = renderStars(selectedHotel.stars);
    
    // Setup room type selector
    const singleInfo = getRoomTypeInfo('single');
    const doubleInfo = getRoomTypeInfo('double');
    const familyInfo = getRoomTypeInfo('family');
    
    const roomTypeSelect = document.getElementById('modalRoomTypeSelect');
    if (roomTypeSelect) {
        roomTypeSelect.innerHTML = `
            <option value="single">${singleInfo.label} - ${formatIQD(selectedHotel.prices.single)}</option>
            <option value="double">${doubleInfo.label} - ${formatIQD(selectedHotel.prices.double)}</option>
            <option value="family">${familyInfo.label} - ${formatIQD(selectedHotel.prices.family)}</option>
        `;
        roomTypeSelect.value = selectedRoomType;
        
        // Update price when room type changes
        roomTypeSelect.onchange = function() {
            selectedRoomType = this.value;
            calculateHotelPrice();
        };
    }
    
    // Clear form fields first
    const firstName = document.getElementById('customerFirstName');
    const secondName = document.getElementById('customerSecondName');
    const surname = document.getElementById('customerSurname');
    const customerPhone = document.getElementById('customerPhone');
    const customerEmail = document.getElementById('customerEmail');
    const checkInDate = document.getElementById('hotelCheckInDate');
    const checkOutDate = document.getElementById('hotelCheckOutDate');
    
    if (firstName) firstName.value = '';
    if (secondName) secondName.value = '';
    if (surname) surname.value = '';
    if (customerPhone) customerPhone.value = '';
    if (customerEmail) customerEmail.value = '';
    if (checkInDate) checkInDate.value = '';
    if (checkOutDate) checkOutDate.value = '';
    
    // Reset calculated price
    calculatedHotelPrice = null;
    
    // Setup date listeners and calculate initial price (after fields are cleared)
    setupHotelDateListeners();
    calculateHotelPrice();
    
    // Hide error message
    const reservationError = document.getElementById('reservationError');
    if (reservationError) reservationError.style.display = 'none';
    
    // Reset button state
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const continuePaymentBtn = document.getElementById('continuePaymentBtn');
    
    if (btnText) btnText.textContent = 'Confirm Reservation';
    if (btnSpinner) btnSpinner.style.display = 'none';
    if (continuePaymentBtn) continuePaymentBtn.disabled = false;
    
    // Show modal using Bootstrap
    const modalElement = document.getElementById('reservationModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        // Recalculate price after modal is shown (in case dates are filled)
        setTimeout(() => {
            calculateHotelPrice();
        }, 100);
    }
}

function setButtonLoading(loading) {
    const btn = document.getElementById('continuePaymentBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    
    if (loading) {
        btn.disabled = true;
        if (btnText) btnText.textContent = 'Processing...';
        if (btnSpinner) btnSpinner.style.display = 'inline-block';
    } else {
        btn.disabled = false;
        if (btnText) btnText.textContent = 'Confirm Reservation';
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}

// Store calculated price
let calculatedHotelPrice = null;

// Calculate hotel price based on dates and room type
function calculateHotelPrice() {
    const checkInInput = document.getElementById('hotelCheckInDate');
    const checkOutInput = document.getElementById('hotelCheckOutDate');
    const roomTypeSelect = document.getElementById('modalRoomTypeSelect');
    
    if (!checkInInput || !checkOutInput || !roomTypeSelect || !selectedHotel) {
        console.log('[Hotel Price] Missing elements:', { checkInInput: !!checkInInput, checkOutInput: !!checkOutInput, roomTypeSelect: !!roomTypeSelect, selectedHotel: !!selectedHotel });
        return;
    }
    
    const checkIn = checkInInput.value ? new Date(checkInInput.value) : null;
    const checkOut = checkOutInput.value ? new Date(checkOutInput.value) : null;
    const roomType = roomTypeSelect.value;
    
    // Get base price for selected room type
    let basePrice = 0;
    if (roomType === 'single' && selectedHotel.prices?.single) {
        basePrice = selectedHotel.prices.single;
    } else if (roomType === 'double' && selectedHotel.prices?.double) {
        basePrice = selectedHotel.prices.double;
    } else if (roomType === 'family' && selectedHotel.prices?.family) {
        basePrice = selectedHotel.prices.family;
    }
    
    // If dates are selected, calculate total price
    if (checkIn && checkOut) {
        // Validate dates
        if (checkOut <= checkIn) {
            const errorDiv = document.getElementById('reservationError');
            if (errorDiv) {
                errorDiv.textContent = 'Check-out date must be after check-in date';
                errorDiv.style.display = 'block';
            }
            calculatedHotelPrice = null;
            return;
        }
        
        // Calculate nights (difference in days)
        const timeDiff = checkOut.getTime() - checkIn.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        console.log('[Hotel Price] Calculating:', { checkIn: checkInInput.value, checkOut: checkOutInput.value, nights, basePrice, total: basePrice * nights });
        
        // Calculate total: basePrice * nights
        calculatedHotelPrice = basePrice * nights;
        
        // Update display
        const priceElement = document.getElementById('modalSelectedPrice');
        if (priceElement) {
            priceElement.innerHTML = `
                <strong>${formatIQD(calculatedHotelPrice)}</strong>
                <div class="small text-muted mt-1">${formatIQD(basePrice)} × ${nights} ${nights === 1 ? 'night' : 'nights'}</div>
            `;
        }
    } else {
        // No dates selected, show base price
        calculatedHotelPrice = basePrice;
        const priceElement = document.getElementById('modalSelectedPrice');
        if (priceElement) {
            priceElement.innerHTML = `<strong>${formatIQD(basePrice)}</strong>`;
        }
    }
    
    // Clear any errors
    const errorDiv = document.getElementById('reservationError');
    if (errorDiv) errorDiv.style.display = 'none';
}

// Setup date listeners
function setupHotelDateListeners() {
    const checkInInput = document.getElementById('hotelCheckInDate');
    const checkOutInput = document.getElementById('hotelCheckOutDate');
    
    if (checkInInput) {
        // Set minimum date to today
        checkInInput.min = new Date().toISOString().split('T')[0];
        
        // Remove old listeners and add new ones
        const checkInHandler = function() {
            const checkOut = document.getElementById('hotelCheckOutDate');
            if (this.value && checkOut) {
                // Set minimum check-out to day after check-in
                const checkInDate = new Date(this.value);
                checkInDate.setDate(checkInDate.getDate() + 1);
                checkOut.min = checkInDate.toISOString().split('T')[0];
                
                // If check-out is before new minimum, clear it
                if (checkOut.value && new Date(checkOut.value) <= checkInDate) {
                    checkOut.value = '';
                }
            }
            // Use setTimeout to ensure value is updated
            setTimeout(calculateHotelPrice, 10);
        };
        
        // Remove existing listeners by replacing with new handler
        checkInInput.onchange = null;
        checkInInput.addEventListener('change', checkInHandler);
        checkInInput.addEventListener('input', checkInHandler);
    }
    
    if (checkOutInput) {
        const checkOutHandler = function() {
            // Use setTimeout to ensure value is updated
            setTimeout(calculateHotelPrice, 10);
        };
        
        // Remove existing listeners by replacing with new handler
        checkOutInput.onchange = null;
        checkOutInput.addEventListener('change', checkOutHandler);
        checkOutInput.addEventListener('input', checkOutHandler);
    }
}

// ===========================
// API Integration - Payment Flow
// ===========================

async function handleContinueToPayment() {
    if (!selectedHotel) return;
    
    // Get customer info
    const firstName = document.getElementById('customerFirstName').value.trim();
    const secondName = document.getElementById('customerSecondName').value.trim();
    const surname = document.getElementById('customerSurname').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerEmail = document.getElementById('customerEmail').value.trim();
    
    // Combine names
    const customerName = `${firstName} ${secondName} ${surname}`.trim();
    
    // Validate terms checkbox
    const termsCheckbox = document.getElementById('reservationTerms');
    if (!termsCheckbox || !termsCheckbox.checked) {
        const errorDiv = document.getElementById('reservationError');
        if (errorDiv) {
            errorDiv.textContent = 'You must agree to the non-refundable terms to proceed';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    // Hide any previous error
    const errorDiv = document.getElementById('reservationError');
    if (errorDiv) errorDiv.style.display = 'none';
    
    // Get dates - convert empty strings to null
    const checkInDateInput = document.getElementById('hotelCheckInDate');
    const checkOutDateInput = document.getElementById('hotelCheckOutDate');
    const checkInDate = checkInDateInput?.value?.trim() || null;
    const checkOutDate = checkOutDateInput?.value?.trim() || null;
    
    // Use calculated price if dates are selected, otherwise use base price
    const amount = calculatedHotelPrice !== null ? calculatedHotelPrice : selectedHotel.prices[selectedRoomType];
    const roomInfo = getRoomTypeInfo(selectedRoomType);
    
    // Show loading state
    setButtonLoading(true);
    
    try {
        // Validate required fields before sending
        if (!selectedHotel || !selectedHotel.id) {
            throw new Error('Hotel information is missing');
        }
        
        if (!roomInfo || !roomInfo.key) {
            throw new Error('Room type is missing');
        }
        
        if (!amount || amount <= 0) {
            throw new Error('Invalid amount');
        }
        
        // Step 0: Check daily reservation limit BEFORE creating reservation
        console.log('[Hotels] Checking daily reservation limit...');
        const limitCheckResponse = await fetch(`${getApiBaseUrl()}/payment/check-reservation-limit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amount })
        });
        
        if (limitCheckResponse.ok) {
            const limitData = await limitCheckResponse.json();
            if (!limitData.allowed) {
                // Show limit error message
                const errorDiv = document.getElementById('reservationError');
                if (errorDiv) {
                    errorDiv.textContent = limitData.message || 'Sorry, we can\'t accept any reservation today. The daily limit has been reached. Please try again tomorrow.';
                    errorDiv.style.display = 'block';
                    errorDiv.className = 'alert alert-warning mt-3';
                }
                setButtonLoading(false);
                console.warn('[Hotels] Daily limit reached. Current total:', limitData.currentTotal, 'Limit:', limitData.limit);
                return; // Stop here, don't proceed with reservation
            }
            console.log('[Hotels] ✓ Daily limit check passed. Remaining:', limitData.remaining);
        } else {
            console.warn('[Hotels] Failed to check limit, proceeding anyway...');
            // Continue if limit check fails (don't block reservation)
        }
        
        // Step 1: Create reservation via backend
        // Note: Backend expects ReservationType enum (0=Hotel, 1=Group, 2=PlaneTicket)
        // Validate customer information before creating reservation
        if (!customerName || customerName.trim() === '' || 
            customerName.trim().toLowerCase() === 'guest' || 
            customerName.trim().toLowerCase() === 'n/a') {
            showError('Please enter your full name');
            setButtonLoading(false);
            return;
        }

        if (!customerPhone || customerPhone.trim() === '' || 
            customerPhone.trim().toLowerCase() === 'n/a') {
            showError('Please enter your phone number');
            setButtonLoading(false);
            return;
        }

        if (!customerEmail || customerEmail.trim() === '' || 
            customerEmail.trim().toLowerCase() === 'n/a') {
            showError('Please enter your email address');
            setButtonLoading(false);
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail.trim())) {
            showError('Please enter a valid email address');
            setButtonLoading(false);
            return;
        }

        // Validate phone contains digits
        if (customerPhone.trim().length < 5 || !/\d/.test(customerPhone)) {
            showError('Phone number must be at least 5 characters and contain digits');
            setButtonLoading(false);
            return;
        }

        const reservationPayload = {
            reservationType: 0, // ReservationType.Hotel = 0
            hotelId: String(selectedHotel.id),
            hotelName: selectedHotel.name || '',
            city: selectedHotel.city || '',
            country: selectedHotel.country || '',
            roomType: roomInfo.key,
            amount: amount,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail.trim(),
            checkInDate: checkInDate || null,  // Ensure null instead of empty string
            checkOutDate: checkOutDate || null  // Ensure null instead of empty string
        };
        
        console.log('[Hotels] Reservation payload with dates:', {
            checkInDate: reservationPayload.checkInDate,
            checkOutDate: reservationPayload.checkOutDate,
            checkInDateType: typeof reservationPayload.checkInDate,
            checkOutDateType: typeof reservationPayload.checkOutDate
        });
        
        console.log('[Hotels] Creating reservation with payload:', reservationPayload);
        console.log('[Hotels] Selected hotel:', selectedHotel);
        console.log('[Hotels] Room info:', roomInfo);
        
        const reservationResponse = await fetch(`${getApiBaseUrl()}/payment/create-hotel-reservation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservationPayload)
        });
        
        if (!reservationResponse.ok) {
            const errorData = await reservationResponse.json().catch(() => ({}));
            const errorMessage = errorData.message || `HTTP ${reservationResponse.status}`;
            console.error('[Hotels] Reservation failed:', errorMessage, errorData);
            throw new Error(errorMessage);
        }
        
        const reservationData = await reservationResponse.json();
        if (!(reservationData.success && reservationData.invoiceId)) {
            throw new Error(reservationData.message || 'Failed to create reservation');
        }
        
        const invoiceId = reservationData.invoiceId;
        
        // Store reservation info
        const pendingReservation = {
            invoiceId,
            paymentId: reservationData.paymentId,
            hotelId: selectedHotel.id,
            hotelName: selectedHotel.name,
            city: selectedHotel.city,
            country: selectedHotel.country,
            roomType: roomInfo.label,
            roomTypeKey: roomInfo.key,
            amount,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail.trim(),
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('lastReservation', JSON.stringify(pendingReservation));
        
        // Step 2: Create payment with gateway and redirect
        const finishPaymentUrl = `${window.location.origin}/payment-finish.html?invoiceId=${encodeURIComponent(invoiceId)}`;
        const notificationUrl = `${getApiBaseUrl()}/payment/webhook`;
        
        const paymentResponse = await fetch(`${getApiBaseUrl()}/payment/create-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amount,
                currency: 'IQD',
                locale: 'ar_IQ',
                finishPaymentUrl,
                notificationUrl,
                invoiceId,
                hotelId: String(selectedHotel.id),
                hotelName: selectedHotel.name,
                roomType: roomInfo.key,
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim(),
                customerEmail: customerEmail.trim()
            })
        });
        
        if (!paymentResponse.ok) {
            throw new Error(`HTTP ${paymentResponse.status}`);
        }
        
        const paymentData = await paymentResponse.json();
        if (!(paymentData.success && paymentData.formUrl)) {
            throw new Error(paymentData.message || 'Failed to create payment');
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('reservationModal'));
        if (modal) modal.hide();
        
        // Redirect to gateway payment page
        window.location.href = paymentData.formUrl;
        
    } catch (error) {
        console.error('Reservation/Payment error:', error);
        const errorDiv = document.getElementById('reservationError');
        if (errorDiv) {
            // Show the actual error message from the backend
            const errorMessage = error.message || 'An error occurred. Please try again.';
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
            // Use warning style for reservation limits/disabled, danger for other errors
            if (errorMessage.includes('disabled') || 
                errorMessage.includes('limit') || 
                errorMessage.includes("can't accept")) {
                errorDiv.className = 'alert alert-warning mt-3';
            } else {
                errorDiv.className = 'alert alert-danger mt-3';
            }
        }
        setButtonLoading(false);
    }
}

// ===========================
// Initialize on Page Load
// ===========================

// Simple, reliable initialization
console.log('[Hotels] Setting up initialization...');
console.log('[Hotels] Document ready state:', document.readyState);

(function() {
    function initHotels() {
        // Check if Hotels section is visible before loading (only hide if explicitly false)
        if (typeof window.sectionVisibility !== 'undefined' && window.sectionVisibility.Hotels === false) {
            console.log('[Hotels] Section is hidden (API returned false), skipping hotel load');
            const hotelsSection = document.getElementById('hotels');
            if (hotelsSection) {
                hotelsSection.style.display = 'none';
                hotelsSection.style.visibility = 'hidden';
                hotelsSection.classList.add('hidden-section');
            }
            // Also hide the container
            const container = document.getElementById('hotelCardsContainer');
            if (container) {
                container.style.display = 'none';
            }
            return false;
        }
        
        // Also check using isSectionVisible function (only hide if explicitly false)
        if (typeof window.isSectionVisible === 'function' && window.isSectionVisible('Hotels') === false) {
            console.log('[Hotels] Section is hidden (from isSectionVisible), skipping hotel load');
            const hotelsSection = document.getElementById('hotels');
            if (hotelsSection) {
                hotelsSection.style.display = 'none';
                hotelsSection.style.visibility = 'hidden';
                hotelsSection.classList.add('hidden-section');
            }
            const container = document.getElementById('hotelCardsContainer');
            if (container) {
                container.style.display = 'none';
            }
            return false;
        }
        
        console.log('[Hotels] initHotels() called - section is visible, loading hotels...');
        const container = document.getElementById('hotelCardsContainer');
        if (container) {
            console.log('[Hotels] ✓ Container found, loading hotels...');
            loadHotels();
            return true;
        } else {
            console.warn('[Hotels] ⚠️ Container not found yet');
        }
        return false;
    }

    // Wait for section visibility to load first using the promise
    function waitForVisibilityThenInit() {
        if (window.sectionVisibilityPromise) {
            // Wait for visibility to load
            window.sectionVisibilityPromise.then(() => {
                console.log('[Hotels] Section visibility loaded, checking before initializing...');
                initHotels();
            }).catch(() => {
                console.warn('[Hotels] Section visibility promise failed, proceeding anyway');
                initHotels();
            });
        } else if (window.waitForSectionVisibility) {
            // Use the wait function
            window.waitForSectionVisibility(() => {
                console.log('[Hotels] Section visibility ready, checking before initializing...');
                initHotels();
            });
        } else {
            // Fallback: check if already loaded
            if (typeof window.sectionVisibility !== 'undefined') {
                initHotels();
            } else {
                // Wait a bit more
                setTimeout(waitForVisibilityThenInit, 100);
            }
        }
    }

    // Try immediately if DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log('[Hotels] DOM already ready, waiting for section visibility...');
        waitForVisibilityThenInit();
    } else {
        console.log('[Hotels] DOM still loading, waiting for DOMContentLoaded...');
    }

    // Also listen for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[Hotels] ✓ DOMContentLoaded event fired - waiting for visibility then initializing');
        waitForVisibilityThenInit();
    });

    // Final fallback after 2 seconds (give more time for visibility to load)
    setTimeout(function() {
        console.log('[Hotels] Fallback check after 2 seconds...');
        const container = document.getElementById('hotelCardsContainer');
        if (container) {
            // Check visibility before loading (only hide if explicitly false)
            if (typeof window.sectionVisibility !== 'undefined' && window.sectionVisibility.Hotels === false) {
                console.log('[Hotels] Section is hidden (API returned false), skipping load');
                const hotelsSection = document.getElementById('hotels');
                if (hotelsSection) {
                    hotelsSection.style.display = 'none';
                    hotelsSection.style.visibility = 'hidden';
                    hotelsSection.classList.add('hidden-section');
                }
                if (container) {
                    container.style.display = 'none';
                }
                return;
            }
            
            // If visibility not loaded yet or Hotels is true/undefined, proceed with load
            if (typeof window.sectionVisibility === 'undefined' || window.sectionVisibility.Hotels !== false) {
                const hasHotels = container.querySelector('.hotel-card') !== null;
                if (!hasHotels) {
                    console.warn('[Hotels] ⚠️ Hotels not loaded after 2 seconds, retrying...');
                    initHotels();
                } else {
                    console.log('[Hotels] ✓ Hotels already loaded');
                }
            }
            
            const hasHotels = container.querySelector('.hotel-card') !== null;
            if (!hasHotels && (typeof window.sectionVisibility === 'undefined' || window.sectionVisibility.Hotels !== false)) {
                console.warn('[Hotels] ⚠️ Hotels not loaded after 2 seconds, retrying...');
                initHotels();
            } else if (hasHotels) {
                console.log('[Hotels] ✓ Hotels already loaded');
            }
        } else {
            console.error('[Hotels] ❌ Container still not found after 2 seconds!');
        }
    }, 2000);
})();

// Export functions globally for debugging
window.loadHotels = loadHotels;
window.renderHotels = renderHotels;
window.hotelsData = hotelsData;