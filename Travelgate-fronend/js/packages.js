/**
 * Packages Feature
 * Handles package card rendering, booking modal, and payment integration
 */

console.log('[Packages] packages.js script loaded');

// API Base URL - using shared constant from reservation-utils.js
if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = "https://api.travelgate.co/api";
}

function getApiBaseUrl() {
    return window.API_BASE_URL || "https://api.travelgate.co/api";
}

// Packages data storage
let packagesData = [];
let selectedPackage = null;

// ===========================
// Utility Functions
// ===========================

// Format currency (IQD)
function formatIQD(value) {
    return value.toLocaleString('en-US') + ' IQD';
}

// Normalize package data from API (handle both camelCase and PascalCase)
function normalizePackage(apiPackage) {
    return {
        id: apiPackage.id || apiPackage.Id,
        hotelId: apiPackage.hotelId || apiPackage.HotelId,
        hotelName: apiPackage.hotelName || apiPackage.HotelName,
        roomType: apiPackage.roomType || apiPackage.RoomType,
        nights: apiPackage.nights || apiPackage.Nights,
        price: apiPackage.price || apiPackage.Price,
        city: apiPackage.city || apiPackage.City,
        country: apiPackage.country || apiPackage.Country,
        fixedPriceGuarantee: apiPackage.fixedPriceGuarantee !== undefined ? apiPackage.fixedPriceGuarantee : (apiPackage.FixedPriceGuarantee !== undefined ? apiPackage.FixedPriceGuarantee : true),
        everyDay: apiPackage.everyDay !== undefined ? apiPackage.everyDay : (apiPackage.EveryDay !== undefined ? apiPackage.EveryDay : false),
        isActive: apiPackage.isActive !== undefined ? apiPackage.isActive : (apiPackage.IsActive !== undefined ? apiPackage.IsActive : true),
        images: (apiPackage.images || apiPackage.Images || []).map(img => ({
            id: img.id || img.Id,
            imageUrl: img.imageUrl || img.ImageUrl,
            order: img.order || img.Order
        })),
        features: (apiPackage.features || apiPackage.Features || []).map(f => ({
            id: f.id || f.Id,
            item: f.item || f.Item
        }))
    };
}

// ===========================
// Package Card Building
// ===========================

function buildPackageCard(pkg) {
    const normalized = normalizePackage(pkg);
    
    // Get primary image (first image by order)
    const primaryImage = normalized.images && normalized.images.length > 0
        ? normalized.images.sort((a, b) => (a.order || 0) - (b.order || 0))[0].imageUrl
        : 'https://via.placeholder.com/400x300?text=No+Image';
    
    // Build image carousel HTML if multiple images
    let imageCarouselHtml = '';
    if (normalized.images && normalized.images.length > 1) {
        const sortedImages = normalized.images.sort((a, b) => (a.order || 0) - (b.order || 0));
        const carouselId = `packageCarousel${normalized.id}`;
        imageCarouselHtml = `
            <div id="${carouselId}" class="carousel slide package-carousel" data-bs-ride="carousel">
                <div class="carousel-inner">
                    ${sortedImages.map((img, idx) => `
                        <div class="carousel-item ${idx === 0 ? 'active' : ''}">
                            <img src="${img.imageUrl}" class="d-block w-100" alt="${normalized.hotelName}" style="height: 250px; object-fit: cover;">
                        </div>
                    `).join('')}
                </div>
                ${sortedImages.length > 1 ? `
                    <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Previous</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Next</span>
                    </button>
                ` : ''}
            </div>
        `;
    } else {
        imageCarouselHtml = `
            <div class="package-image-wrapper">
                <img src="${primaryImage}" alt="${normalized.hotelName}" style="width: 100%; height: 250px; object-fit: cover;">
            </div>
        `;
    }
    
    // Build features list
    const featuresHtml = normalized.features && normalized.features.length > 0
        ? normalized.features.map(f => `<li><i class="bi bi-check-circle-fill text-success me-2"></i>${f.item}</li>`).join('')
        : '<li class="text-muted">No features listed</li>';
    
    // Location text
    const locationText = normalized.city && normalized.country
        ? `${normalized.city}, ${normalized.country}`
        : (normalized.city || normalized.country || 'Location not specified');
    
    return `
        <div class="col-md-6 col-xl-4">
            <div class="package-card h-100">
                <div class="package-image-wrapper position-relative">
                    ${imageCarouselHtml}
                    ${normalized.nights ? `
                        <div class="package-nights-badge">
                            <i class="bi bi-moon-stars"></i> ${normalized.nights} ${normalized.nights === 1 ? 'Night' : 'Nights'}
                        </div>
                    ` : ''}
                </div>
                <div class="package-card-body">
                    <h4 class="package-card-name">${normalized.hotelName || 'Unnamed Package'}</h4>
                    <p class="package-card-room-type text-muted">
                        <i class="bi bi-door-open"></i> ${normalized.roomType || 'Standard Room'}
                    </p>
                    <p class="package-card-location text-muted small">
                        <i class="bi bi-geo-alt-fill"></i> ${locationText}
                    </p>
                    
                    <div class="package-price-section mt-3 mb-3">
                        <span class="package-price-label">FROM</span>
                        <span class="package-price-amount">${formatIQD(normalized.price || 0)}</span>
                    </div>
                    
                    ${normalized.fixedPriceGuarantee ? `
                        <p class="package-guarantee-text text-success small mb-2">
                            <i class="bi bi-shield-check"></i> FIXED PRICE GUARANTEE
                        </p>
                    ` : ''}
                    
                    ${normalized.everyDay ? `
                        <p class="package-everyday-text text-info small mb-2">
                            <i class="bi bi-calendar-check"></i> Every Day
                        </p>
                    ` : ''}
                    
                    <div class="package-meta mt-3">
                        <h6 class="small fw-bold mb-2">Package Includes:</h6>
                        <ul class="list-unstyled small">
                            ${featuresHtml}
                        </ul>
                    </div>
                    
                    <button class="btn btn-reserve w-100 mt-3" onclick="openPackageModal(${normalized.id})">
                        SELECT PACKAGE
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===========================
// Render Functions
// ===========================

function renderPackages(packages) {
    const container = document.getElementById('packageCardsContainer');
    if (!container) {
        console.error('packageCardsContainer not found in DOM');
        return;
    }
    
    if (!packages || packages.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> No packages available at this time.
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = packages.map(pkg => buildPackageCard(pkg)).join('');
}

// ===========================
// Load Packages
// ===========================

async function loadPackages() {
    const container = document.getElementById('packageCardsContainer');
    
    try {
        const response = await fetch(`${getApiBaseUrl()}/packages`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        packagesData = data;
        
        // Filter only active packages
        const activePackages = packagesData.filter(pkg => {
            const normalized = normalizePackage(pkg);
            return normalized.isActive !== false;
        });
        
        renderPackages(activePackages);
        
        console.log(`[Packages] Loaded ${activePackages.length} packages`);
    } catch (error) {
        console.error('[Packages] Error loading packages:', error);
        if (container) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <h5>Failed to load packages</h5>
                        <p>Unable to connect to the API server.</p>
                        <p class="small text-muted">API URL: ${getApiBaseUrl()}/packages</p>
                    </div>
                </div>
            `;
        }
    }
}

// ===========================
// Package Booking Modal
// ===========================

function openPackageModal(packageId) {
    if (typeof showComingSoonMessage === 'function') {
        showComingSoonMessage();
        return;
    }
    const pkg = packagesData.find(p => {
        const normalized = normalizePackage(p);
        return normalized.id === packageId;
    });
    
    if (!pkg) {
        console.error('Package not found:', packageId);
        alert('Package not found. Please try again.');
        return;
    }
    
    selectedPackage = normalizePackage(pkg);
    
    // Update modal content
    const modalHotelName = document.getElementById('modalHotelName');
    if (modalHotelName) {
        modalHotelName.textContent = selectedPackage.hotelName;
    }
    
    const modalHotelLocation = document.getElementById('modalHotelLocation');
    if (modalHotelLocation) {
        const locationSpan = modalHotelLocation.querySelector('span');
        if (locationSpan) {
            const locationText = selectedPackage.city && selectedPackage.country
                ? `${selectedPackage.city}, ${selectedPackage.country}`
                : (selectedPackage.city || selectedPackage.country || 'Location not specified');
            locationSpan.textContent = locationText;
        }
    }
    
    // Hide room type selector (not applicable for packages)
    const roomTypeSelect = document.getElementById('modalRoomTypeSelect');
    if (roomTypeSelect) {
        roomTypeSelect.style.display = 'none';
        const label = roomTypeSelect.previousElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.style.display = 'none';
        }
    }
    
    // Add date inputs dynamically (after price display, before customer info)
    const modalSelectedPrice = document.getElementById('modalSelectedPrice');
    const customerInfoSection = document.querySelector('.customer-info-section');
    
    // Remove existing package date section if it exists
    const existingDateSection = document.getElementById('packageDateSection');
    if (existingDateSection) {
        existingDateSection.remove();
    }
    
    // Create date section
    if (modalSelectedPrice && customerInfoSection && selectedPackage.nights) {
        const dateSection = document.createElement('div');
        dateSection.id = 'packageDateSection';
        dateSection.className = 'row mb-3 mt-3';
        dateSection.innerHTML = `
            <div class="col-md-6">
                <label for="packageCheckInDate" class="form-label">
                    <i class="bi bi-calendar-check me-1"></i>Check-In Date
                </label>
                <input type="date" class="form-control" id="packageCheckInDate" min="">
            </div>
            <div class="col-md-6">
                <label for="packageCheckOutDate" class="form-label">
                    <i class="bi bi-calendar-x me-1"></i>Check-Out Date
                </label>
                <input type="date" class="form-control" id="packageCheckOutDate" readonly>
                <small class="text-muted">Auto-calculated (${selectedPackage.nights} ${selectedPackage.nights === 1 ? 'night' : 'nights'})</small>
            </div>
        `;
        
        // Insert before customer info section
        customerInfoSection.parentNode.insertBefore(dateSection, customerInfoSection);
        
        // Setup date listeners
        setupPackageDateListeners();
    }
    
    // Update price display
    if (modalSelectedPrice) {
        const roomTypeText = selectedPackage.roomType ? ` • ${selectedPackage.roomType}` : '';
        const nightsText = selectedPackage.nights ? ` • ${selectedPackage.nights} Nights` : '';
        modalSelectedPrice.innerHTML = `
            <strong>${formatIQD(selectedPackage.price)}</strong>
            <div class="small text-muted mt-1">${roomTypeText}${nightsText}</div>
        `;
    }
    
    // Clear form fields
    const firstName = document.getElementById('customerFirstName');
    const secondName = document.getElementById('customerSecondName');
    const surname = document.getElementById('customerSurname');
    const customerPhone = document.getElementById('customerPhone');
    const customerEmail = document.getElementById('customerEmail');
    
    if (firstName) firstName.value = '';
    if (secondName) secondName.value = '';
    if (surname) surname.value = '';
    if (customerPhone) customerPhone.value = '';
    if (customerEmail) customerEmail.value = '';
    
    // Clear date fields
    const packageCheckInDate = document.getElementById('packageCheckInDate');
    const packageCheckOutDate = document.getElementById('packageCheckOutDate');
    if (packageCheckInDate) packageCheckInDate.value = '';
    if (packageCheckOutDate) packageCheckOutDate.value = '';
    
    // Hide error message
    const reservationError = document.getElementById('reservationError');
    if (reservationError) {
        reservationError.style.display = 'none';
        reservationError.innerHTML = '';
    }
    
    // Reset button state
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const continuePaymentBtn = document.getElementById('continuePaymentBtn');
    
    if (btnText) btnText.textContent = 'Confirm Booking';
    if (btnSpinner) btnSpinner.style.display = 'none';
    if (continuePaymentBtn) continuePaymentBtn.disabled = false;
    
    // Show modal using Bootstrap
    const modalElement = document.getElementById('reservationModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

// ===========================
// Package Date Listeners
// ===========================

function setupPackageDateListeners() {
    const checkInInput = document.getElementById('packageCheckInDate');
    const checkOutInput = document.getElementById('packageCheckOutDate');
    
    if (checkInInput && selectedPackage && selectedPackage.nights) {
        // Set minimum date to today
        checkInInput.min = new Date().toISOString().split('T')[0];
        checkInInput.addEventListener('change', function() {
            if (this.value && selectedPackage.nights) {
                const checkInDate = new Date(this.value);
                const checkOutDate = new Date(checkInDate);
                checkOutDate.setDate(checkOutDate.getDate() + selectedPackage.nights);
                
                if (checkOutInput) {
                    checkOutInput.value = checkOutDate.toISOString().split('T')[0];
                }
            } else if (checkOutInput) {
                checkOutInput.value = '';
            }
        });
    }
}

// ===========================
// Submit Package Booking
// ===========================

async function submitPackageBooking() {
    if (!selectedPackage) {
        alert('No package selected. Please try again.');
        return;
    }
    
    // Get form values
    const firstName = document.getElementById('customerFirstName')?.value.trim();
    const secondName = document.getElementById('customerSecondName')?.value.trim() || '';
    const surname = document.getElementById('customerSurname')?.value.trim();
    const phoneNumber = document.getElementById('customerPhone')?.value.trim();
    const email = document.getElementById('customerEmail')?.value.trim();
    const termsAccepted = document.getElementById('reservationTerms')?.checked;
    
    // Validate form
    if (!firstName || !surname || !phoneNumber || !email) {
        showReservationError('Please fill in all required fields.');
        return;
    }
    
    if (!termsAccepted) {
        showReservationError('Please accept the terms and conditions to proceed.');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showReservationError('Please enter a valid email address.');
        return;
    }
    
    // Set button loading state
    const continuePaymentBtn = document.getElementById('continuePaymentBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    
    if (continuePaymentBtn) continuePaymentBtn.disabled = true;
    if (btnText) btnText.textContent = 'Processing...';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    
    try {
        // Get dates - convert empty strings to null
        const checkInDateInput = document.getElementById('packageCheckInDate');
        const checkOutDateInput = document.getElementById('packageCheckOutDate');
        const checkInDate = checkInDateInput?.value?.trim() || null;
        const checkOutDate = checkOutDateInput?.value?.trim() || null;
        
        console.log('[Packages] Booking with dates:', { checkInDate, checkOutDate });
        
        // Step 1: Create package reservation
        const bookingRequest = {
            packageId: selectedPackage.id,
            firstName: firstName,
            secondName: secondName,
            surname: surname,
            phoneNumber: phoneNumber,
            email: email,
            checkInDate: checkInDate || null,  // Ensure null instead of empty string
            checkOutDate: checkOutDate || null  // Ensure null instead of empty string
        };
        
        const reservationResponse = await fetch(`${getApiBaseUrl()}/packages/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingRequest)
        });
        
        if (!reservationResponse.ok) {
            const error = await reservationResponse.json().catch(() => ({ message: 'Failed to create reservation' }));
            throw new Error(error.message || error.error || 'Failed to create reservation');
        }
        
        const reservationData = await reservationResponse.json();
        
        if (!reservationData.success) {
            throw new Error(reservationData.message || 'Failed to create reservation');
        }
        
        // Store reservation info in localStorage for payment flow
        localStorage.setItem('currentReservation', JSON.stringify({
            invoiceId: reservationData.invoiceId,
            paymentId: reservationData.paymentId,
            amount: selectedPackage.price,
            currency: 'IQD',
            type: 'Package'
        }));
        
        // Step 2: Create payment
        const paymentRequest = {
            amount: selectedPackage.price,
            currency: 'IQD',
            invoiceId: reservationData.invoiceId
        };
        
        const paymentResponse = await fetch(`${getApiBaseUrl()}/payment/create-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentRequest)
        });
        
        if (!paymentResponse.ok) {
            const error = await paymentResponse.json().catch(() => ({ message: 'Failed to create payment' }));
            throw new Error(error.message || error.error || 'Failed to create payment');
        }
        
        const paymentData = await paymentResponse.json();
        
        if (!paymentData.success || !paymentData.formUrl) {
            throw new Error(paymentData.message || 'Failed to create payment gateway session');
        }
        
        // Step 3: Redirect to payment gateway
        window.location.href = paymentData.formUrl;
        
    } catch (error) {
        console.error('[Packages] Error submitting booking:', error);
        showReservationError(error.message || 'An error occurred. Please try again.');
        
        // Reset button state
        if (continuePaymentBtn) continuePaymentBtn.disabled = false;
        if (btnText) btnText.textContent = 'Confirm Booking';
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}

// ===========================
// Helper Functions
// ===========================

function showReservationError(message) {
    const errorDiv = document.getElementById('reservationError');
    if (errorDiv) {
        errorDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> ${message}
            </div>
        `;
        errorDiv.style.display = 'block';
    }
}

// Override handleContinueToPayment if it exists, or create it
window.handleContinueToPayment = function() {
    // Check if this is a package booking
    if (selectedPackage) {
        submitPackageBooking();
    } else {
        // Fallback to existing hotel booking flow
        if (typeof window.handleHotelReservation === 'function') {
            window.handleHotelReservation();
        } else {
            console.error('No booking handler available');
        }
    }
};

// Initialize packages on page load
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('packageCardsContainer');
    if (container) {
        console.log('[Packages] Package container found, loading packages...');
        loadPackages();
    } else {
        console.log('[Packages] Package container not found on this page');
    }
});

// Export functions for global access
window.loadPackages = loadPackages;
window.openPackageModal = openPackageModal;
window.submitPackageBooking = submitPackageBooking;

