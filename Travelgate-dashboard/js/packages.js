let allPackages = [];
let filteredPackages = [];

document.addEventListener('DOMContentLoaded', function() {
    // Update active nav item
    updateActiveNavItem('packages.html');
    
    loadPackages();
    
    // Setup search and filters
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('cityFilter').addEventListener('change', applyFilters);
    document.getElementById('countryFilter').addEventListener('change', applyFilters);
});

async function loadPackages() {
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PACKAGES));
        if (!response.ok) throw new Error('Failed to load packages');
        
        allPackages = await response.json();
        
        // Populate filter dropdowns
        populateFilters();
        applyFilters();
    } catch (error) {
        console.error('Error loading packages:', error);
        document.getElementById('itemsTableBody').innerHTML = 
            '<tr><td colspan="7" class="text-center text-danger">Error loading packages. Please try again.</td></tr>';
    }
}

function populateFilters() {
    const cities = [...new Set(allPackages.map(p => p.city).filter(Boolean))].sort();
    const countries = [...new Set(allPackages.map(p => p.country).filter(Boolean))].sort();
    
    const cityFilter = document.getElementById('cityFilter');
    const countryFilter = document.getElementById('countryFilter');
    
    // Clear existing options (except "All")
    cityFilter.innerHTML = '<option value="">All Cities</option>';
    countryFilter.innerHTML = '<option value="">All Countries</option>';
    
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
    
    filteredPackages = allPackages.filter(p => {
        const matchesSearch = !searchTerm || 
            p.hotelName?.toLowerCase().includes(searchTerm) ||
            p.roomType?.toLowerCase().includes(searchTerm) ||
            p.city?.toLowerCase().includes(searchTerm) ||
            p.country?.toLowerCase().includes(searchTerm);
        
        const matchesCity = !cityFilter || p.city === cityFilter;
        const matchesCountry = !countryFilter || p.country === countryFilter;
        
        return matchesSearch && matchesCity && matchesCountry;
    });
    
    renderTable();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('cityFilter').value = '';
    document.getElementById('countryFilter').value = '';
    applyFilters();
}

function renderTable() {
    const tbody = document.getElementById('itemsTableBody');
    
    if (filteredPackages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No packages found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredPackages.map(pkg => `
        <tr>
            <td>${pkg.hotelName || '-'}</td>
            <td>${pkg.roomType || '-'}</td>
            <td>${pkg.nights || 0}</td>
            <td>${formatCurrency(pkg.price || 0)} IQD</td>
            <td>${pkg.city && pkg.country ? `${pkg.city}, ${pkg.country}` : (pkg.city || pkg.country || '-')}</td>
            <td>
                <span class="badge ${pkg.isActive ? 'bg-success' : 'bg-secondary'}">
                    ${pkg.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary" onclick="editPackage(${pkg.id})">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deletePackage(${pkg.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function showAddPackageModal() {
    document.getElementById('packageModalTitle').textContent = 'Create New Package';
    document.getElementById('packageForm').reset();
    document.getElementById('packageId').value = '';
    document.getElementById('packageFixedPriceGuarantee').checked = true;
    document.getElementById('packageEveryDay').checked = false;
    document.getElementById('packageIsActive').checked = true;
    const modal = new bootstrap.Modal(document.getElementById('packageModal'));
    modal.show();
}

async function editPackage(id) {
    const pkg = allPackages.find(p => p.id === id);
    if (!pkg) {
        alert('Package not found');
        return;
    }
    
    // Fetch full package details to get images and features
    try {
        const response = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.PACKAGES}/${id}`));
        if (!response.ok) throw new Error('Failed to load package details');
        const fullPackage = await response.json();
        
        document.getElementById('packageModalTitle').textContent = 'Edit Package';
        document.getElementById('packageId').value = fullPackage.id;
        document.getElementById('packageHotelName').value = fullPackage.hotelName || '';
        document.getElementById('packageRoomType').value = fullPackage.roomType || '';
        document.getElementById('packageNights').value = fullPackage.nights || '';
        document.getElementById('packagePrice').value = fullPackage.price || '';
        document.getElementById('packageHotelId').value = fullPackage.hotelId || '';
        document.getElementById('packageCity').value = fullPackage.city || '';
        document.getElementById('packageCountry').value = fullPackage.country || '';
        document.getElementById('packageFixedPriceGuarantee').checked = fullPackage.fixedPriceGuarantee !== false;
        document.getElementById('packageEveryDay').checked = fullPackage.everyDay === true;
        document.getElementById('packageIsActive').checked = fullPackage.isActive !== false;
        
        // Set images (comma-separated)
        const imageUrls = fullPackage.images && fullPackage.images.length > 0
            ? fullPackage.images.map(img => img.imageUrl).join(', ')
            : '';
        document.getElementById('packageImages').value = imageUrls;
        
        // Set features (comma-separated)
        const featureItems = fullPackage.features && fullPackage.features.length > 0
            ? fullPackage.features.map(f => f.item).join(', ')
            : '';
        document.getElementById('packageFeatures').value = featureItems;
        
        const modal = new bootstrap.Modal(document.getElementById('packageModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading package details:', error);
        alert('Error loading package details: ' + error.message);
    }
}

async function savePackage() {
    const form = document.getElementById('packageForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const packageId = document.getElementById('packageId').value;
    
    // Parse images (comma-separated string to array)
    const imagesInput = document.getElementById('packageImages').value.trim();
    const imageUrls = imagesInput ? imagesInput.split(',').map(url => url.trim()).filter(url => url) : [];
    if (imageUrls.length === 0) {
        alert('At least one image URL is required');
        return;
    }
    
    // Parse features (comma-separated string to array)
    const featuresInput = document.getElementById('packageFeatures').value.trim();
    const featureItems = featuresInput ? featuresInput.split(',').map(item => item.trim()).filter(item => item) : [];
    if (featureItems.length === 0) {
        alert('At least one feature is required');
        return;
    }
    
    // Build images array with order (1-based)
    const images = imageUrls.map((url, index) => ({
        id: 0,
        packageId: packageId ? parseInt(packageId) : 0,
        imageUrl: url,
        order: index + 1
    }));
    
    // Build features array
    const features = featureItems.map(item => ({
        id: 0,
        packageId: packageId ? parseInt(packageId) : 0,
        item: item
    }));
    
    const packageData = {
        id: packageId ? parseInt(packageId) : 0,
        hotelId: document.getElementById('packageHotelId').value ? parseInt(document.getElementById('packageHotelId').value) : null,
        hotelName: document.getElementById('packageHotelName').value,
        roomType: document.getElementById('packageRoomType').value,
        nights: parseInt(document.getElementById('packageNights').value),
        price: parseFloat(document.getElementById('packagePrice').value),
        city: document.getElementById('packageCity').value || null,
        country: document.getElementById('packageCountry').value || null,
        fixedPriceGuarantee: document.getElementById('packageFixedPriceGuarantee').checked,
        everyDay: document.getElementById('packageEveryDay').checked,
        isActive: document.getElementById('packageIsActive').checked,
        images: images,
        features: features
    };
    
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PACKAGES), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(packageData)
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to save package' }));
            throw new Error(error.error || error.message || 'Failed to save package');
        }
        
        // Close modal and reload
        bootstrap.Modal.getInstance(document.getElementById('packageModal')).hide();
        await loadPackages();
        
        alert(packageId ? 'Package updated successfully!' : 'Package created successfully!');
    } catch (error) {
        console.error('Error saving package:', error);
        alert('Error saving package: ' + error.message);
    }
}

async function deletePackage(id) {
    if (!confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.PACKAGES}/${id}`), {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete package');
        }
        
        await loadPackages();
        alert('Package deleted successfully!');
    } catch (error) {
        console.error('Error deleting package:', error);
        alert('Error deleting package: ' + error.message);
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US').format(value);
}

