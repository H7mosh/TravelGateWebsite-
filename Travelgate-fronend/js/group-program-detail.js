/**
 * Group Program Detail Page JavaScript
 * Handles loading and displaying program details
 */

let currentProgram = null;
let selectedTransportOption = null;
const programId = new URLSearchParams(window.location.search).get('id');

/**
 * Format currency in IQD
 */
function formatIQD(amount) {
    if (!amount) return '0 IQD';
    return new Intl.NumberFormat('en-IQ', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount) + ' IQD';
}

// City image mappings - using Unsplash for beautiful destination images
const cityImages = {
    'Istanbul': [
        'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
        'https://images.unsplash.com/photo-1539650116574-75c0c6d73a6e?w=800',
        'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
        'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'
    ],
    'Beirut': [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
    ],
    'Antalya': [
        'https://images.unsplash.com/photo-1555993536-5e6c8c97e23a?w=800',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
    ],
    'Dubai': [
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800'
    ]
};

// Day activity images - generic travel images
const activityImages = [
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800',
    'https://images.unsplash.com/photo-1539650116574-75c0c6d73a6e?w=800',
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
    'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800'
];

document.addEventListener('DOMContentLoaded', function() {
    if (!programId) {
        alert('Program ID not found. Redirecting to programs page...');
        window.location.href = 'group-programs.html';
        return;
    }
    
    loadProgramDetails();
});

/**
 * Load program details from API
 */
async function loadProgramDetails() {
    try {
        const lang = window.i18n?.getCurrentLanguage() || 'en';
        const endpoint = API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.GROUP_PROGRAMS}/${programId}`);
        const response = await fetch(`${endpoint}?lang=${lang}`);
        
        if (!response.ok) {
            throw new Error('Failed to load program details');
        }
        
        currentProgram = await response.json();
        renderProgramDetails();
    } catch (error) {
        console.error('Error loading program details:', error);
        document.getElementById('programTitle').textContent = 'Error Loading Program';
        document.getElementById('itineraryContainer').innerHTML = `
            <div class="alert alert-danger">
                <p>Failed to load program details. Please try again later.</p>
                <a href="group-programs.html" class="btn btn-primary">Back to Programs</a>
            </div>
        `;
    }
}

/**
 * Render program details
 */
function renderProgramDetails() {
    if (!currentProgram) return;
    
    // Update hero section
    // Use city image if program image is not available or invalid
    const heroImage = currentProgram.image && currentProgram.image.trim() !== '' && !currentProgram.image.includes('assets/images/programs') 
        ? currentProgram.image 
        : getCityImage(currentProgram.city, 0);
    document.getElementById('heroImage').src = heroImage;
    document.getElementById('programTitle').textContent = currentProgram.name;
    document.getElementById('programLocation').textContent = `${currentProgram.city}, ${currentProgram.country}`;
    
    // Update description
    if (currentProgram.description) {
        document.getElementById('programDescription').textContent = currentProgram.description;
    } else {
        document.getElementById('programDescription').textContent = `Experience the beauty of ${currentProgram.city}, ${currentProgram.country} with our carefully curated group program. Join fellow travelers and create unforgettable memories.`;
    }
    
    // Render itinerary
    renderItinerary();
    
    // Render gallery
    renderGallery();
}

/**
 * Render itinerary days
 */
function renderItinerary() {
    const container = document.getElementById('itineraryContainer');
    
    if (!currentProgram.days || currentProgram.days.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No itinerary details available.</p>';
        return;
    }
    
    container.innerHTML = currentProgram.days.map((day, index) => {
        const dayImage = getActivityImage(index);
        
        return `
            <div class="itinerary-day" style="animation-delay: ${index * 0.1}s">
                <div class="itinerary-day-number-wrapper">
                    <div class="itinerary-day-number">${day.dayNumber}</div>
                </div>
                <div class="itinerary-day-content-wrapper">
                    <div class="itinerary-day-text-content">
                        <div>
                            <div class="itinerary-day-header">
                                <h3 class="itinerary-day-title">${escapeHtml(day.title)}</h3>
                            </div>
                            ${day.description ? `<p class="itinerary-day-description">${escapeHtml(day.description)}</p>` : ''}
                        </div>
                    </div>
                    <div class="itinerary-day-image-wrapper">
                        <img src="${dayImage}" 
                             alt="Day ${day.dayNumber} - ${escapeHtml(day.title)}" 
                             class="itinerary-day-image"
                             onerror="this.src='${getActivityImage(index)}'">
                        <div class="itinerary-day-image-overlay"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render gallery
 */
function renderGallery() {
    const container = document.getElementById('galleryContainer');
    const city = currentProgram.city;
    const images = cityImages[city] || activityImages;
    
    container.innerHTML = images.map((img, index) => `
        <div class="gallery-item" onclick="openImageModal('${img}')">
            <img src="${img}" alt="${city} - Image ${index + 1}" onerror="this.src='${getActivityImage(index)}'">
        </div>
    `).join('');
}

/**
 * Get city-specific image
 */
function getCityImage(city, index) {
    const images = cityImages[city] || activityImages;
    return images[index % images.length];
}

/**
 * Get activity image
 */
function getActivityImage(index) {
    return activityImages[index % activityImages.length];
}

/**
 * Open reservation modal/page
 */
function openReservation() {
    if (typeof showComingSoonMessage === 'function') {
        showComingSoonMessage();
        return;
    }
    if (!currentProgram) {
        alert('Program information not available. Please refresh the page.');
        return;
    }
    
    // Get or create modal
    let modalElement = document.getElementById('groupProgramReservationModal');
    if (!modalElement) {
        console.error('Reservation modal not found');
        alert('Reservation form not available. Please contact us directly.');
        return;
    }
    
    // Populate modal with program info
    document.getElementById('modalProgramName').textContent = currentProgram.name;
    const locationSpan = document.getElementById('modalProgramLocation').querySelector('span');
    if (locationSpan) {
        locationSpan.textContent = `${currentProgram.city}, ${currentProgram.country}`;
    }
    
    // Render transport options
    renderTransportOptions();
    
    // Reset form
    const form = document.getElementById('groupProgramReservationForm');
    if (form) {
        form.reset();
    }
    
    // Reset transport selection
    selectedTransportOption = null;
    document.getElementById('programNumberOfPersons').value = '1';
    const travelDateInput = document.getElementById('programTravelDate');
    if (travelDateInput) {
        travelDateInput.value = '';
        travelDateInput.min = new Date().toISOString().split('T')[0];
    }
    updateTotalPrice();
    
    // Hide any previous errors
    hideProgramReservationError();
    
    // Setup event listeners
    const numberOfPersonsInput = document.getElementById('programNumberOfPersons');
    if (numberOfPersonsInput) {
        numberOfPersonsInput.oninput = updateTotalPrice;
    }
    
    // Show modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // Setup submit handler
    const submitBtn = document.getElementById('submitGroupProgramReservation');
    if (submitBtn) {
        submitBtn.onclick = submitGroupProgramReservation;
    }
}

/**
 * Render transport options
 */
function renderTransportOptions() {
    const container = document.getElementById('transportOptionsContainer');
    if (!container || !currentProgram || !currentProgram.transportOptions) {
        container.innerHTML = '<div class="col-12"><p class="text-muted">No transport options available.</p></div>';
        return;
    }
    
    if (currentProgram.transportOptions.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-muted">No transport options available.</p></div>';
        return;
    }
    
    container.innerHTML = currentProgram.transportOptions.map(option => `
        <div class="col-md-6">
            <div class="transport-option-card card h-100 ${selectedTransportOption?.id === option.id ? 'border-primary border-2 selected' : ''}" 
                 onclick="selectTransportOption(${option.id})" 
                 style="cursor: pointer; transition: all 0.3s;">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0">${escapeHtml(option.name)}</h6>
                        <i class="bi bi-check-circle-fill text-primary" style="display: ${selectedTransportOption?.id === option.id ? 'block' : 'none'}; font-size: 1.5rem;"></i>
                    </div>
                    ${option.description ? `<p class="text-muted small mb-2">${escapeHtml(option.description)}</p>` : ''}
                    <div class="mt-2">
                        <span class="fs-5 fw-bold text-primary">${formatIQD(option.price)}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Select transport option
 */
function selectTransportOption(optionId) {
    if (!currentProgram || !currentProgram.transportOptions) return;
    
    selectedTransportOption = currentProgram.transportOptions.find(opt => opt.id === optionId);
    if (!selectedTransportOption) return;
    
    // Re-render to update selection
    renderTransportOptions();
    
    // Update total price
    updateTotalPrice();
}

/**
 * Update total price display
 */
function updateTotalPrice() {
    const totalPriceElement = document.getElementById('programTotalPrice');
    if (!totalPriceElement) return;
    
    if (!selectedTransportOption) {
        totalPriceElement.textContent = '--';
        return;
    }
    
    const numberOfPersons = parseInt(document.getElementById('programNumberOfPersons')?.value || '1') || 1;
    const totalPrice = selectedTransportOption.price * numberOfPersons;
    
    totalPriceElement.textContent = formatIQD(totalPrice);
}

/**
 * Submit group program reservation
 */
async function submitGroupProgramReservation() {
    if (!currentProgram) {
        alert('Program information not available.');
        return;
    }
    
    const form = document.getElementById('groupProgramReservationForm');
    if (!form || !form.checkValidity()) {
        form?.reportValidity();
        return;
    }
    
    // Validate transport option selection
    if (!selectedTransportOption) {
        showProgramReservationError('Please select a transport option.');
        return;
    }
    
    const numberOfPersons = parseInt(document.getElementById('programNumberOfPersons')?.value || '1') || 1;
    if (numberOfPersons < 1 || numberOfPersons > 50) {
        showProgramReservationError('Please enter a valid number of persons (1-50).');
        return;
    }
    
    const customerName = document.getElementById('programCustomerName').value.trim();
    const customerPhone = document.getElementById('programCustomerPhone').value.trim();
    const customerEmail = document.getElementById('programCustomerEmail').value.trim();
    const customerNotes = document.getElementById('programCustomerNotes').value.trim();
    
    // Validate inputs
    if (!customerName || customerName.toLowerCase() === 'guest' || customerName.toLowerCase() === 'n/a') {
        showProgramReservationError('Please enter a valid name.');
        return;
    }
    
    if (!customerPhone || customerPhone.length < 5 || !/\d/.test(customerPhone)) {
        showProgramReservationError('Please enter a valid phone number.');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
        showProgramReservationError('Please enter a valid email address.');
        return;
    }
    
    // Validate terms checkbox
    const termsCheckbox = document.getElementById('programReservationTerms');
    if (!termsCheckbox || !termsCheckbox.checked) {
        showProgramReservationError('You must agree to the non-refundable terms to proceed');
        return;
    }
    
    // Hide any previous errors
    hideProgramReservationError();
    
    // Disable submit button
    const submitBtn = document.getElementById('submitGroupProgramReservation');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';
    }
    
    try {
        // Calculate total price
        const totalPrice = selectedTransportOption.price * numberOfPersons;
        
        // Build notes with transport option and number of persons
        let notesWithDetails = customerNotes;
        if (selectedTransportOption) {
            const transportDetails = `\n\nTransport Option: ${selectedTransportOption.name} (${formatIQD(selectedTransportOption.price)})\nNumber of Persons: ${numberOfPersons}`;
            notesWithDetails = customerNotes ? customerNotes + transportDetails : transportDetails.trim();
        }
        
        // Get travel date
        const travelDate = document.getElementById('programTravelDate')?.value || null;
        
        // Create reservation data
        // Note: Using FlightPackage type temporarily until backend supports GroupProgram
        const reservationData = {
            reservationType: 'GroupProgram', // Will be converted to FlightPackage in reservation-utils
            groupProgramId: String(currentProgram.id),
            amount: totalPrice,
            customerName: customerName,
            customerPhone: customerPhone,
            customerEmail: customerEmail,
            programName: currentProgram.name,
            city: currentProgram.city,
            country: currentProgram.country,
            notes: notesWithDetails,
            travelDate: travelDate
        };
        
        // Check if reservationUtils is available
        if (!window.reservationUtils || !window.reservationUtils.completeReservationFlow) {
            throw new Error('Reservation system not fully loaded. Please refresh and try again.');
        }
        
        // Get modal element (don't close it yet - only close on success)
        const modalElement = document.getElementById('groupProgramReservationModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        
        // Complete reservation flow (creates reservation, payment, and redirects to gateway)
        await window.reservationUtils.completeReservationFlow(reservationData, {
            onSuccess: (paymentResult) => {
                console.log('[Group Program] Payment created:', paymentResult);
                // Close modal only on success before redirecting
                if (modal) {
                    modal.hide();
                }
                window.location.href = paymentResult.formUrl;
            },
            onError: (error) => {
                console.error('[Group Program] Reservation error:', error);
                // Make sure modal is open to show error
                if (modal && !modalElement.classList.contains('show')) {
                    modal.show();
                }
                // Display error message
                const errorMessage = error.message || 'Failed to create reservation. Please try again.';
                showProgramReservationError(errorMessage);
                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Submit Reservation';
                }
            }
        });
        
    } catch (error) {
        console.error('Error submitting reservation:', error);
        
        // Make sure modal is open to show error
        const modalElement = document.getElementById('groupProgramReservationModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal && !modalElement.classList.contains('show')) {
            modal.show();
        }
        
        // Display error message - use the error message directly if it's about disabled reservations
        const errorMessage = error.message || 'Failed to create reservation. Please try again.';
        showProgramReservationError(errorMessage);
        
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Submit Reservation';
        }
    }
}

/**
 * Show error message in reservation modal
 */
function showProgramReservationError(message) {
    const errorDiv = document.getElementById('programReservationError');
    if (errorDiv) {
        // Check if it's a disabled reservation error
        const isDisabledError = message.toLowerCase().includes('disabled') || 
                                message.toLowerCase().includes('reservations are currently disabled');
        
        // Update error message
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Use warning style for disabled reservations, danger for other errors
        if (isDisabledError) {
            errorDiv.className = 'alert alert-warning';
        } else {
            errorDiv.className = 'alert alert-danger';
        }
        
        // Scroll to error
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        alert(message);
    }
}

/**
 * Hide error message in reservation modal
 */
function hideProgramReservationError() {
    const errorDiv = document.getElementById('programReservationError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

/**
 * Open image modal (simple implementation)
 */
function openImageModal(imageSrc) {
    // Simple image viewer - can be enhanced with a proper modal
    window.open(imageSrc, '_blank');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally
window.openReservation = openReservation;
window.selectTransportOption = selectTransportOption;

