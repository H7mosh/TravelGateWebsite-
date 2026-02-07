/**
 * Flight Packages System
 * Handles loading and displaying flight packages from API
 */

// Wrap in IIFE to avoid variable conflicts with other scripts
(function() {
'use strict';

// Immediate console log to verify script is loading
try {
    console.log('=== FLIGHTS SCRIPT LOADED ===');
    console.log('[Flights] Script file executing at:', new Date().toISOString());
    console.log('[Flights] window.loadFlights exists?', typeof window.loadFlights);
} catch(e) {
    console.error('[Flights] ERROR in initial log:', e);
}

// Flight packages data storage
let flightsData = [];
let selectedFlight = null;
let currentFilter = 'all';

console.log('=== FLIGHTS VARIABLES INITIALIZED ===');

// Create a placeholder function on window immediately so main.js can find it
// This will be replaced with the actual function when it's defined
window.loadFlights = function() {
    console.log('[Flights] loadFlights called (placeholder)');
    console.warn('[Flights] Real loadFlights function not yet defined - will be available soon');
    // The real function will be assigned at line 357
};
console.log('[Flights] ✓ Placeholder loadFlights function added to window');

// ===========================
// Utility Functions
// ===========================

function formatIQD(amount) {
    if (!amount) return 'Contact for pricing';
    return new Intl.NumberFormat('en-IQ', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount) + ' IQD';
}

function getClassBadgeColor(flightClass) {
    switch (flightClass) {
        case 'Economy':
            return 'bg-warning text-dark';
        case 'Business':
            return 'bg-info text-white';
        case 'First':
            return 'bg-success text-white';
        default:
            return 'bg-secondary text-white';
    }
}

// ===========================
// Flight Card Building
// ===========================

function buildFlightCard(flight) {
    const tripTypeIcon = flight.tripType === 'Round-trip' 
        ? '<i class="bi bi-arrow-left-right"></i>'
        : '<i class="bi bi-arrow-right"></i>';
    
    const tripTypeText = flight.tripType || 'One-way';
    const classBadge = getClassBadgeColor(flight.class);
    const route = `${flight.origin} → ${flight.destination}`;
    
    // Get class icon
    const classIcon = flight.class === 'Business' 
        ? '<i class="bi bi-star-fill"></i>'
        : flight.class === 'First' 
        ? '<i class="bi bi-gem"></i>'
        : '<i class="bi bi-star"></i>';
    
    // Build features list
    let featuresHtml = '';
    const featuresList = [];
    
    if (flight.features && Array.isArray(flight.features) && flight.features.length > 0) {
        flight.features.forEach(feature => {
            featuresList.push(feature);
        });
    } else {
        // Default features
        if (flight.airline) {
            featuresList.push(flight.airline);
        }
        if (flight.class) {
            featuresList.push(`${flight.class} Class`);
        }
        if (flight.baggage) {
            featuresList.push(flight.baggage);
        }
        featuresList.push(tripTypeText);
    }
    
    featuresHtml = featuresList.slice(0, 4).map(feature => 
        `<span class="flight-feature-tag"><i class="bi bi-check-circle-fill"></i> ${feature}</span>`
    ).join('');
    
    return `
        <div class="col-md-6 col-xl-4">
            <div class="flight-card h-100" data-flight-id="${flight.id}" data-class="${flight.class}" onclick="openFlightBookingModal(${flight.id})">
                <div class="flight-card-inner">
                    <!-- Top Badges -->
                    <div class="flight-badges-top">
                        <span class="flight-trip-badge">
                            ${tripTypeIcon} ${tripTypeText}
                        </span>
                        <span class="flight-class-badge ${classBadge}">
                            ${classIcon} ${flight.class || 'Economy'}
                        </span>
                    </div>
                    
                    <!-- Airline Logo/Icon -->
                    <div class="flight-airline-section">
                        ${flight.airlineLogo ? `
                            <div class="flight-logo-wrapper">
                                <img src="${flight.airlineLogo}" alt="${flight.airline}" class="flight-airline-logo">
                            </div>
                        ` : `
                            <div class="flight-icon-wrapper">
                                <div class="flight-icon-circle">
                                    <i class="bi bi-airplane-fill"></i>
                                </div>
                            </div>
                        `}
                    </div>
                    
                    <!-- Route Information -->
                    <div class="flight-route-section">
                        <h3 class="flight-route">${route}</h3>
                        <p class="flight-airline-name">${flight.airline || 'Flight Service'}</p>
                    </div>
                    
                    <!-- Price Section -->
                    <div class="flight-price-section">
                        <div class="flight-price-label">FIXED PRICE</div>
                        <div class="flight-price-amount">${formatIQD(flight.price)}</div>
                    </div>
                    
                    <!-- Features -->
                    <div class="flight-features-section">
                        ${featuresHtml}
                    </div>
                    
                    <!-- Hover Overlay -->
                    <div class="flight-card-overlay">
                        <button class="btn-flight-select">
                            <i class="bi bi-calendar-check me-2"></i>Select Package
                        </button>
                    </div>
                    
                    <!-- Decorative Elements -->
                    <div class="flight-card-decoration"></div>
                </div>
            </div>
        </div>
    `;
}

// ===========================
// Rendering Functions
// ===========================

function renderFlights(flights, filter = 'all', limit = null) {
    console.log('[Flights] renderFlights called with:', flights, 'Filter:', filter, 'Limit:', limit);
    
    // Check for both homepage and flights page containers
    let container = document.getElementById('flights-list');
    let isHomePage = false;
    
    if (!container) {
        container = document.getElementById('flights-list-home');
        isHomePage = true;
    }
    
    console.log('[Flights] Container:', container, 'isHomePage:', isHomePage);
    
    if (!container) {
        console.error('[Flights] flights-list container not found in DOM!');
        return;
    }
    
    // Validate flights data
    if (!flights || !Array.isArray(flights) || flights.length === 0) {
        console.warn('[Flights] No flights data provided or empty array');
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning text-center">
                    <p>No flight packages available at the moment.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Filter flights based on class
    let filteredFlights = flights;
    if (filter !== 'all') {
        filteredFlights = flights.filter(f => f.class === filter);
    }
    
    console.log('[Flights] Filtered flights count:', filteredFlights.length);
    
    if (filteredFlights.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <p>No ${filter} flights available.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Apply limit if specified (for homepage)
    const flightsToShow = limit ? filteredFlights.slice(0, limit) : filteredFlights;
    console.log('[Flights] Showing', flightsToShow.length, 'out of', filteredFlights.length, 'flights');
    
    // Clear existing content
    container.innerHTML = '';
    
    // Build HTML for each flight
    console.log('[Flights] Building HTML for', flightsToShow.length, 'flights');
    let html = '';
    flightsToShow.forEach((flight, index) => {
        const cardHtml = buildFlightCard(flight);
        html += cardHtml;
    });
    
    console.log('[Flights] Total HTML length:', html.length);
    console.log('[Flights] Setting innerHTML...');
    container.innerHTML = html;
    
    // Verify cards were added
    const renderedCards = container.querySelectorAll('.flight-card');
    console.log('[Flights] ✓ Rendered', renderedCards.length, 'flight cards in DOM');
}

// ===========================
// Data Loading
// ===========================

// Define loadFlights function (replaces the placeholder)
async function loadFlights() {
    console.log('[Flights] loadFlights() called');
    console.log('[Flights] Current URL:', window.location.href);
    
    // Check for both homepage and flights page containers
    let container = document.getElementById('flights-list');
    let isHomePage = false;
    
    if (!container) {
        container = document.getElementById('flights-list-home');
        isHomePage = true;
    }
    
    if (!container) {
        console.error('[Flights] No flights container found! Available containers:', {
            flightsList: !!document.getElementById('flights-list'),
            flightsListHome: !!document.getElementById('flights-list-home')
        });
        return;
    }
    
    console.log('[Flights] Container found:', container.id, 'isHomePage:', isHomePage);
    
    // Always fetch from API first
    console.log('[Flights] Loading from API...');
    
    try {
        const apiUrl = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.FLIGHT_PACKAGES);
        console.log(`[Flights] 🔄 Fetching from API: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        console.log(`[Flights] Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`[Flights] ✓ API response received!`);
            console.log(`[Flights] Data length:`, data?.length);
            
            flightsData = data;
            console.log('[Flights] ✓ Flights loaded successfully!');
            console.log('[Flights] Number of flights:', flightsData ? flightsData.length : 0);
            
            if (flightsData && Array.isArray(flightsData) && flightsData.length > 0) {
                // Check if we're on the homepage - limit to 6 flights
                const isHomePage = window.location.pathname === '/' || 
                                  window.location.pathname.endsWith('index.html') || 
                                  window.location.pathname.endsWith('/') ||
                                  window.location.pathname.includes('index') ||
                                  !window.location.pathname.includes('flights.html');
                
                const limit = isHomePage ? 6 : null;
                console.log('[Flights] Is homepage?', isHomePage, 'Limit:', limit);
                
                renderFlights(flightsData, currentFilter, limit);
                
                // Store in localStorage as cache/backup
                if (window.dataStorage) {
                    window.dataStorage.setStoredData('flights', flightsData);
                    console.log('[Flights] ✓ Data cached to localStorage');
                }
                return; // Success!
            } else {
                console.warn('[Flights] Flights data is empty or invalid');
            }
        } else {
            const errorText = await response.text();
            console.error(`[Flights] ❌ HTTP ${response.status}: ${response.statusText}`);
            console.error(`[Flights] Error response:`, errorText);
        }
    } catch (error) {
        console.error(`[Flights] ❌ Error loading from API:`, error);
        console.error(`[Flights] Error details:`, error.message, error.stack);
    }
    
    // Fallback to localStorage if API fails
    console.log('[Flights] API failed, checking localStorage as fallback...');
    if (window.dataStorage && window.dataStorage.hasStoredData('flights')) {
        console.log('[Flights] 🔍 Found data in localStorage (fallback)');
        const storedData = window.dataStorage.getStoredData('flights');
        if (storedData && Array.isArray(storedData) && storedData.length > 0) {
            flightsData = storedData;
            console.log(`[Flights] ✓ Using ${storedData.length} flights from localStorage (fallback)`);
            
            const isHomePage = window.location.pathname === '/' || 
                              window.location.pathname.endsWith('index.html') || 
                              window.location.pathname.endsWith('/') ||
                              window.location.pathname.includes('index') ||
                              !window.location.pathname.includes('flights.html');
            
            const limit = isHomePage ? 6 : null;
            console.log('[Flights] Is homepage?', isHomePage, 'Limit:', limit);
            
            renderFlights(flightsData, currentFilter, limit);
            return; // Success!
        }
    }
    
    // Error handling - both API and localStorage failed
    console.error('[Flights] ❌❌❌ Could not load flights from API or localStorage ❌❌❌');
    if (container) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger text-center">
                    <h5><i class="bi bi-exclamation-triangle"></i> Failed to load flights</h5>
                    <p>Unable to connect to the API server.</p>
                    <p class="small text-muted">API URL: ${API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.FLIGHT_PACKAGES)}</p>
                    <p class="small text-muted">Make sure the backend server is running.</p>
                    <p class="small text-muted">Check browser console (F12) for detailed error messages.</p>
                </div>
            </div>
        `;
    }
}

// Export loadFlights immediately after definition (replaces placeholder)
window.loadFlights = loadFlights;
console.log('[Flights] ✓✓✓ loadFlights function defined and exported to window ✓✓✓');
console.log('[Flights] Verification - window.loadFlights type:', typeof window.loadFlights);

// ===========================
// Filter Handling
// ===========================

function setupFilters() {
    console.log('[Flights] Setting up filter buttons...');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Only setup filters if we have filter buttons (not on homepage)
    if (filterButtons.length === 0) {
        console.log('[Flights] No filter buttons found - likely on homepage');
        return;
    }
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get filter value
            const filter = this.getAttribute('data-filter');
            console.log('[Flights] Filter changed to:', filter);
            
            // Update current filter
            currentFilter = filter;
            
            // Re-render flights with new filter (no limit on flights page)
            renderFlights(flightsData, currentFilter, null);
        });
    });
    
    console.log('[Flights] ✓ Filter buttons setup complete');
}

// ===========================
// Booking Modal
// ===========================

function openFlightBookingModal(flightId) {
    console.log('[Flights] Opening booking modal for flight:', flightId);
    
    const flight = flightsData.find(f => f.id === flightId);
    if (!flight) {
        console.error('[Flights] Flight not found:', flightId);
        alert('Flight package not found');
        return;
    }
    
    selectedFlight = flight;
    
    // Create or get modal
    let modal = document.getElementById('flightBookingModal');
    if (!modal) {
        modal = createFlightBookingModal();
        document.body.appendChild(modal);
    }
    
    // Populate modal
    populateFlightBookingModal(flight);
    
    // Show modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

function createFlightBookingModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'flightBookingModal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', 'flightBookingModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="flightBookingModalLabel">Book Flight Package</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="flightBookingModalBody">
                    <!-- Content will be populated dynamically -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="handleFlightBooking()" id="confirmFlightBookingBtn">
                        <span class="btn-text">Confirm Booking</span>
                        <span class="spinner-border spinner-border-sm ms-2" style="display: none;"></span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

function populateFlightBookingModal(flight) {
    const modalBody = document.getElementById('flightBookingModalBody');
    if (!modalBody) return;
    
    const route = `${flight.origin} → ${flight.destination}`;
    const classBadge = getClassBadgeColor(flight.class);
    
    modalBody.innerHTML = `
        <div class="transfer-booking-form">
            <!-- Flight Summary -->
            <div class="reservation-summary mb-4 p-3 bg-light rounded">
                <h6 class="mb-2">Flight Package</h6>
                <strong>${route}</strong>
                <p class="text-muted mb-2 small">
                    ${flight.airline || 'Flight'} • <span class="badge ${classBadge}">${flight.class || 'Economy'}</span> • ${flight.tripType || 'One-way'}
                </p>
                ${flight.baggage ? `<p class="text-muted mb-2 small"><i class="bi bi-bag-check"></i> Baggage: ${flight.baggage}</p>` : ''}
                <div class="reservation-summary-item mt-3 p-2 bg-primary bg-opacity-10 rounded">
                    <span class="fw-bold">Total Price:</span>
                    <span class="fw-bold text-primary fs-5">${formatIQD(flight.price)}</span>
                </div>
            </div>

            <!-- Date Selection -->
            <div class="row mb-3 mt-3">
                <div class="col-md-6">
                    <label for="flightDepartureDate" class="form-label">
                        <i class="bi bi-airplane-takeoff me-1"></i>Departure Date
                    </label>
                    <input type="date" class="form-control" id="flightDepartureDate" min="">
                </div>
                <div class="col-md-6">
                    <label for="flightReturnDate" class="form-label">
                        <i class="bi bi-airplane-landing me-1"></i>Return Date
                    </label>
                    <input type="date" class="form-control" id="flightReturnDate" min="">
                </div>
            </div>

            <!-- Date Selection -->
            <div class="row mb-3 mt-3">
                <div class="col-md-6">
                    <label for="flightDepartureDate" class="form-label">
                        <i class="bi bi-airplane-takeoff me-1"></i>Departure Date
                    </label>
                    <input type="date" class="form-control" id="flightDepartureDate" min="">
                </div>
                <div class="col-md-6">
                    <label for="flightReturnDate" class="form-label">
                        <i class="bi bi-airplane-landing me-1"></i>Return Date
                    </label>
                    <input type="date" class="form-control" id="flightReturnDate" min="">
                </div>
            </div>

            <!-- Customer Information -->
            <div class="customer-info-section mt-4">
                <h6><i class="bi bi-person-fill"></i> Your Information</h6>
                
                <div class="row mb-3">
                    <div class="col-md-4">
                        <label for="flightCustomerFirstName" class="form-label">First Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="flightCustomerFirstName" placeholder="John" required>
                    </div>
                    <div class="col-md-4">
                        <label for="flightCustomerSecondName" class="form-label">Second Name</label>
                        <input type="text" class="form-control" id="flightCustomerSecondName" placeholder="Middle">
                    </div>
                    <div class="col-md-4">
                        <label for="flightCustomerSurname" class="form-label">Surname <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="flightCustomerSurname" placeholder="Doe" required>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="flightCustomerPhone" class="form-label">
                            <i class="bi bi-telephone me-1"></i>Phone Number <span class="text-danger">*</span>
                        </label>
                        <input type="tel" class="form-control" id="flightCustomerPhone" placeholder="+964 750 XXX XXXX" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="flightCustomerEmail" class="form-label">
                            <i class="bi bi-envelope me-1"></i>Email Address <span class="text-danger">*</span>
                        </label>
                        <input type="email" class="form-control" id="flightCustomerEmail" placeholder="john@example.com" required>
                    </div>
                </div>
            </div>

            <!-- Terms and Conditions -->
            <div class="mb-3 mt-4">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="flightReservationTerms" required>
                    <label class="form-check-label" for="flightReservationTerms">
                        <strong>I understand that this reservation is non-refundable under any circumstances or excuse.</strong>
                        <span class="text-danger">*</span>
                    </label>
                </div>
            </div>

            <!-- Error Message -->
            <div id="flightBookingError" class="alert alert-danger" style="display: none;"></div>
        </div>
    `;
    
    // Setup date listeners
    setupFlightDateListeners();
}

function setupFlightDateListeners() {
    const departureInput = document.getElementById('flightDepartureDate');
    const returnInput = document.getElementById('flightReturnDate');
    
    if (departureInput) {
        departureInput.min = new Date().toISOString().split('T')[0];
        departureInput.addEventListener('change', function() {
            if (this.value && returnInput) {
                // Set minimum return date to departure date
                const departureDate = new Date(this.value);
                returnInput.min = departureDate.toISOString().split('T')[0];
                
                // If return date is before departure, clear it
                if (returnInput.value && new Date(returnInput.value) < departureDate) {
                    returnInput.value = '';
                }
            }
        });
    }
    
    if (returnInput) {
        returnInput.addEventListener('change', function() {
            if (this.value && departureInput) {
                const returnDate = new Date(this.value);
                const departureDate = departureInput.value ? new Date(departureInput.value) : null;
                
                if (departureDate && returnDate <= departureDate) {
                    showFlightError('Return date must be after departure date');
                    this.value = '';
                }
            }
        });
    }
}

async function handleFlightBooking() {
    console.log('[Flights] Processing flight booking...');
    
    if (!selectedFlight) {
        showFlightError('Please select a flight package');
        return;
    }
    
    // Get customer info
    const firstName = document.getElementById('flightCustomerFirstName')?.value.trim();
    const secondName = document.getElementById('flightCustomerSecondName')?.value.trim();
    const surname = document.getElementById('flightCustomerSurname')?.value.trim();
    const customerPhone = document.getElementById('flightCustomerPhone')?.value.trim();
    const customerEmail = document.getElementById('flightCustomerEmail')?.value.trim();
    
    // Validate required fields
    if (!firstName || !surname || !customerPhone || !customerEmail) {
        showFlightError('Please fill in all required fields');
        return;
    }
    
    // Validate terms checkbox
    const termsCheckbox = document.getElementById('flightReservationTerms');
    if (!termsCheckbox || !termsCheckbox.checked) {
        showFlightError('You must agree to the non-refundable terms to proceed');
        return;
    }
    
    // Combine names
    const customerName = `${firstName} ${secondName} ${surname}`.trim();
    
    // Get dates
    const departureDate = document.getElementById('flightDepartureDate')?.value || null;
    const returnDate = document.getElementById('flightReturnDate')?.value || null;
    
    // Get amount
    const amount = selectedFlight.price;
    if (!amount || amount <= 0) {
        showFlightError('Invalid price. Please select a valid flight package.');
        return;
    }
    
    // Validate flight ID
    if (!selectedFlight.id) {
        showFlightError('Flight ID is missing. Please try selecting the flight again.');
        return;
    }
    
    console.log('[Flights] Creating reservation with data:', {
        reservationType: 'FlightPackage',
        flightPackageId: selectedFlight.id,
        amount: amount,
        customerName: customerName
    });
    
    // Hide error
    hideFlightError();
    
    // Show loading
    setFlightButtonLoading(true);
    
    try {
        // Use shared reservation utility
        if (window.reservationUtils && window.reservationUtils.completeReservationFlow) {
            await window.reservationUtils.completeReservationFlow({
                reservationType: 'FlightPackage',
                flightPackageId: String(selectedFlight.id),
                amount: amount,
                customerName: customerName,
                customerPhone: customerPhone,
                customerEmail: customerEmail,
                city: selectedFlight.origin || '',
                country: '',
                hotelName: `${selectedFlight.airline} - ${selectedFlight.origin} → ${selectedFlight.destination}`,
                departureDate: departureDate,
                returnDate: returnDate
            }, {
                onSuccess: (paymentResult) => {
                    console.log('[Flights] Payment created:', paymentResult);
                    window.location.href = paymentResult.formUrl;
                },
                onError: (error) => {
                    console.error('[Flights] Reservation error:', error);
                    showFlightError(error.message || 'Failed to create reservation. Please try again.');
                    setFlightButtonLoading(false);
                }
            });
        } else {
            throw new Error('Reservation utilities not available');
        }
    } catch (error) {
        console.error('[Flights] Booking error:', error);
        showFlightError(error.message || 'Failed to process booking. Please try again.');
        setFlightButtonLoading(false);
    }
}

function setFlightButtonLoading(loading) {
    const btn = document.querySelector('#flightBookingModal .btn-primary');
    const btnText = btn?.querySelector('.btn-text') || btn?.childNodes[0];
    const btnSpinner = btn?.querySelector('.spinner-border');
    
    if (!btn) return;
    
    if (loading) {
        btn.disabled = true;
        if (btnText && btnText.nodeType === Node.TEXT_NODE) {
            btnText.textContent = 'Processing...';
        } else if (btnText) {
            btnText.textContent = 'Processing...';
        }
        if (btnSpinner) btnSpinner.style.display = 'inline-block';
    } else {
        btn.disabled = false;
        if (btnText && btnText.nodeType === Node.TEXT_NODE) {
            btnText.textContent = 'Confirm Booking';
        } else if (btnText) {
            btnText.textContent = 'Confirm Booking';
        }
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}

function hideFlightError() {
    const errorDiv = document.getElementById('flightBookingError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

function showFlightError(message) {
    const errorDiv = document.getElementById('flightBookingError');
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
        
        // Scroll to error
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// ===========================
// Initialization - Simplified like transfers.js
// ===========================

// Simple initialization exactly like transfers.js
console.log('[Flights] Initialization block executing...');
console.log('[Flights] Document readyState:', document.readyState);

if (document.readyState === 'loading') {
    console.log('[Flights] Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[Flights] ✓ DOM loaded event fired!');
        setTimeout(() => {
            console.log('[Flights] Now calling loadFlights()...');
            if (typeof loadFlights === 'function') {
                loadFlights();
            } else {
                console.error('[Flights] ERROR: loadFlights is not a function!');
            }
            // Only setup filters if we're on the flights page (not homepage)
            const flightsPageContainer = document.getElementById('flights-list');
            if (flightsPageContainer) {
                setupFilters();
            }
        }, 100);
    });
} else {
    // DOM is already loaded
    console.log('[Flights] ✓ DOM already loaded!');
    setTimeout(() => {
        console.log('[Flights] Now calling loadFlights()...');
        if (typeof loadFlights === 'function') {
            loadFlights();
        } else {
            console.error('[Flights] ERROR: loadFlights is not a function!');
        }
        // Only setup filters if we're on the flights page (not homepage)
        const flightsPageContainer = document.getElementById('flights-list');
        if (flightsPageContainer) {
            setupFilters();
        }
    }, 100);
}

console.log('[Flights] Initialization block complete.');

// ===========================
// Homepage Filter Function
// ===========================

function filterHomepageFlights(filter) {
    console.log('[Flights] Filtering homepage flights by:', filter);
    
    // Update active button
    const filterButtons = document.querySelectorAll('.flight-class-filters .filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('active');
        }
    });
    
    // Update current filter and re-render
    currentFilter = filter;
    
    // Check if we're on homepage
    const isHomePage = window.location.pathname === '/' || 
                      window.location.pathname.endsWith('index.html') || 
                      window.location.pathname.endsWith('/') ||
                      window.location.pathname.includes('index') ||
                      !window.location.pathname.includes('flights.html');
    
    const limit = isHomePage ? 6 : null;
    renderFlights(flightsData, currentFilter, limit);
}

// Export all functions for global access (loadFlights already exported at line 354)
window.openFlightBookingModal = openFlightBookingModal;
window.handleFlightBooking = handleFlightBooking;
window.filterHomepageFlights = filterHomepageFlights;

// Initialization code is above - this section is just for exports

})(); // End of IIFE - closes the scope to prevent variable conflicts

