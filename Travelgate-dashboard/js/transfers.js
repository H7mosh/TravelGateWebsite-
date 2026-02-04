let allTransfers = [];
let filteredTransfers = [];

document.addEventListener('DOMContentLoaded', function() {
    // Update active nav item
    updateActiveNavItem('transfers.html');
    
    loadTransfers();
    
    // Setup search and filters
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('serviceTypeFilter').addEventListener('change', applyFilters);
    document.getElementById('tripTypeFilter').addEventListener('change', applyFilters);
});

async function loadTransfers() {
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.TRANSFERS));
        if (!response.ok) throw new Error('Failed to load transfers');
        
        allTransfers = await response.json();
        applyFilters();
    } catch (error) {
        console.error('Error loading transfers:', error);
        document.getElementById('transfersTable').innerHTML = 
            '<tr><td colspan="6" class="text-center text-danger">Error loading transfers. Please try again.</td></tr>';
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const serviceTypeFilter = document.getElementById('serviceTypeFilter').value;
    const tripTypeFilter = document.getElementById('tripTypeFilter').value;
    
    filteredTransfers = allTransfers.filter(t => {
        const matchesSearch = !searchTerm || 
            t.route?.toLowerCase().includes(searchTerm);
        
        const matchesServiceType = !serviceTypeFilter || t.serviceType === serviceTypeFilter;
        const matchesTripType = !tripTypeFilter || t.tripType === tripTypeFilter;
        
        return matchesSearch && matchesServiceType && matchesTripType;
    });
    
    renderTransfers();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('serviceTypeFilter').value = '';
    document.getElementById('tripTypeFilter').value = '';
    applyFilters();
}

function renderTransfers() {
    const tableBody = document.getElementById('transfersTable');
    
    if (filteredTransfers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No transfers found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = filteredTransfers.map(transfer => `
        <tr>
            <td>#${transfer.id}</td>
            <td><strong>${transfer.route}</strong></td>
            <td><span class="badge bg-info">${transfer.serviceType || 'N/A'}</span></td>
            <td><span class="badge bg-secondary">${transfer.tripType || 'N/A'}</span></td>
            <td>${formatCurrency(transfer.price || 0)} IQD</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editTransfer(${transfer.id})">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTransfer(${transfer.id})">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddTransferModal() {
    document.getElementById('transferModalTitle').textContent = 'Add Transfer';
    document.getElementById('transferForm').reset();
    document.getElementById('transferId').value = '';
    const modal = new bootstrap.Modal(document.getElementById('transferModal'));
    modal.show();
}

async function editTransfer(id) {
    const transfer = allTransfers.find(t => t.id === id);
    if (!transfer) {
        alert('Transfer not found');
        return;
    }
    
    document.getElementById('transferModalTitle').textContent = 'Edit Transfer';
    document.getElementById('transferId').value = transfer.id;
    document.getElementById('transferRoute').value = transfer.route || '';
    document.getElementById('transferServiceType').value = transfer.serviceType || '';
    document.getElementById('transferTripType').value = transfer.tripType || '';
    document.getElementById('transferPrice').value = transfer.price || '';
    
    const modal = new bootstrap.Modal(document.getElementById('transferModal'));
    modal.show();
}

async function saveTransfer() {
    const form = document.getElementById('transferForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const transferId = document.getElementById('transferId').value;
    const transferData = {
        route: document.getElementById('transferRoute').value,
        serviceType: document.getElementById('transferServiceType').value,
        tripType: document.getElementById('transferTripType').value,
        price: parseFloat(document.getElementById('transferPrice').value)
    };
    
    try {
        // Always use POST - include ID in body for updates
        if (transferId) {
            transferData.id = transferId;
        }
        
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.TRANSFERS), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transferData)
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to save transfer' }));
            throw new Error(error.error || error.message || 'Failed to save transfer');
        }
        
        // Close modal and reload
        bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
        await loadTransfers();
        
        alert(transferId ? 'Transfer updated successfully!' : 'Transfer added successfully!');
    } catch (error) {
        console.error('Error saving transfer:', error);
        alert('Error saving transfer: ' + error.message);
    }
}

async function deleteTransfer(id) {
    if (!confirm('Are you sure you want to delete this transfer? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.TRANSFERS}/${id}`), {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete transfer');
        }
        
        await loadTransfers();
        alert('Transfer deleted successfully!');
    } catch (error) {
        console.error('Error deleting transfer:', error);
        alert('Error deleting transfer: ' + error.message);
    }
}

