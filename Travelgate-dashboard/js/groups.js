let allGroups = [];
let filteredGroups = [];
let currentEditingGroup = null;

document.addEventListener('DOMContentLoaded', function() {
    // Update active nav item
    updateActiveNavItem('groups.html');
    
    loadGroups();
    
    // Setup search and filters
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('destinationFilter').addEventListener('change', applyFilters);
    document.getElementById('countryFilter').addEventListener('change', applyFilters);
});

async function loadGroups() {
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GROUPS));
        if (!response.ok) throw new Error('Failed to load groups');
        
        allGroups = await response.json();
        
        // Populate filter dropdowns
        populateFilters();
        applyFilters();
    } catch (error) {
        console.error('Error loading groups:', error);
        document.getElementById('groupsTable').innerHTML = 
            '<tr><td colspan="8" class="text-center text-danger">Error loading group tours. Please try again.</td></tr>';
    }
}

function populateFilters() {
    const destinations = [...new Set(allGroups.map(g => g.destination).filter(Boolean))].sort();
    const countries = [...new Set(allGroups.map(g => g.country).filter(Boolean))].sort();
    
    const destinationFilter = document.getElementById('destinationFilter');
    const countryFilter = document.getElementById('countryFilter');
    
    destinations.forEach(dest => {
        const option = document.createElement('option');
        option.value = dest;
        option.textContent = dest;
        destinationFilter.appendChild(option);
    });
    
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const destinationFilter = document.getElementById('destinationFilter').value;
    const countryFilter = document.getElementById('countryFilter').value;
    
    filteredGroups = allGroups.filter(g => {
        const matchesSearch = !searchTerm || 
            g.name?.toLowerCase().includes(searchTerm) ||
            g.destination?.toLowerCase().includes(searchTerm) ||
            g.country?.toLowerCase().includes(searchTerm);
        
        const matchesDestination = !destinationFilter || g.destination === destinationFilter;
        const matchesCountry = !countryFilter || g.country === countryFilter;
        
        return matchesSearch && matchesDestination && matchesCountry;
    });
    
    renderGroups();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('destinationFilter').value = '';
    document.getElementById('countryFilter').value = '';
    applyFilters();
}

function renderGroups() {
    const tableBody = document.getElementById('groupsTable');
    
    if (filteredGroups.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No group tours found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = filteredGroups.map(group => `
        <tr>
            <td>#${group.id}</td>
            <td><strong>${group.name}</strong></td>
            <td>${group.destination || 'N/A'}</td>
            <td>${group.country || 'N/A'}</td>
            <td>${group.airport || 'N/A'}</td>
            <td>${group.flightDays || 'N/A'}</td>
            <td>
                ${group.validityFrom ? formatDate(group.validityFrom) : 'N/A'} - 
                ${group.validityTo ? formatDate(group.validityTo) : 'N/A'}
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewGroupDetails(${group.id})">
                    <i class="bi bi-eye"></i> View
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="editGroup(${group.id})">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteGroup(${group.id})">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

async function viewGroupDetails(id) {
    const group = allGroups.find(g => g.id === id);
    if (!group) {
        alert('Group tour not found');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('groupDetailsModal'));
    const content = document.getElementById('groupDetailsContent');
    const editBtn = document.getElementById('editGroupBtn');
    
    // Set edit button to open edit modal
    editBtn.onclick = () => {
        bootstrap.Modal.getInstance(document.getElementById('groupDetailsModal')).hide();
        setTimeout(() => editGroup(id), 300); // Small delay for modal close animation
    };
    
    // Get full group data from API to ensure we have all details
    try {
        const response = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.GROUPS}/${id}`));
        if (response.ok) {
            const fullGroup = await response.json();
            group.includes = fullGroup.includes || group.includes;
            group.excludes = fullGroup.excludes || group.excludes;
            group.hotels = fullGroup.hotels || group.hotels;
            group.itinerary = fullGroup.itinerary?.details || group.itinerary;
            group.validityFrom = fullGroup.validityDates?.from || group.validityFrom;
            group.validityTo = fullGroup.validityDates?.to || group.validityTo;
        }
    } catch (error) {
        console.warn('Could not fetch full group details:', error);
    }
    
    // Build includes list
    const includesList = Array.isArray(group.includes) ? group.includes : [];
    const includesHtml = includesList.length > 0
        ? '<ul class="list-unstyled mb-0">' + includesList.map(inc => {
            const desc = typeof inc === 'string' ? inc : (inc.description || inc);
            return `<li><i class="bi bi-check-circle text-success me-2"></i>${desc}</li>`;
        }).join('') + '</ul>'
        : '<p class="text-muted mb-0">No includes specified</p>';
    
    // Build excludes list
    const excludesList = Array.isArray(group.excludes) ? group.excludes : [];
    const excludesHtml = excludesList.length > 0
        ? '<ul class="list-unstyled mb-0">' + excludesList.map(exc => {
            const desc = typeof exc === 'string' ? exc : (exc.description || exc);
            return `<li><i class="bi bi-x-circle text-danger me-2"></i>${desc}</li>`;
        }).join('') + '</ul>'
        : '<p class="text-muted mb-0">No excludes specified</p>';
    
    // Build hotels list with better formatting
    let hotelsHtml = '<p class="text-muted mb-0">No hotels specified</p>';
    if (group.hotels && group.hotels.length > 0) {
        hotelsHtml = '<div class="table-responsive"><table class="table table-sm table-bordered"><thead class="table-light"><tr><th>Name</th><th>Stars</th><th>Single</th><th>Double</th><th>Triple</th><th>Family</th></tr></thead><tbody>';
        group.hotels.forEach(hotel => {
            const singlePrice = hotel.prices?.single ?? hotel.singlePrice ?? 0;
            const doublePrice = hotel.prices?.double ?? hotel.doublePrice ?? 0;
            const triplePrice = hotel.prices?.triple ?? hotel.triplePrice ?? 0;
            const familyPrice = hotel.prices?.family ?? hotel.familyPrice ?? 0;
            
            hotelsHtml += `
                <tr>
                    <td><strong>${hotel.name || 'N/A'}</strong></td>
                    <td><span class="badge bg-warning">${hotel.stars || 'N/A'} ⭐</span></td>
                    <td>${singlePrice > 0 ? formatCurrency(singlePrice) + ' IQD' : '<span class="text-muted">-</span>'}</td>
                    <td>${doublePrice > 0 ? formatCurrency(doublePrice) + ' IQD' : '<span class="text-muted">-</span>'}</td>
                    <td>${triplePrice > 0 ? formatCurrency(triplePrice) + ' IQD' : '<span class="text-muted">-</span>'}</td>
                    <td>${familyPrice > 0 ? formatCurrency(familyPrice) + ' IQD' : '<span class="text-muted">-</span>'}</td>
                </tr>
            `;
        });
        hotelsHtml += '</tbody></table></div>';
    }
    
    // Build itinerary list with better formatting
    let itineraryHtml = '<p class="text-muted mb-0">No itinerary specified</p>';
    const itineraryList = group.itinerary?.details || group.itinerary || [];
    if (Array.isArray(itineraryList) && itineraryList.length > 0) {
        itineraryHtml = '<div class="list-group">';
        itineraryList.forEach((item, index) => {
            const day = item.day || (index + 1);
            const title = item.title || `Day ${day}`;
            const desc = item.description || (typeof item === 'string' ? item : '');
            itineraryHtml += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1"><span class="badge bg-primary me-2">Day ${day}</span>${title}</h6>
                    </div>
                    ${desc ? `<p class="mb-1">${desc}</p>` : ''}
                </div>
            `;
        });
        itineraryHtml += '</div>';
    }
    
    content.innerHTML = `
        <div class="row mb-4">
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-body">
                        <h4 class="card-title mb-3">${group.name}</h4>
                        <div class="row">
                            <div class="col-md-6">
                                <p class="mb-2"><i class="bi bi-geo-alt me-2"></i><strong>Destination:</strong> ${group.destination || 'N/A'}</p>
                                <p class="mb-2"><i class="bi bi-flag me-2"></i><strong>Country:</strong> ${group.country || 'N/A'}</p>
                                <p class="mb-2"><i class="bi bi-airplane me-2"></i><strong>Airport:</strong> ${group.airport || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-2"><i class="bi bi-calendar me-2"></i><strong>Flight Days:</strong> ${group.flightDays || 'N/A'}</p>
                                <p class="mb-2"><i class="bi bi-currency-exchange me-2"></i><strong>Currency:</strong> ${group.currency || 'IQD'}</p>
                                <p class="mb-2"><i class="bi bi-calendar-range me-2"></i><strong>Validity:</strong> ${group.validityFrom ? formatDate(group.validityFrom) : 'N/A'} - ${group.validityTo ? formatDate(group.validityTo) : 'N/A'}</p>
                            </div>
                        </div>
                        ${group.notes ? `<div class="alert alert-info mt-3 mb-0"><strong>Notes:</strong> ${group.notes}</div>` : ''}
                    </div>
                </div>
            </div>
        </div>
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="bi bi-check-circle me-2"></i>Includes</h6>
                    </div>
                    <div class="card-body">
                        ${includesHtml}
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-danger text-white">
                        <h6 class="mb-0"><i class="bi bi-x-circle me-2"></i>Excludes</h6>
                    </div>
                    <div class="card-body">
                        ${excludesHtml}
                    </div>
                </div>
            </div>
        </div>
        <div class="mb-4">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h6 class="mb-0"><i class="bi bi-building me-2"></i>Hotels (${group.hotels?.length || 0})</h6>
                </div>
                <div class="card-body">
                    ${hotelsHtml}
                </div>
            </div>
        </div>
        <div class="mb-3">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-info text-white">
                    <h6 class="mb-0"><i class="bi bi-map me-2"></i>Itinerary</h6>
                </div>
                <div class="card-body">
                    ${itineraryHtml}
                </div>
            </div>
        </div>
    `;
    
    modal.show();
}

function showAddGroupModal() {
    alert('Add Group Tour functionality will be implemented in the backend API first.');
}

async function editGroup(id) {
    const group = allGroups.find(g => g.id === id);
    if (!group) {
        alert('Group tour not found');
        return;
    }
    
    currentEditingGroup = id;
    
    // Get full group data from API
    try {
        const response = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.GROUPS}/${id}`));
        if (response.ok) {
            const fullGroup = await response.json();
            group.includes = fullGroup.includes || group.includes;
            group.excludes = fullGroup.excludes || group.excludes;
            group.hotels = fullGroup.hotels || group.hotels;
            group.itinerary = fullGroup.itinerary?.details || group.itinerary;
            group.validityFrom = fullGroup.validityDates?.from || group.validityFrom;
            group.validityTo = fullGroup.validityDates?.to || group.validityTo;
        }
    } catch (error) {
        console.error('Error fetching group details:', error);
    }
    
    const modal = new bootstrap.Modal(document.getElementById('groupEditModal'));
    const content = document.getElementById('groupEditContent');
    
    // Build edit form
    const includesList = Array.isArray(group.includes) ? group.includes : [];
    const excludesList = Array.isArray(group.excludes) ? group.excludes : [];
    const hotelsList = group.hotels || [];
    const itineraryList = group.itinerary?.details || group.itinerary || [];
    
    content.innerHTML = `
        <form id="groupEditForm">
            <input type="hidden" id="groupId" value="${group.id}">
            
            <!-- Basic Information -->
            <div class="card mb-3">
                <div class="card-header bg-primary text-white">
                    <h6 class="mb-0">Basic Information</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Name *</label>
                            <input type="text" class="form-control" id="editName" value="${group.name || ''}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Destination *</label>
                            <input type="text" class="form-control" id="editDestination" value="${group.destination || ''}" required>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Country *</label>
                            <input type="text" class="form-control" id="editCountry" value="${group.country || ''}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Currency</label>
                            <input type="text" class="form-control" id="editCurrency" value="${group.currency || 'IQD'}">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Airport</label>
                            <input type="text" class="form-control" id="editAirport" value="${group.airport || ''}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Flight Days</label>
                            <input type="text" class="form-control" id="editFlightDays" value="${group.flightDays || ''}" placeholder="e.g., SAT,TUE">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Validity From</label>
                            <input type="date" class="form-control" id="editValidityFrom" value="${group.validityFrom ? (typeof group.validityFrom === 'string' ? group.validityFrom.split('T')[0] : new Date(group.validityFrom).toISOString().split('T')[0]) : ''}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Validity To</label>
                            <input type="date" class="form-control" id="editValidityTo" value="${group.validityTo ? (typeof group.validityTo === 'string' ? group.validityTo.split('T')[0] : new Date(group.validityTo).toISOString().split('T')[0]) : ''}">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Image URL</label>
                        <input type="text" class="form-control" id="editImage" value="${group.image || ''}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Notes</label>
                        <textarea class="form-control" id="editNotes" rows="3">${group.notes || ''}</textarea>
                    </div>
                </div>
            </div>
            
            <!-- Includes -->
            <div class="card mb-3">
                <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Includes</h6>
                    <button type="button" class="btn btn-sm btn-light" onclick="addIncludeItem()">
                        <i class="bi bi-plus"></i> Add
                    </button>
                </div>
                <div class="card-body">
                    <div id="includesContainer">
                        ${includesList.map((inc, idx) => {
                            const desc = typeof inc === 'string' ? inc : (inc.description || inc);
                            return `
                                <div class="input-group mb-2" data-index="${idx}">
                                    <input type="text" class="form-control include-item" value="${desc}">
                                    <button type="button" class="btn btn-outline-danger" onclick="removeIncludeItem(${idx})">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Excludes -->
            <div class="card mb-3">
                <div class="card-header bg-danger text-white d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Excludes</h6>
                    <button type="button" class="btn btn-sm btn-light" onclick="addExcludeItem()">
                        <i class="bi bi-plus"></i> Add
                    </button>
                </div>
                <div class="card-body">
                    <div id="excludesContainer">
                        ${excludesList.map((exc, idx) => {
                            const desc = typeof exc === 'string' ? exc : (exc.description || exc);
                            return `
                                <div class="input-group mb-2" data-index="${idx}">
                                    <input type="text" class="form-control exclude-item" value="${desc}">
                                    <button type="button" class="btn btn-outline-danger" onclick="removeExcludeItem(${idx})">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Hotels -->
            <div class="card mb-3">
                <div class="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Hotels</h6>
                    <button type="button" class="btn btn-sm btn-dark" onclick="addHotelItem()">
                        <i class="bi bi-plus"></i> Add Hotel
                    </button>
                </div>
                <div class="card-body">
                    <div id="hotelsContainer">
                        ${hotelsList.map((hotel, idx) => {
                            const singlePrice = hotel.prices?.single ?? hotel.singlePrice ?? 0;
                            const doublePrice = hotel.prices?.double ?? hotel.doublePrice ?? 0;
                            const triplePrice = hotel.prices?.triple ?? hotel.triplePrice ?? 0;
                            const familyPrice = hotel.prices?.family ?? hotel.familyPrice ?? 0;
                            return `
                                <div class="card mb-3 hotel-item" data-index="${idx}">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <h6 class="mb-0">Hotel ${idx + 1}</h6>
                                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeHotelItem(${idx})">
                                                <i class="bi bi-trash"></i> Remove
                                            </button>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6 mb-2">
                                                <label class="form-label small">Hotel Name *</label>
                                                <input type="text" class="form-control form-control-sm hotel-name" value="${hotel.name || ''}" required>
                                            </div>
                                            <div class="col-md-3 mb-2">
                                                <label class="form-label small">Stars</label>
                                                <input type="number" class="form-control form-control-sm hotel-stars" value="${hotel.stars || ''}" step="0.5" min="1" max="5">
                                            </div>
                                            <div class="col-md-3 mb-2">
                                                <label class="form-label small">Hotel ID</label>
                                                <input type="text" class="form-control form-control-sm hotel-id" value="${hotel.id || hotel.hotelId || ''}">
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-3 mb-2">
                                                <label class="form-label small">Single Price (IQD)</label>
                                                <input type="number" class="form-control form-control-sm hotel-single" value="${singlePrice}" step="0.01">
                                            </div>
                                            <div class="col-md-3 mb-2">
                                                <label class="form-label small">Double Price (IQD)</label>
                                                <input type="number" class="form-control form-control-sm hotel-double" value="${doublePrice}" step="0.01">
                                            </div>
                                            <div class="col-md-3 mb-2">
                                                <label class="form-label small">Triple Price (IQD)</label>
                                                <input type="number" class="form-control form-control-sm hotel-triple" value="${triplePrice}" step="0.01">
                                            </div>
                                            <div class="col-md-3 mb-2">
                                                <label class="form-label small">Family Price (IQD)</label>
                                                <input type="number" class="form-control form-control-sm hotel-family" value="${familyPrice}" step="0.01">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Itinerary -->
            <div class="card mb-3">
                <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Itinerary</h6>
                    <button type="button" class="btn btn-sm btn-light" onclick="addItineraryItem()">
                        <i class="bi bi-plus"></i> Add Day
                    </button>
                </div>
                <div class="card-body">
                    <div id="itineraryContainer">
                        ${itineraryList.map((item, idx) => {
                            const day = item.day || (idx + 1);
                            const title = item.title || `Day ${day}`;
                            const desc = item.description || (typeof item === 'string' ? item : '');
                            return `
                                <div class="card mb-2 itinerary-item" data-index="${idx}">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <h6 class="mb-0">Day ${day}</h6>
                                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeItineraryItem(${idx})">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-2 mb-2">
                                                <label class="form-label small">Day Number</label>
                                                <input type="number" class="form-control form-control-sm itinerary-day" value="${day}" min="1">
                                            </div>
                                            <div class="col-md-10 mb-2">
                                                <label class="form-label small">Title</label>
                                                <input type="text" class="form-control form-control-sm itinerary-title" value="${title}">
                                            </div>
                                        </div>
                                        <div class="mb-2">
                                            <label class="form-label small">Description</label>
                                            <textarea class="form-control form-control-sm itinerary-desc" rows="2">${desc}</textarea>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </form>
    `;
    
    modal.show();
}

// Helper functions for dynamic form items
function addIncludeItem() {
    const container = document.getElementById('includesContainer');
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.setAttribute('data-index', index);
    div.innerHTML = `
        <input type="text" class="form-control include-item" placeholder="Include item">
        <button type="button" class="btn btn-outline-danger" onclick="removeIncludeItem(${index})">
            <i class="bi bi-trash"></i>
        </button>
    `;
    container.appendChild(div);
}

function removeIncludeItem(index) {
    const container = document.getElementById('includesContainer');
    const item = container.querySelector(`[data-index="${index}"]`);
    if (item) item.remove();
    // Re-index remaining items
    Array.from(container.children).forEach((child, idx) => {
        child.setAttribute('data-index', idx);
        const btn = child.querySelector('button');
        if (btn) btn.setAttribute('onclick', `removeIncludeItem(${idx})`);
    });
}

function addExcludeItem() {
    const container = document.getElementById('excludesContainer');
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.setAttribute('data-index', index);
    div.innerHTML = `
        <input type="text" class="form-control exclude-item" placeholder="Exclude item">
        <button type="button" class="btn btn-outline-danger" onclick="removeExcludeItem(${index})">
            <i class="bi bi-trash"></i>
        </button>
    `;
    container.appendChild(div);
}

function removeExcludeItem(index) {
    const container = document.getElementById('excludesContainer');
    const item = container.querySelector(`[data-index="${index}"]`);
    if (item) item.remove();
    // Re-index remaining items
    Array.from(container.children).forEach((child, idx) => {
        child.setAttribute('data-index', idx);
        const btn = child.querySelector('button');
        if (btn) btn.setAttribute('onclick', `removeExcludeItem(${idx})`);
    });
}

function addHotelItem() {
    const container = document.getElementById('hotelsContainer');
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'card mb-3 hotel-item';
    div.setAttribute('data-index', index);
    div.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0">Hotel ${index + 1}</h6>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeHotelItem(${index})">
                    <i class="bi bi-trash"></i> Remove
                </button>
            </div>
            <div class="row">
                <div class="col-md-6 mb-2">
                    <label class="form-label small">Hotel Name *</label>
                    <input type="text" class="form-control form-control-sm hotel-name" required>
                </div>
                <div class="col-md-3 mb-2">
                    <label class="form-label small">Stars</label>
                    <input type="number" class="form-control form-control-sm hotel-stars" step="0.5" min="1" max="5">
                </div>
                <div class="col-md-3 mb-2">
                    <label class="form-label small">Hotel ID</label>
                    <input type="text" class="form-control form-control-sm hotel-id" value="hotel-${index + 1}">
                </div>
            </div>
            <div class="row">
                <div class="col-md-3 mb-2">
                    <label class="form-label small">Single Price (IQD)</label>
                    <input type="number" class="form-control form-control-sm hotel-single" step="0.01">
                </div>
                <div class="col-md-3 mb-2">
                    <label class="form-label small">Double Price (IQD)</label>
                    <input type="number" class="form-control form-control-sm hotel-double" step="0.01">
                </div>
                <div class="col-md-3 mb-2">
                    <label class="form-label small">Triple Price (IQD)</label>
                    <input type="number" class="form-control form-control-sm hotel-triple" step="0.01">
                </div>
                <div class="col-md-3 mb-2">
                    <label class="form-label small">Family Price (IQD)</label>
                    <input type="number" class="form-control form-control-sm hotel-family" step="0.01">
                </div>
            </div>
        </div>
    `;
    container.appendChild(div);
}

function removeHotelItem(index) {
    const container = document.getElementById('hotelsContainer');
    const item = container.querySelector(`[data-index="${index}"]`);
    if (item) item.remove();
    // Re-index remaining items
    Array.from(container.children).forEach((child, idx) => {
        child.setAttribute('data-index', idx);
        const title = child.querySelector('h6');
        if (title) title.textContent = `Hotel ${idx + 1}`;
        const btn = child.querySelector('button');
        if (btn) btn.setAttribute('onclick', `removeHotelItem(${idx})`);
    });
}

function addItineraryItem() {
    const container = document.getElementById('itineraryContainer');
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'card mb-2 itinerary-item';
    div.setAttribute('data-index', index);
    div.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">Day ${index + 1}</h6>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeItineraryItem(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
            <div class="row">
                <div class="col-md-2 mb-2">
                    <label class="form-label small">Day Number</label>
                    <input type="number" class="form-control form-control-sm itinerary-day" value="${index + 1}" min="1">
                </div>
                <div class="col-md-10 mb-2">
                    <label class="form-label small">Title</label>
                    <input type="text" class="form-control form-control-sm itinerary-title" placeholder="Day title">
                </div>
            </div>
            <div class="mb-2">
                <label class="form-label small">Description</label>
                <textarea class="form-control form-control-sm itinerary-desc" rows="2" placeholder="Day description"></textarea>
            </div>
        </div>
    `;
    container.appendChild(div);
}

function removeItineraryItem(index) {
    const container = document.getElementById('itineraryContainer');
    const item = container.querySelector(`[data-index="${index}"]`);
    if (item) item.remove();
    // Re-index remaining items
    Array.from(container.children).forEach((child, idx) => {
        child.setAttribute('data-index', idx);
        const title = child.querySelector('h6');
        if (title) {
            const dayInput = child.querySelector('.itinerary-day');
            const dayNum = dayInput ? dayInput.value : (idx + 1);
            title.textContent = `Day ${dayNum}`;
        }
        const btn = child.querySelector('button');
        if (btn) btn.setAttribute('onclick', `removeItineraryItem(${idx})`);
    });
}

async function saveGroup() {
    const form = document.getElementById('groupEditForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const groupId = document.getElementById('groupId').value;
    
    // Collect includes
    const includes = Array.from(document.querySelectorAll('.include-item'))
        .map(input => input.value.trim())
        .filter(val => val.length > 0);
    
    // Collect excludes
    const excludes = Array.from(document.querySelectorAll('.exclude-item'))
        .map(input => input.value.trim())
        .filter(val => val.length > 0);
    
    // Collect hotels
    const hotels = Array.from(document.querySelectorAll('.hotel-item')).map((item, idx) => {
        const name = item.querySelector('.hotel-name').value.trim();
        if (!name) return null;
        
        return {
            hotelId: item.querySelector('.hotel-id').value.trim() || `hotel-${idx + 1}`,
            name: name,
            stars: parseFloat(item.querySelector('.hotel-stars').value) || 0,
            prices: {
                single: parseFloat(item.querySelector('.hotel-single').value) || null,
                double: parseFloat(item.querySelector('.hotel-double').value) || null,
                triple: parseFloat(item.querySelector('.hotel-triple').value) || null,
                family: parseFloat(item.querySelector('.hotel-family').value) || null
            }
        };
    }).filter(h => h !== null);
    
    // Collect itinerary
    const itinerary = Array.from(document.querySelectorAll('.itinerary-item')).map(item => {
        const day = parseInt(item.querySelector('.itinerary-day').value) || 1;
        const title = item.querySelector('.itinerary-title').value.trim();
        const desc = item.querySelector('.itinerary-desc').value.trim();
        
        return {
            day: day,
            title: title || `Day ${day}`,
            description: desc || null
        };
    });
    
    // Parse dates (convert to UTC)
    const validityFromInput = document.getElementById('editValidityFrom').value;
    const validityToInput = document.getElementById('editValidityTo').value;
    const validityFrom = validityFromInput ? new Date(validityFromInput + 'T00:00:00Z') : null;
    const validityTo = validityToInput ? new Date(validityToInput + 'T00:00:00Z') : null;
    
    const updateData = {
        name: document.getElementById('editName').value.trim(),
        destination: document.getElementById('editDestination').value.trim(),
        country: document.getElementById('editCountry').value.trim(),
        currency: document.getElementById('editCurrency').value.trim() || 'IQD',
        airport: document.getElementById('editAirport').value.trim() || null,
        flightDays: document.getElementById('editFlightDays').value.trim() || null,
        image: document.getElementById('editImage').value.trim() || null,
        notes: document.getElementById('editNotes').value.trim() || null,
        validityFrom: validityFrom,
        validityTo: validityTo,
        includes: includes,
        excludes: excludes,
        hotels: hotels,
        itinerary: itinerary
    };
    
    try {
        // Include ID in the request body
        updateData.id = groupId;
        
        const response = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.GROUPS}/update`), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to update group' }));
            throw new Error(error.error || error.message || 'Failed to update group');
        }
        
        const result = await response.json();
        
        // Close modal and reload
        bootstrap.Modal.getInstance(document.getElementById('groupEditModal')).hide();
        await loadGroups();
        
        alert('Group tour updated successfully!');
    } catch (error) {
        console.error('Error updating group:', error);
        alert('Error updating group: ' + error.message);
    }
}

async function deleteGroup(id) {
    if (!confirm('Are you sure you want to delete this group tour? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.GROUPS}/${id}`), {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete group tour');
        }
        
        await loadGroups();
        alert('Group tour deleted successfully!');
    } catch (error) {
        console.error('Error deleting group tour:', error);
        alert('Error deleting group tour: ' + error.message);
    }
}

