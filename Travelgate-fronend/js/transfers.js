/**
 * Transfers System
 * Handles loading and displaying transfer packages from transfers.json
 */

// Wrap in IIFE to avoid variable conflicts with other scripts
(function() {
'use strict';

console.log('=== TRANSFERS SCRIPT LOADED ===');

// Transfers data storage
let transfersData = [];
let selectedTransfer = null;
let currentFilter = 'all';

console.log('=== TRANSFERS VARIABLES INITIALIZED ===');

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

// ===========================
// Transfer Card Building
// ===========================

function buildTransferCard(transfer) {
    const tripTypeIcon = transfer.tripType === 'round-trip' 
        ? '<i class="bi bi-arrow-left-right"></i>'
        : '<i class="bi bi-arrow-right"></i>';
    
    const tripTypeText = transfer.tripType === 'round-trip' ? 'Round-trip' : 'One-way';
    
    return `
        <div class="col-md-6 col-xl-4">
            <div class="transfer-card h-100" data-transfer-id="${transfer.id}" data-trip-type="${transfer.tripType}" onclick="openTransferBookingModal(${transfer.id})">
                <div class="transfer-card-inner">
                    <div class="transfer-badge-top">
                        <span class="trip-type-badge">
                            ${tripTypeIcon} ${tripTypeText}
                        </span>
                    </div>
                    
                    <div class="transfer-icon-circle">
                        <i class="bi bi-truck-front-fill"></i>
                    </div>
                    
                    <div class="transfer-content">
                        <h3 class="transfer-route">${transfer.route}</h3>
                        <p class="transfer-service-type">${transfer.serviceType}</p>
                        
                        <div class="transfer-price-section">
                            <div class="price-label">Fixed Price</div>
                            <div class="price-amount">${formatIQD(transfer.price)}</div>
                        </div>
                        
                        <div class="transfer-features-tags">
                            <span class="feature-tag"><i class="bi bi-shield-check"></i> Guaranteed Price</span>
                            <span class="feature-tag"><i class="bi bi-clock"></i> 24/7 Available</span>
                        </div>
                    </div>
                    
                    <div class="transfer-card-overlay">
                        <button class="btn-book-transfer">
                            <i class="bi bi-calendar-check"></i> Book Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===========================
// Rendering Functions
// ===========================

function renderTransfers(transfers, filter = 'all', limit = null) {
    console.log('[Transfers] renderTransfers called with:', transfers, 'Filter:', filter, 'Limit:', limit);
    
    // Check for both homepage and transfers page containers
    let container = document.getElementById('transfers-list');
    let isHomePage = false;
    
    if (!container) {
        container = document.getElementById('transfers-list-home');
        isHomePage = true;
    }
    
    console.log('[Transfers] Container:', container, 'isHomePage:', isHomePage);
    
    if (!container) {
        console.error('[Transfers] transfers-list container not found in DOM!');
        return;
    }
    
    // Validate transfers data
    if (!transfers || !Array.isArray(transfers) || transfers.length === 0) {
        console.warn('[Transfers] No transfers data provided or empty array');
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning text-center">
                    <p>No transfer packages available at the moment.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Filter transfers based on trip type
    let filteredTransfers = transfers;
    if (filter !== 'all') {
        filteredTransfers = transfers.filter(t => t.tripType === filter);
    }
    
    console.log('[Transfers] Filtered transfers count:', filteredTransfers.length);
    
    if (filteredTransfers.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <p>No ${filter} transfers available.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Apply limit if specified (for homepage)
    const transfersToShow = limit ? filteredTransfers.slice(0, limit) : filteredTransfers;
    console.log('[Transfers] Showing', transfersToShow.length, 'out of', filteredTransfers.length, 'transfers');
    
    // Clear existing content
    container.innerHTML = '';
    
    // Build HTML for each transfer
    console.log('[Transfers] Building HTML for', transfersToShow.length, 'transfers');
    let html = '';
    transfersToShow.forEach((transfer, index) => {
        const cardHtml = buildTransferCard(transfer);
        html += cardHtml;
    });
    
    console.log('[Transfers] Total HTML length:', html.length);
    console.log('[Transfers] Setting innerHTML...');
    container.innerHTML = html;
    
    // Verify cards were added
    const renderedCards = container.querySelectorAll('.transfer-card');
    console.log('[Transfers] ✓ Rendered', renderedCards.length, 'transfer cards in DOM');
}

// ===========================
// Data Loading
// ===========================

async function loadTransfers() {
    console.log('[Transfers] loadTransfers() called');
    console.log('[Transfers] Current URL:', window.location.href);
    
    // Check for both homepage and transfers page containers
    let container = document.getElementById('transfers-list');
    if (!container) {
        container = document.getElementById('transfers-list-home');
    }
    
    if (!container) {
        console.error('[Transfers] No transfers container found!');
        return;
    }
    
    console.log('[Transfers] Container found:', container.id);
    
    // Always fetch from API first (localStorage is now only used as fallback)
    console.log('[Transfers] Loading from API...');
    
    try {
        const apiUrl = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.TRANSFERS);
        console.log(`[Transfers] 🔄 Fetching from API: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        console.log(`[Transfers] Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`[Transfers] ✓ API response received!`);
            console.log(`[Transfers] Data length:`, data?.length);
            
            transfersData = data;
            console.log('[Transfers] ✓ Transfers loaded successfully!');
            console.log('[Transfers] Number of transfers:', transfersData ? transfersData.length : 0);
            
            if (transfersData && Array.isArray(transfersData) && transfersData.length > 0) {
                // Check if we're on the homepage - limit to 6 transfers
                const isHomePage = window.location.pathname === '/' || 
                                  window.location.pathname.endsWith('index.html') || 
                                  window.location.pathname.endsWith('/') ||
                                  window.location.pathname.includes('index') ||
                                  !window.location.pathname.includes('transfers.html');
                
                const limit = isHomePage ? 6 : null;
                console.log('[Transfers] Is homepage?', isHomePage, 'Limit:', limit);
                
                renderTransfers(transfersData, currentFilter, limit);
                
                // Store in localStorage as cache/backup
                if (window.dataStorage) {
                    window.dataStorage.setStoredData(window.dataStorage.STORAGE_KEYS.transfers, transfersData);
                    console.log('[Transfers] ✓ Data cached to localStorage');
                }
                return; // Success!
            } else {
                console.warn('[Transfers] Transfers data is empty or invalid');
            }
        } else {
            const errorText = await response.text();
            console.error(`[Transfers] ❌ HTTP ${response.status}: ${response.statusText}`);
            console.error(`[Transfers] Error response:`, errorText);
        }
        } catch (error) {
            console.error(`[Transfers] ❌ Error loading from API:`, error);
            console.error(`[Transfers] Error details:`, error.message, error.stack);
        }
        
        // Fallback to localStorage if API fails
        console.log('[Transfers] API failed, checking localStorage as fallback...');
        if (window.dataStorage && window.dataStorage.hasStoredData(window.dataStorage.STORAGE_KEYS.transfers)) {
            console.log('[Transfers] 🔍 Found data in localStorage (fallback)');
            const storedData = window.dataStorage.getStoredData(window.dataStorage.STORAGE_KEYS.transfers);
            if (storedData && Array.isArray(storedData) && storedData.length > 0) {
                transfersData = storedData;
                console.log(`[Transfers] ✓ Using ${storedData.length} transfers from localStorage (fallback)`);
                
                const isHomePage = window.location.pathname === '/' || 
                                  window.location.pathname.endsWith('index.html') || 
                                  window.location.pathname.endsWith('/') ||
                                  window.location.pathname.includes('index') ||
                                  !window.location.pathname.includes('transfers.html');
                
                const limit = isHomePage ? 6 : null;
                console.log('[Transfers] Is homepage?', isHomePage, 'Limit:', limit);
                
                renderTransfers(transfersData, currentFilter, limit);
                return; // Success!
            }
        }
        
        // Error handling - both API and localStorage failed
        console.error('[Transfers] ❌❌❌ Could not load transfers from API or localStorage ❌❌❌');
        if (container) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger text-center">
                        <h5><i class="bi bi-exclamation-triangle"></i> Failed to load transfers</h5>
                        <p>Unable to connect to the API server.</p>
                        <p class="small text-muted">API URL: ${API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.TRANSFERS)}</p>
                        <p class="small text-muted">Make sure the backend server is running.</p>
                        <p class="small text-muted">Check browser console (F12) for detailed error messages.</p>
                    </div>
                </div>
            `;
        }
}

// ===========================
// Filter Handling
// ===========================

function setupFilters() {
    console.log('[Transfers] Setting up filter buttons...');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Only setup filters if we have filter buttons (not on homepage)
    if (filterButtons.length === 0) {
        console.log('[Transfers] No filter buttons found - likely on homepage');
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
            console.log('[Transfers] Filter changed to:', filter);
            
            // Update current filter
            currentFilter = filter;
            
            // Re-render transfers with new filter (no limit on transfers page)
            renderTransfers(transfersData, currentFilter, null);
        });
    });
    
    console.log('[Transfers] ✓ Filter buttons setup complete');
}

// ===========================
// Booking Modal
// ===========================

function openTransferBookingModal(transferId) {
    if (typeof showComingSoonMessage === 'function') {
        showComingSoonMessage();
        return;
    }
    console.log('[Transfers] Opening booking modal for transfer:', transferId);
    
    const transfer = transfersData.find(t => t.id === transferId);
    if (!transfer) {
        console.error('[Transfers] Transfer not found:', transferId);
        alert('Transfer package not found');
        return;
    }
    
    selectedTransfer = transfer;
    
    // Create or get modal
    let modal = document.getElementById('transferBookingModal');
    if (!modal) {
        modal = createTransferBookingModal();
        document.body.appendChild(modal);
    }
    
    // Populate modal
    populateTransferBookingModal(transfer);
    
    // Show modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

function createTransferBookingModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'transferBookingModal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', 'transferBookingModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="transferBookingModalLabel">Book Transfer</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="transferBookingModalBody">
                    <!-- Content will be populated dynamically -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="handleTransferBooking()" id="confirmTransferBookingBtn">
                        <span class="btn-text">Confirm Booking</span>
                        <span class="spinner-border spinner-border-sm ms-2" style="display: none;"></span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

function populateTransferBookingModal(transfer) {
    const modalBody = document.getElementById('transferBookingModalBody');
    if (!modalBody) return;
    
    modalBody.innerHTML = `
        <div class="transfer-booking-form">
            <!-- Transfer Summary -->
            <div class="reservation-summary mb-4 p-3 bg-light rounded">
                <h6 class="mb-2">Transfer Package</h6>
                <strong>${transfer.route || transfer.from + ' → ' + transfer.to}</strong>
                <p class="text-muted mb-2 small">
                    ${transfer.serviceType || 'Transfer'} • ${transfer.type === 'round-trip' || transfer.tripType === 'round-trip' ? 'Round-trip' : 'One-way'}
                </p>
                <div class="reservation-summary-item mt-3 p-2 bg-primary bg-opacity-10 rounded">
                    <span class="fw-bold">Total Price:</span>
                    <span class="fw-bold text-primary fs-5">${formatIQD(transfer.price)}</span>
                </div>
            </div>

            <!-- Date Selection -->
            <div class="row mb-3 mt-3">
                <div class="col-md-6">
                    <label for="transferDepartureDate" class="form-label">
                        <i class="bi bi-calendar-event me-1"></i>Departure Date
                    </label>
                    <input type="date" class="form-control" id="transferDepartureDate" min="">
                </div>
                <div class="col-md-6">
                    <label for="transferReturnDate" class="form-label">
                        <i class="bi bi-calendar-check me-1"></i>Return Date
                    </label>
                    <input type="date" class="form-control" id="transferReturnDate" min="">
                </div>
            </div>

            <!-- Customer Information -->
            <div class="customer-info-section mt-4">
                <h6><i class="bi bi-person-fill"></i> Your Information</h6>
                
                <div class="row mb-3">
                    <div class="col-md-4">
                        <label for="transferCustomerFirstName" class="form-label">First Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="transferCustomerFirstName" placeholder="John" required>
                    </div>
                    <div class="col-md-4">
                        <label for="transferCustomerSecondName" class="form-label">Second Name</label>
                        <input type="text" class="form-control" id="transferCustomerSecondName" placeholder="Middle">
                    </div>
                    <div class="col-md-4">
                        <label for="transferCustomerSurname" class="form-label">Surname <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="transferCustomerSurname" placeholder="Doe" required>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="transferCustomerPhone" class="form-label">
                            <i class="bi bi-telephone me-1"></i>Phone Number <span class="text-danger">*</span>
                        </label>
                        <input type="tel" class="form-control" id="transferCustomerPhone" placeholder="+964 750 XXX XXXX" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="transferCustomerEmail" class="form-label">
                            <i class="bi bi-envelope me-1"></i>Email Address <span class="text-danger">*</span>
                        </label>
                        <input type="email" class="form-control" id="transferCustomerEmail" placeholder="john@example.com" required>
                    </div>
                </div>
            </div>

            <!-- Terms and Conditions -->
            <div class="mb-3 mt-4">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="transferReservationTerms" required>
                    <label class="form-check-label" for="transferReservationTerms">
                        <strong>I understand that this reservation is non-refundable under any circumstances or excuse.</strong>
                        <span class="text-danger">*</span>
                    </label>
                </div>
            </div>

            <!-- Error Message -->
            <div id="transferBookingError" class="alert alert-danger" style="display: none;"></div>
        </div>
    `;
    
    // Setup date listeners
    setupTransferDateListeners();
}

function setupTransferDateListeners() {
    const departureInput = document.getElementById('transferDepartureDate');
    const returnInput = document.getElementById('transferReturnDate');
    
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
                    showTransferError('Return date must be after departure date');
                    this.value = '';
                }
            }
        });
    }
}

async function handleTransferBooking() {
    console.log('[Transfers] Processing transfer booking...');
    
    if (!selectedTransfer) {
        showTransferError('Please select a transfer package');
        return;
    }
    
    // Get customer info
    const firstName = document.getElementById('transferCustomerFirstName')?.value.trim();
    const secondName = document.getElementById('transferCustomerSecondName')?.value.trim();
    const surname = document.getElementById('transferCustomerSurname')?.value.trim();
    const customerPhone = document.getElementById('transferCustomerPhone')?.value.trim();
    const customerEmail = document.getElementById('transferCustomerEmail')?.value.trim();
    
    // Validate required fields
    if (!firstName || !surname || !customerPhone || !customerEmail) {
        showTransferError('Please fill in all required fields');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
        showTransferError('Please enter a valid email address');
        return;
    }
    
    // Validate phone contains digits
    if (customerPhone.length < 5 || !/\d/.test(customerPhone)) {
        showTransferError('Phone number must be at least 5 characters and contain digits');
        return;
    }
    
    // Validate name is not "Guest" or "N/A"
    const customerName = `${firstName} ${secondName} ${surname}`.trim();
    if (customerName.toLowerCase() === 'guest' || customerName.toLowerCase() === 'n/a') {
        showTransferError('Please enter your real name');
        return;
    }
    
    // Validate terms checkbox
    const termsCheckbox = document.getElementById('transferReservationTerms');
    if (!termsCheckbox || !termsCheckbox.checked) {
        showTransferError('You must agree to the non-refundable terms to proceed');
        return;
    }
    
    // customerName already defined above (line 480)
    
    // Get dates
    const departureDate = document.getElementById('transferDepartureDate')?.value || null;
    const returnDate = document.getElementById('transferReturnDate')?.value || null;
    
    // Get amount
    const amount = selectedTransfer.price;
    if (!amount || amount <= 0) {
        showTransferError('Invalid price. Please select a valid transfer package.');
        return;
    }
    
    // Validate transfer ID
    if (!selectedTransfer.id) {
        showTransferError('Transfer ID is missing. Please try selecting the transfer again.');
        return;
    }
    
    // Extract city/country from route if available (optional for transfers)
    let city = '';
    let country = '';
    if (selectedTransfer.route) {
        // Try to extract city from route (e.g., "AIRPORT DUBAI" -> "Dubai")
        const routeParts = selectedTransfer.route.split('→');
        if (routeParts.length > 0) {
            const location = routeParts[0].replace('AIRPORT', '').trim();
            if (location) {
                city = location;
                // Set country based on common airports
                if (location.toUpperCase().includes('DUBAI')) {
                    country = 'UAE';
                } else if (location.toUpperCase().includes('BEIRUT')) {
                    country = 'Lebanon';
                } else {
                    country = 'Iraq'; // Default
                }
            }
        }
    }
    
    console.log('[Transfers] Creating reservation with data:', {
        reservationType: 'Transfer',
        transferId: selectedTransfer.id,
        transferIdType: typeof selectedTransfer.id,
        amount: amount,
        customerName: customerName,
        city: city,
        country: country
    });
    
    // Hide error
    hideTransferError();
    
    // Show loading
    setTransferButtonLoading(true);
    
    try {
        // Use shared reservation utility
        if (window.reservationUtils && window.reservationUtils.completeReservationFlow) {
            await window.reservationUtils.completeReservationFlow({
                reservationType: 'Transfer',
                transferId: String(selectedTransfer.id), // Ensure it's a string
                amount: amount,
                customerName: customerName,
                customerPhone: customerPhone,
                customerEmail: customerEmail,
                city: city,
                country: country,
                hotelName: selectedTransfer.route || 'Transfer Service', // Use route as service name
                departureDate: departureDate,
                returnDate: returnDate
            }, {
                onSuccess: (paymentResult) => {
                    console.log('[Transfers] Payment created:', paymentResult);
                    window.location.href = paymentResult.formUrl;
                },
                onError: (error) => {
                    console.error('[Transfers] Reservation error:', error);
                    showTransferError(error.message || 'Failed to create reservation. Please try again.');
                    setTransferButtonLoading(false);
                }
            });
        } else {
            throw new Error('Reservation utilities not available');
        }
    } catch (error) {
        console.error('[Transfers] Booking error:', error);
        showTransferError(error.message || 'Failed to process booking. Please try again.');
        setTransferButtonLoading(false);
    }
}

function setTransferButtonLoading(loading) {
    const btn = document.querySelector('#transferBookingModal .btn-primary');
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

function hideTransferError() {
    const errorDiv = document.getElementById('transferBookingError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

function showTransferError(message) {
    const errorDiv = document.getElementById('transferBookingError');
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
// Initialization
// ===========================

// Simple initialization exactly like group-tours.js
console.log('[Transfers] Initialization block executing...');
console.log('[Transfers] Document readyState:', document.readyState);

if (document.readyState === 'loading') {
    console.log('[Transfers] Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[Transfers] ✓ DOM loaded event fired!');
        setTimeout(() => {
            console.log('[Transfers] Now calling loadTransfers()...');
            loadTransfers();
            // Only setup filters if we're on the transfers page (not homepage)
            const transfersPageContainer = document.getElementById('transfers-list');
            if (transfersPageContainer) {
                setupFilters();
            }
        }, 100);
    });
} else {
    // DOM is already loaded
    console.log('[Transfers] ✓ DOM already loaded!');
    setTimeout(() => {
        console.log('[Transfers] Now calling loadTransfers()...');
        loadTransfers();
        // Only setup filters if we're on the transfers page (not homepage)
        const transfersPageContainer = document.getElementById('transfers-list');
        if (transfersPageContainer) {
            setupFilters();
        }
    }, 100);
}

console.log('[Transfers] Initialization block complete.');

// Export functions for global access
window.openTransferBookingModal = openTransferBookingModal;
window.handleTransferBooking = handleTransferBooking;

})(); // End of IIFE - closes the scope to prevent variable conflicts

