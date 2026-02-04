let allPrograms = [];
let filteredPrograms = [];
let currentEditingProgram = null;

document.addEventListener('DOMContentLoaded', function() {
    updateActiveNavItem('group-programs.html');
    loadPrograms();
    
    // Setup search and filters
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('cityFilter').addEventListener('change', applyFilters);
    document.getElementById('countryFilter').addEventListener('change', applyFilters);
});

async function loadPrograms() {
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GROUP_PROGRAMS));
        if (!response.ok) throw new Error('Failed to load programs');
        
        allPrograms = await response.json();
        
        // Populate filter dropdowns
        populateFilters();
        applyFilters();
    } catch (error) {
        console.error('Error loading programs:', error);
        document.getElementById('programsTable').innerHTML = 
            '<tr><td colspan="7" class="text-center text-danger">Error loading group programs. Please try again.</td></tr>';
    }
}

function populateFilters() {
    const cities = [...new Set(allPrograms.map(p => p.city).filter(Boolean))].sort();
    const countries = [...new Set(allPrograms.map(p => p.country).filter(Boolean))].sort();
    
    const cityFilter = document.getElementById('cityFilter');
    const countryFilter = document.getElementById('countryFilter');
    
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        cityFilter.appendChild(option);
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
    const cityFilter = document.getElementById('cityFilter').value;
    const countryFilter = document.getElementById('countryFilter').value;
    
    filteredPrograms = allPrograms.filter(p => {
        const matchesSearch = !searchTerm || 
            p.name?.toLowerCase().includes(searchTerm) ||
            p.city?.toLowerCase().includes(searchTerm) ||
            p.country?.toLowerCase().includes(searchTerm);
        
        const matchesCity = !cityFilter || p.city === cityFilter;
        const matchesCountry = !countryFilter || p.country === countryFilter;
        
        return matchesSearch && matchesCity && matchesCountry;
    });
    
    renderPrograms();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('cityFilter').value = '';
    document.getElementById('countryFilter').value = '';
    applyFilters();
}

function renderPrograms() {
    const tableBody = document.getElementById('programsTable');
    
    if (filteredPrograms.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No group programs found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = filteredPrograms.map(program => `
        <tr>
            <td>#${program.id}</td>
            <td><strong>${program.name}</strong></td>
            <td>${program.city || 'N/A'}</td>
            <td>${program.country || 'N/A'}</td>
            <td>${program.durationDays || 0} ${program.durationDays === 1 ? 'Day' : 'Days'}</td>
            <td>${program.days?.length || 0}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewProgramDetails(${program.id})">
                    <i class="bi bi-eye"></i> View
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="editProgram(${program.id})">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteProgram(${program.id})">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

async function viewProgramDetails(id) {
    const program = allPrograms.find(p => p.id === id);
    if (!program) {
        alert('Program not found');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('programDetailsModal'));
    const content = document.getElementById('programDetailsContent');
    const editBtn = document.getElementById('editProgramBtn');
    
    editBtn.onclick = () => {
        bootstrap.Modal.getInstance(document.getElementById('programDetailsModal')).hide();
        setTimeout(() => editProgram(id), 300);
    };
    
    // Get full program data from API
    try {
        const response = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.GROUP_PROGRAMS}/${id}`));
        if (response.ok) {
            const fullProgram = await response.json();
            program.days = fullProgram.days || program.days;
        }
    } catch (error) {
        console.warn('Could not fetch full program details:', error);
    }
    
    const daysHtml = program.days && program.days.length > 0
        ? '<div class="list-group">' + program.days.map(day => `
            <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">
                        <span class="badge bg-primary me-2">Day ${day.dayNumber}</span>
                        ${day.title}
                        ${day.isOptional ? '<span class="badge bg-warning text-dark ms-2">Optional</span>' : ''}
                    </h6>
                </div>
                ${day.description ? `<p class="mb-1">${day.description}</p>` : ''}
            </div>
        `).join('') + '</div>'
        : '<p class="text-muted mb-0">No days specified</p>';
    
    content.innerHTML = `
        <div class="row mb-4">
            <div class="col-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-body">
                        <h4 class="card-title mb-3">${program.name}</h4>
                        <div class="row">
                            <div class="col-md-6">
                                <p class="mb-2"><i class="bi bi-geo-alt me-2"></i><strong>City:</strong> ${program.city || 'N/A'}</p>
                                <p class="mb-2"><i class="bi bi-flag me-2"></i><strong>Country:</strong> ${program.country || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-2"><i class="bi bi-calendar me-2"></i><strong>Duration:</strong> ${program.durationDays || 0} Days</p>
                                <p class="mb-2"><i class="bi bi-image me-2"></i><strong>Image:</strong> ${program.image || 'N/A'}</p>
                            </div>
                        </div>
                        ${program.description ? `<div class="alert alert-info mt-3 mb-0"><strong>Description:</strong> ${program.description}</div>` : ''}
                    </div>
                </div>
            </div>
        </div>
        <div class="mb-3">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-info text-white">
                    <h6 class="mb-0"><i class="bi bi-map me-2"></i>Program Itinerary (${program.days?.length || 0} Days)</h6>
                </div>
                <div class="card-body">
                    ${daysHtml}
                </div>
            </div>
        </div>
    `;
    
    modal.show();
}

function showAddProgramModal() {
    alert('Add Group Program functionality will be implemented. For now, please use the API directly or contact the developer.');
}

async function editProgram(id) {
    const program = allPrograms.find(p => p.id === id);
    if (!program) {
        alert('Program not found');
        return;
    }
    
    currentEditingProgram = id;
    
    // Get full program data from API
    let fullProgram = null;
    try {
        const response = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.GROUP_PROGRAMS}/${id}`));
        if (response.ok) {
            fullProgram = await response.json();
            program.days = fullProgram.days || program.days;
            program.transportOptions = fullProgram.transportOptions || program.transportOptions || [];
        }
    } catch (error) {
        console.error('Error fetching program details:', error);
    }
    
    const modal = new bootstrap.Modal(document.getElementById('programEditModal'));
    const content = document.getElementById('programEditContent');
    
    const daysList = program.days || [];
    const transportOptionsList = program.transportOptions || [];
    
    content.innerHTML = `
        <form id="programEditForm">
            <input type="hidden" id="programId" value="${program.id}">
            
            <!-- Basic Information -->
            <div class="card mb-3">
                <div class="card-header bg-primary text-white">
                    <h6 class="mb-0">Basic Information</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Name (English) *</label>
                            <input type="text" class="form-control" id="editName" value="${escapeHtml(program.name || '')}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">City *</label>
                            <input type="text" class="form-control" id="editCity" value="${escapeHtml(program.city || '')}" required>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Country *</label>
                            <input type="text" class="form-control" id="editCountry" value="${escapeHtml(program.country || '')}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Duration (Days) *</label>
                            <input type="number" class="form-control" id="editDurationDays" value="${program.durationDays || 0}" min="1" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Image URL</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="editImage" value="${escapeHtml(program.image || '')}" placeholder="Enter image URL or use Unsplash">
                            <button type="button" class="btn btn-outline-secondary" onclick="previewImage('editImage')" title="Preview Image">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                        <small class="text-muted">Enter full URL (e.g., https://images.unsplash.com/...) or leave empty to use default city image</small>
                        <div id="imagePreview" class="mt-2" style="display: none;">
                            <img id="previewImg" src="" alt="Preview" class="img-thumbnail" style="max-width: 200px; max-height: 150px;">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description (English)</label>
                        <textarea class="form-control" id="editDescription" rows="3">${escapeHtml(program.description || '')}</textarea>
                    </div>
                </div>
            </div>
            
            <!-- Transport Options -->
            <div class="card mb-3">
                <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                    <h6 class="mb-0"><i class="bi bi-car-front me-2"></i>Transport Options</h6>
                    <button type="button" class="btn btn-sm btn-light" onclick="addTransportOption()">
                        <i class="bi bi-plus"></i> Add Option
                    </button>
                </div>
                <div class="card-body">
                    <div id="transportOptionsContainer">
                        ${transportOptionsList.map((option, idx) => buildTransportOptionItem(option, idx)).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Program Days -->
            <div class="card mb-3">
                <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Program Days</h6>
                    <button type="button" class="btn btn-sm btn-light" onclick="addDayItem()">
                        <i class="bi bi-plus"></i> Add Day
                    </button>
                </div>
                <div class="card-body">
                    <div id="daysContainer">
                        ${daysList.map((day, idx) => buildDayEditItem(day, idx)).join('')}
                    </div>
                </div>
            </div>
        </form>
    `;
    
    modal.show();
    
    // Add event listeners for day number changes
    setTimeout(() => {
        document.querySelectorAll('.day-number').forEach(input => {
            input.addEventListener('input', function() {
                const card = this.closest('.day-item');
                const title = card.querySelector('h6');
                if (title) {
                    title.textContent = `Day ${this.value || 1}`;
                }
            });
        });
    }, 100);
}

function buildTransportOptionItem(option, idx) {
    return `
        <div class="card mb-2 transport-option-item" data-index="${idx}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0"><i class="bi bi-car-front me-2"></i>Transport Option ${idx + 1}</h6>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeTransportOption(${idx})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-2">
                        <label class="form-label small">Name (English) *</label>
                        <input type="text" class="form-control form-control-sm transport-option-name" value="${escapeHtml(option.name || '')}" required>
                    </div>
                    <div class="col-md-6 mb-2">
                        <label class="form-label small">Price (IQD) *</label>
                        <input type="number" class="form-control form-control-sm transport-option-price" value="${option.price || 0}" min="0" step="1" required>
                    </div>
                </div>
                <div class="mb-2">
                    <label class="form-label small">Description (English)</label>
                    <textarea class="form-control form-control-sm transport-option-description" rows="2">${escapeHtml(option.description || '')}</textarea>
                </div>
                <div class="mb-2">
                    <label class="form-label small">Order</label>
                    <input type="number" class="form-control form-control-sm transport-option-order" value="${option.order !== undefined ? option.order : idx}" min="0">
                </div>
            </div>
        </div>
    `;
}

function buildDayEditItem(day, idx) {
    return `
        <div class="card mb-2 day-item" data-index="${idx}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">Day ${day.dayNumber}</h6>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeDayItem(${idx})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <div class="row">
                    <div class="col-md-2 mb-2">
                        <label class="form-label small">Day Number</label>
                        <input type="number" class="form-control form-control-sm day-number" value="${day.dayNumber}" min="1">
                    </div>
                    <div class="col-md-10 mb-2">
                        <label class="form-label small">Title (English) *</label>
                        <input type="text" class="form-control form-control-sm day-title" value="${escapeHtml(day.title || '')}" required>
                    </div>
                </div>
                <div class="mb-2">
                    <label class="form-label small">Description (English)</label>
                    <textarea class="form-control form-control-sm day-description" rows="2">${escapeHtml(day.description || '')}</textarea>
                </div>
                <div class="row">
                    <div class="col-md-12 mb-2">
                        <div class="form-check">
                            <input class="form-check-input day-optional" type="checkbox" ${day.isOptional ? 'checked' : ''}>
                            <label class="form-check-label small">Is Optional</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function addTransportOption() {
    const container = document.getElementById('transportOptionsContainer');
    const index = container.children.length;
    
    const div = document.createElement('div');
    div.className = 'card mb-2 transport-option-item';
    div.setAttribute('data-index', index);
    div.innerHTML = buildTransportOptionItem({
        name: '',
        price: 0,
        description: '',
        order: index
    }, index);
    
    container.appendChild(div);
    updateTransportOptionIndices();
}

function removeTransportOption(index) {
    const container = document.getElementById('transportOptionsContainer');
    const item = container.querySelector(`[data-index="${index}"]`);
    if (item) item.remove();
    updateTransportOptionIndices();
}

function updateTransportOptionIndices() {
    const container = document.getElementById('transportOptionsContainer');
    Array.from(container.children).forEach((child, idx) => {
        child.setAttribute('data-index', idx);
        const title = child.querySelector('h6');
        if (title) {
            title.innerHTML = `<i class="bi bi-car-front me-2"></i>Transport Option ${idx + 1}`;
        }
        const removeBtn = child.querySelector('button');
        if (removeBtn) removeBtn.setAttribute('onclick', `removeTransportOption(${idx})`);
    });
}

function previewImage(inputId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById('imagePreview');
    const img = document.getElementById('previewImg');
    
    if (input.value && input.value.trim() !== '') {
        img.src = input.value;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
}

function addDayItem() {
    const container = document.getElementById('daysContainer');
    const index = container.children.length;
    const maxDay = Math.max(...Array.from(container.children).map(item => {
        const dayInput = item.querySelector('.day-number');
        return dayInput ? parseInt(dayInput.value) || 0 : 0;
    }), 0);
    
    const div = document.createElement('div');
    div.className = 'card mb-2 day-item';
    div.setAttribute('data-index', index);
    div.innerHTML = buildDayEditItem({
        dayNumber: maxDay + 1,
        title: '',
        description: '',
        isOptional: false
    }, index);
    
    container.appendChild(div);
    updateDayIndices();
    
    // Add event listener for day number change
    const dayInput = div.querySelector('.day-number');
    if (dayInput) {
        dayInput.addEventListener('input', function() {
            const card = this.closest('.day-item');
            const title = card.querySelector('h6');
            if (title) {
                title.textContent = `Day ${this.value || 1}`;
            }
        });
    }
}

function removeDayItem(index) {
    const container = document.getElementById('daysContainer');
    const item = container.querySelector(`[data-index="${index}"]`);
    if (item) item.remove();
    updateDayIndices();
}

function updateDayIndices() {
    const container = document.getElementById('daysContainer');
    Array.from(container.children).forEach((child, idx) => {
        child.setAttribute('data-index', idx);
        const title = child.querySelector('h6');
        if (title) {
            const dayInput = child.querySelector('.day-number');
            const dayNum = dayInput ? dayInput.value : (idx + 1);
            title.textContent = `Day ${dayNum}`;
        }
        const removeBtn = child.querySelector('button');
        if (removeBtn) removeBtn.setAttribute('onclick', `removeDayItem(${idx})`);
    });
}

async function saveProgram() {
    const form = document.getElementById('programEditForm');
    if (!form || !form.checkValidity()) {
        form?.reportValidity();
        return;
    }
    
    const programId = document.getElementById('programId').value;
    
    // Collect transport options
    const transportOptions = Array.from(document.querySelectorAll('.transport-option-item')).map(item => {
        const name = item.querySelector('.transport-option-name').value.trim();
        const price = parseFloat(item.querySelector('.transport-option-price').value) || 0;
        const description = item.querySelector('.transport-option-description').value.trim();
        const order = parseInt(item.querySelector('.transport-option-order').value) || 0;
        
        return {
            name: name || 'Transport Option',
            price: price,
            description: description || null,
            order: order,
            translations: [] // Translations can be added later if needed
        };
    });
    
    // Collect days
    const days = Array.from(document.querySelectorAll('.day-item')).map(item => {
        const dayNumber = parseInt(item.querySelector('.day-number').value) || 1;
        const title = item.querySelector('.day-title').value.trim();
        const description = item.querySelector('.day-description').value.trim();
        const isOptional = item.querySelector('.day-optional').checked;
        
        return {
            dayNumber: dayNumber,
            title: title || `Day ${dayNumber}`,
            description: description || null,
            isOptional: isOptional,
            translations: [] // Translations can be added later if needed
        };
    });
    
    const updateData = {
        id: parseInt(programId),
        name: document.getElementById('editName').value.trim(),
        city: document.getElementById('editCity').value.trim(),
        country: document.getElementById('editCountry').value.trim(),
        durationDays: parseInt(document.getElementById('editDurationDays').value) || 0,
        image: document.getElementById('editImage').value.trim() || null,
        description: document.getElementById('editDescription').value.trim() || null,
        days: days,
        transportOptions: transportOptions,
        translations: null // Can be added later if needed
    };
    
    try {
        const response = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.GROUP_PROGRAMS}/update`), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to update program' }));
            throw new Error(error.error || error.message || 'Failed to update program');
        }
        
        const result = await response.json();
        
        // Close modal and reload
        bootstrap.Modal.getInstance(document.getElementById('programEditModal')).hide();
        await loadPrograms();
        
        alert('Group program updated successfully!');
    } catch (error) {
        console.error('Error updating program:', error);
        alert('Error updating program: ' + error.message);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function deleteProgram(id) {
    if (!confirm('Are you sure you want to delete this group program? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.GROUP_PROGRAMS}/${id}`), {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete group program');
        }
        
        await loadPrograms();
        alert('Group program deleted successfully!');
    } catch (error) {
        console.error('Error deleting group program:', error);
        alert('Error deleting group program: ' + error.message);
    }
}

