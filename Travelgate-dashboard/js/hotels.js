let allHotels = [];
let filteredHotels = [];

document.addEventListener('DOMContentLoaded', function() {
    // Update active nav item
    updateActiveNavItem('hotels.html');
    
    loadHotels();
    
    // Setup search and filters
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('cityFilter').addEventListener('change', applyFilters);
    document.getElementById('countryFilter').addEventListener('change', applyFilters);
});

async function loadHotels() {
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.HOTELS));
        if (!response.ok) throw new Error('Failed to load hotels');
        
        allHotels = await response.json();
        
        // Populate filter dropdowns
        populateFilters();
        applyFilters();
    } catch (error) {
        console.error('Error loading hotels:', error);
        document.getElementById('hotelsContainer').innerHTML = 
            '<div class="col-12 text-center text-danger">Error loading hotels. Please try again.</div>';
    }
}

function populateFilters() {
    const cities = [...new Set(allHotels.map(h => h.city).filter(Boolean))].sort();
    const countries = [...new Set(allHotels.map(h => h.country).filter(Boolean))].sort();
    
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
    
    filteredHotels = allHotels.filter(h => {
        const matchesSearch = !searchTerm || 
            h.name?.toLowerCase().includes(searchTerm) ||
            h.city?.toLowerCase().includes(searchTerm) ||
            h.country?.toLowerCase().includes(searchTerm);
        
        const matchesCity = !cityFilter || h.city === cityFilter;
        const matchesCountry = !countryFilter || h.country === countryFilter;
        
        return matchesSearch && matchesCity && matchesCountry;
    });
    
    renderHotels();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('cityFilter').value = '';
    document.getElementById('countryFilter').value = '';
    applyFilters();
}

function renderHotels() {
    const container = document.getElementById('hotelsContainer');
    
    if (filteredHotels.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted">No hotels found</div>';
        return;
    }
    
    container.innerHTML = filteredHotels.map(hotel => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100">
                ${hotel.image ? `<img src="${hotel.image}" class="card-img-top" alt="${hotel.name}" style="height: 200px; object-fit: cover;">` : ''}
                <div class="card-body">
                    <h5 class="card-title">${hotel.name}</h5>
                    <p class="card-text text-muted small">
                        <i class="bi bi-geo-alt"></i> ${hotel.city}, ${hotel.country}<br>
                        <i class="bi bi-star-fill text-warning"></i> ${hotel.stars} Stars
                    </p>
                    <div class="mb-3">
                        <small class="text-muted">Prices:</small><br>
                        <small>Single: ${formatCurrency(hotel.prices?.single || hotel.singlePrice || 0)} IQD</small><br>
                        <small>Double: ${formatCurrency(hotel.prices?.double || hotel.doublePrice || 0)} IQD</small><br>
                        <small>Family: ${formatCurrency(hotel.prices?.family || hotel.familyPrice || 0)} IQD</small>
                    </div>
                </div>
                <div class="card-footer bg-white">
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary" onclick="editHotel(${hotel.id})">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteHotel(${hotel.id})">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddHotelModal() {
    document.getElementById('hotelModalTitle').textContent = 'Add Hotel';
    document.getElementById('hotelForm').reset();
    document.getElementById('hotelId').value = '';
    const modal = new bootstrap.Modal(document.getElementById('hotelModal'));
    modal.show();
}

async function editHotel(id) {
    const hotel = allHotels.find(h => h.id === id);
    if (!hotel) {
        alert('Hotel not found');
        return;
    }
    
    document.getElementById('hotelModalTitle').textContent = 'Edit Hotel';
    document.getElementById('hotelId').value = hotel.id;
    document.getElementById('hotelName').value = hotel.name || '';
    document.getElementById('hotelCity').value = hotel.city || '';
    document.getElementById('hotelCountry').value = hotel.country || '';
    document.getElementById('hotelStars').value = hotel.stars || '';
    document.getElementById('hotelImage').value = hotel.image || '';
    document.getElementById('hotelSinglePrice').value = hotel.prices?.single || hotel.singlePrice || '';
    document.getElementById('hotelDoublePrice').value = hotel.prices?.double || hotel.doublePrice || '';
    document.getElementById('hotelFamilyPrice').value = hotel.prices?.family || hotel.familyPrice || '';
    
    const modal = new bootstrap.Modal(document.getElementById('hotelModal'));
    modal.show();
}

async function saveHotel() {
    const form = document.getElementById('hotelForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const hotelId = document.getElementById('hotelId').value;
    const hotelData = {
        name: document.getElementById('hotelName').value,
        city: document.getElementById('hotelCity').value,
        country: document.getElementById('hotelCountry').value,
        stars: parseFloat(document.getElementById('hotelStars').value),
        image: document.getElementById('hotelImage').value,
        singlePrice: parseFloat(document.getElementById('hotelSinglePrice').value),
        doublePrice: parseFloat(document.getElementById('hotelDoublePrice').value),
        familyPrice: parseFloat(document.getElementById('hotelFamilyPrice').value)
    };
    
    try {
        // Always use POST - include ID in body for updates
        if (hotelId) {
            hotelData.id = hotelId;
        }
        
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.HOTELS), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(hotelData)
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to save hotel' }));
            throw new Error(error.error || error.message || 'Failed to save hotel');
        }
        
        // Close modal and reload
        bootstrap.Modal.getInstance(document.getElementById('hotelModal')).hide();
        await loadHotels();
        
        alert(hotelId ? 'Hotel updated successfully!' : 'Hotel added successfully!');
    } catch (error) {
        console.error('Error saving hotel:', error);
        alert('Error saving hotel: ' + error.message);
    }
}

async function deleteHotel(id) {
    if (!confirm('Are you sure you want to delete this hotel? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.HOTELS}/${id}`), {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete hotel');
        }
        
        await loadHotels();
        alert('Hotel deleted successfully!');
    } catch (error) {
        console.error('Error deleting hotel:', error);
        alert('Error deleting hotel: ' + error.message);
    }
}

