/**
 * Group Programs JavaScript
 * Handles loading and displaying group programs
 */

let allPrograms = [];
let selectedProgram = null;

document.addEventListener('DOMContentLoaded', function() {
    loadGroupPrograms();
});

/**
 * Load group programs from API
 */
async function loadGroupPrograms() {
    try {
        const lang = window.i18n?.getCurrentLanguage() || 'en';
        const endpoint = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GROUP_PROGRAMS);
        const response = await fetch(`${endpoint}?lang=${lang}`);
        
        if (!response.ok) {
            throw new Error('Failed to load programs');
        }
        
        allPrograms = await response.json();
        
        // Check if we're on homepage or programs page
        const isHomePage = window.location.pathname === '/' || 
                          window.location.pathname.endsWith('index.html') || 
                          window.location.pathname.endsWith('/') ||
                          window.location.pathname.includes('index');
        
        if (isHomePage) {
            // Render on homepage with limit
            renderProgramsHomepage(4);
        } else {
            // Render all programs on programs page
            renderPrograms();
        }
    } catch (error) {
        console.error('Error loading programs:', error);
        const container = document.getElementById('programs-list') || document.getElementById('programs-list-home');
        if (container) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <p>Failed to load group programs. Please try again later.</p>
                    </div>
                </div>
            `;
        }
    }
}

/**
 * Render all programs as cards
 */
function renderPrograms() {
    const container = document.getElementById('programs-list');
    if (!container) return;

    if (!allPrograms || allPrograms.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <p>No group programs available at the moment.</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = allPrograms.map(program => buildProgramCard(program)).join('');
}

/**
 * Render programs on homepage with limit
 */
function renderProgramsHomepage(limit = 4) {
    const container = document.getElementById('programs-list-home');
    if (!container) return;

    if (!allPrograms || allPrograms.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <p>No group programs available at the moment.</p>
                </div>
            </div>
        `;
        return;
    }

    const programsToShow = allPrograms.slice(0, limit);
    container.innerHTML = programsToShow.map(program => buildProgramCard(program)).join('');
}

/**
 * Build a program card HTML
 */
function buildProgramCard(program) {
    const imageUrl = program.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="program-card-wrapper">
                <div class="program-card" onclick="navigateToProgramDetail(${program.id})">
                    <div class="program-card-image">
                        <img src="${imageUrl}" 
                             alt="${escapeHtml(program.name)}"
                             onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'">
                        <div class="program-card-overlay">
                        </div>
                    </div>
                    <div class="program-card-content">
                        <h3 class="program-card-title">${escapeHtml(program.name)}</h3>
                        <p class="program-card-location">
                            <i class="bi bi-geo-alt-fill"></i>
                            <span>${escapeHtml(program.city)}, ${escapeHtml(program.country)}</span>
                        </p>
                        ${program.description ? `
                            <p class="program-card-description">${escapeHtml(program.description.substring(0, 120))}${program.description.length > 120 ? '...' : ''}</p>
                        ` : ''}
                        <button class="btn-program-card">
                            <span data-i18n="groupPrograms.viewDetails">View Details</span>
                            <i class="bi bi-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Navigate to program detail page
 */
function navigateToProgramDetail(id) {
    window.location.href = `group-program-detail.html?id=${id}`;
}

/**
 * View program details (for modal - kept for backward compatibility)
 */
async function viewProgramDetails(id) {
    // Redirect to detail page instead
    navigateToProgramDetail(id);
}

/**
 * Show program details modal
 */
function showProgramModal() {
    if (!selectedProgram) return;

    const modalElement = document.getElementById('programDetailsModal');
    if (!modalElement) {
        console.error('Program details modal not found in DOM');
        alert('Modal not found. Please refresh the page and try again.');
        return;
    }

    const modal = new bootstrap.Modal(modalElement);
    const title = document.getElementById('programDetailsTitle');
    const content = document.getElementById('programDetailsContent');
    
    if (!title || !content) {
        console.error('Modal elements not found');
        alert('Error displaying program details. Please try again.');
        return;
    }
    
    title.textContent = selectedProgram.name;
    
    const imageUrl = selectedProgram.image || 'assets/images/default-program.jpg';
    
    content.innerHTML = `
        <div class="row mb-4">
            <div class="col-md-4 mb-3">
                <img src="${imageUrl}" 
                     class="img-fluid rounded shadow" 
                     alt="${escapeHtml(selectedProgram.name)}"
                     onerror="this.src='assets/images/logo.svg'">
            </div>
            <div class="col-md-8">
                <h4>${escapeHtml(selectedProgram.name)}</h4>
                <p class="text-muted">
                    <i class="bi bi-geo-alt"></i> ${escapeHtml(selectedProgram.city)}, ${escapeHtml(selectedProgram.country)}
                </p>
                ${selectedProgram.description ? `<p class="mt-3">${escapeHtml(selectedProgram.description)}</p>` : ''}
            </div>
        </div>
        <hr>
        <h5 class="mb-4"><i class="bi bi-map me-2"></i>Program Itinerary</h5>
        <div class="timeline">
            ${selectedProgram.days && selectedProgram.days.length > 0 
                ? selectedProgram.days.map(day => buildDayItem(day)).join('')
                : '<p class="text-muted">No itinerary details available.</p>'
            }
        </div>
    `;
    
    modal.show();
}

/**
 * Build day item HTML
 */
function buildDayItem(day) {
    return `
        <div class="timeline-item mb-4">
            <div class="d-flex">
                <div class="timeline-marker bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" 
                     style="width: 45px; height: 45px; min-width: 45px; font-size: 1.1rem;">
                    ${day.dayNumber}
                </div>
                <div class="ms-3 flex-grow-1">
                    <h6 class="mb-2">
                        ${escapeHtml(day.title)}
                    </h6>
                    ${day.description ? `<p class="text-muted mb-2">${escapeHtml(day.description)}</p>` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Open reservation modal
 */
function openReservationModal() {
    if (typeof showComingSoonMessage === 'function') {
        showComingSoonMessage();
        return;
    }
    if (!selectedProgram) {
        alert('Please select a program first');
        return;
    }

    // Check if reservation utilities are available
    if (!window.reservationUtils) {
        alert('Reservation system not available. Please contact us directly.');
        return;
    }

    // For group programs, we'll need to create a reservation
    // Since group programs don't have hotels, we'll use a base price or contact form
    const reservationData = {
        reservationType: 'GroupProgram',
        groupProgramId: String(selectedProgram.id),
        programName: selectedProgram.name,
        city: selectedProgram.city,
        country: selectedProgram.country,
        amount: 0, // Will be determined by admin or contact
        customerName: '',
        customerPhone: '',
        customerEmail: ''
    };

    // Show a simple contact form or redirect to contact page
    const contactMessage = `I'm interested in booking the ${selectedProgram.name} program (${selectedProgram.city}, ${selectedProgram.country}). Please contact me with pricing and availability.`;
    
    // You can either:
    // 1. Open a contact form with pre-filled message
    // 2. Redirect to contact page
    // 3. Show a custom reservation modal
    
    // For now, let's show an alert and suggest contacting
    if (confirm(`To book "${selectedProgram.name}", please contact us with your details. Would you like to go to the contact page?`)) {
        window.location.href = 'index.html#contact';
    }
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
window.viewProgramDetails = viewProgramDetails;
window.openReservationModal = openReservationModal;
window.navigateToProgramDetail = navigateToProgramDetail;

