let allFlightPackages = [];
let filteredFlightPackages = [];

document.addEventListener('DOMContentLoaded', function() {
    // Update active nav item
    updateActiveNavItem('flights.html');
    
    loadFlightPackages();
    
    // Setup search and filters
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('tripTypeFilter').addEventListener('change', applyFilters);
    document.getElementById('classFilter').addEventListener('change', applyFilters);
    document.getElementById('activeFilter').addEventListener('change', applyFilters);
});

async function loadFlightPackages() {
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.FLIGHT_PACKAGES + '/all'));
        if (!response.ok) throw new Error('Failed to load flight packages');
        
        allFlightPackages = await response.json();
        applyFilters();
    } catch (error) {
        console.error('Error loading flight packages:', error);
        document.getElementById('flightPackagesTable').innerHTML = 
            '<tr><td colspan="9" class="text-center text-danger">Error loading flight packages. Please try again.</td></tr>';
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const tripTypeFilter = document.getElementById('tripTypeFilter').value;
    const classFilter = document.getElementById('classFilter').value;
    const activeFilter = document.getElementById('activeFilter').value;
    
    filteredFlightPackages = allFlightPackages.filter(fp => {
        const matchesSearch = !searchTerm || 
            fp.airline?.toLowerCase().includes(searchTerm) ||
            fp.origin?.toLowerCase().includes(searchTerm) ||
            fp.destination?.toLowerCase().includes(searchTerm);
        
        const matchesTripType = !tripTypeFilter || fp.tripType === tripTypeFilter;
        const matchesClass = !classFilter || fp.class === classFilter;
        const matchesActive = activeFilter === '' || String(fp.isActive) === activeFilter;
        
        return matchesSearch && matchesTripType && matchesClass && matchesActive;
    });
    
    renderFlightPackages();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('tripTypeFilter').value = '';
    document.getElementById('classFilter').value = '';
    document.getElementById('activeFilter').value = '';
    applyFilters();
}

function renderFlightPackages() {
    const tableBody = document.getElementById('flightPackagesTable');
    
    if (filteredFlightPackages.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No flight packages found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = filteredFlightPackages.map(fp => {
        const route = `${fp.origin} → ${fp.destination}`;
        const classBadge = fp.class === 'Economy' ? 'bg-warning' : 
                         fp.class === 'Business' ? 'bg-info' : 'bg-success';
        const statusBadge = fp.isActive ? 'bg-success' : 'bg-secondary';
        
        return `
        <tr>
            <td>#${fp.id}</td>
            <td><strong>${fp.airline || 'N/A'}</strong></td>
            <td>${route}</td>
            <td><span class="badge bg-secondary">${fp.tripType || 'N/A'}</span></td>
            <td><span class="badge ${classBadge}">${fp.class || 'N/A'}</span></td>
            <td>${formatCurrency(fp.price || 0)} IQD</td>
            <td>${fp.baggage || 'N/A'}</td>
            <td><span class="badge ${statusBadge}">${fp.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editFlightPackage(${fp.id})">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteFlightPackage(${fp.id})">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

function showAddFlightPackageModal() {
    document.getElementById('flightPackageModalTitle').textContent = 'Add Flight Package';
    document.getElementById('flightPackageForm').reset();
    document.getElementById('flightPackageId').value = '';
    document.getElementById('flightPackageIsActive').checked = true;
    const modal = new bootstrap.Modal(document.getElementById('flightPackageModal'));
    modal.show();
}

async function editFlightPackage(id) {
    const flightPackage = allFlightPackages.find(fp => fp.id === id);
    if (!flightPackage) {
        alert('Flight package not found');
        return;
    }
    
    document.getElementById('flightPackageModalTitle').textContent = 'Edit Flight Package';
    document.getElementById('flightPackageId').value = flightPackage.id;
    document.getElementById('flightPackageAirline').value = flightPackage.airline || '';
    document.getElementById('flightPackageLogo').value = flightPackage.airlineLogo || '';
    document.getElementById('flightPackageOrigin').value = flightPackage.origin || '';
    document.getElementById('flightPackageDestination').value = flightPackage.destination || '';
    document.getElementById('flightPackageTripType').value = flightPackage.tripType || '';
    document.getElementById('flightPackageClass').value = flightPackage.class || '';
    document.getElementById('flightPackagePrice').value = flightPackage.price || '';
    document.getElementById('flightPackageBaggage').value = flightPackage.baggage || '';
    document.getElementById('flightPackageFeatures').value = flightPackage.features ? flightPackage.features.join(', ') : '';
    document.getElementById('flightPackageIsActive').checked = flightPackage.isActive !== false;
    
    const modal = new bootstrap.Modal(document.getElementById('flightPackageModal'));
    modal.show();
}

async function saveFlightPackage() {
    const form = document.getElementById('flightPackageForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const flightPackageId = document.getElementById('flightPackageId').value;
    const featuresInput = document.getElementById('flightPackageFeatures').value;
    const features = featuresInput ? featuresInput.split(',').map(f => f.trim()).filter(f => f) : null;
    
    const flightPackageData = {
        airline: document.getElementById('flightPackageAirline').value,
        origin: document.getElementById('flightPackageOrigin').value,
        destination: document.getElementById('flightPackageDestination').value,
        tripType: document.getElementById('flightPackageTripType').value,
        class: document.getElementById('flightPackageClass').value,
        price: parseFloat(document.getElementById('flightPackagePrice').value),
        baggage: document.getElementById('flightPackageBaggage').value || null,
        airlineLogo: document.getElementById('flightPackageLogo').value || null,
        features: features,
        isActive: document.getElementById('flightPackageIsActive').checked
    };
    
    try {
        // Always use POST - include ID in body for updates
        if (flightPackageId) {
            flightPackageData.id = parseInt(flightPackageId);
        }
        
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.FLIGHT_PACKAGES), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(flightPackageData)
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to save flight package' }));
            throw new Error(error.error || error.message || 'Failed to save flight package');
        }
        
        // Close modal and reload
        bootstrap.Modal.getInstance(document.getElementById('flightPackageModal')).hide();
        await loadFlightPackages();
        
        alert(flightPackageId ? 'Flight package updated successfully!' : 'Flight package added successfully!');
    } catch (error) {
        console.error('Error saving flight package:', error);
        alert('Error saving flight package: ' + error.message);
    }
}

async function deleteFlightPackage(id) {
    if (!confirm('Are you sure you want to delete this flight package? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.FLIGHT_PACKAGES}/${id}`), {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete flight package');
        }
        
        await loadFlightPackages();
        alert('Flight package deleted successfully!');
    } catch (error) {
        console.error('Error deleting flight package:', error);
        alert('Error deleting flight package: ' + error.message);
    }
}

