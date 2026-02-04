let allReservations = [];
let filteredReservations = [];
let currentPage = 1;
const itemsPerPage = 20;
let voucherInquiriesList = [];

document.addEventListener('DOMContentLoaded', function() {
    // Update active nav item
    if (typeof updateActiveNavItem === 'function') {
        updateActiveNavItem('reservations.html');
    }
    
    loadVoucherInquiries();
    loadReservations();
    
    // Setup search and filters with null checks
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const paymentStatusFilter = document.getElementById('paymentStatusFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (paymentStatusFilter) paymentStatusFilter.addEventListener('change', applyFilters);
    if (dateFilter) dateFilter.addEventListener('change', applyFilters);
});

async function loadVoucherInquiries() {
    const loadingEl = document.getElementById('inquiriesLoading');
    const emptyState = document.getElementById('inquiriesEmptyState');
    const tableWrapper = document.getElementById('inquiriesTableWrapper');
    const tbody = document.getElementById('voucherInquiriesBody');
    
    if (!tbody) return;
    
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.VOUCHER_INQUIRY));
        const data = await response.json().catch(() => []);
        voucherInquiriesList = Array.isArray(data) ? data : [];
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (emptyState) emptyState.style.display = voucherInquiriesList.length === 0 ? 'block' : 'none';
        if (tableWrapper) tableWrapper.style.display = voucherInquiriesList.length > 0 ? 'block' : 'none';
        
        renderVoucherInquiriesTable();
    } catch (err) {
        console.error('Error loading voucher inquiries:', err);
        voucherInquiriesList = [];
        if (loadingEl) loadingEl.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        if (tableWrapper) tableWrapper.style.display = 'none';
    }
}

function renderVoucherInquiriesTable() {
    const tbody = document.getElementById('voucherInquiriesBody');
    if (!tbody) return;
    
    tbody.innerHTML = voucherInquiriesList.map((item, index) => {
        const voucherId = item.voucherId ?? item.VoucherId ?? 'N/A';
        const customerName = item.customerName ?? item.CustomerName ?? '-';
        const reserveType = item.reserveType ?? item.ReserveType ?? '-';
        const title = item.title ?? item.Title ?? '-';
        const body = item.body ?? item.Body ?? '';
        const bodyPreview = body.length > 80 ? body.substring(0, 80) + '...' : body || '-';
        const sentAt = item.sentAt ?? item.SentAt ?? '';
        const sentAtFormatted = sentAt ? formatDate(sentAt) : '-';
        
        return `<tr data-index="${index}" style="cursor: pointer;" role="button">
            <td><code>${escapeHtml(voucherId)}</code></td>
            <td>${escapeHtml(customerName)}</td>
            <td><span class="badge bg-info">${escapeHtml(reserveType)}</span></td>
            <td>${escapeHtml(title)}</td>
            <td class="text-muted small">${escapeHtml(bodyPreview)}</td>
            <td>${sentAtFormatted}</td>
        </tr>`;
    }).join('');
    
    tbody.querySelectorAll('tr[data-index]').forEach(row => {
        row.addEventListener('click', function() {
            const idx = parseInt(this.getAttribute('data-index'), 10);
            if (!isNaN(idx)) showInquiryDetail(idx);
        });
    });
}

function showInquiryDetail(index) {
    const item = voucherInquiriesList[index];
    if (!item) return;
    
    const voucherId = item.voucherId ?? item.VoucherId ?? 'N/A';
    const customerName = item.customerName ?? item.CustomerName ?? '-';
    const reserveType = item.reserveType ?? item.ReserveType ?? '-';
    const title = item.title ?? item.Title ?? '-';
    const body = item.body ?? item.Body ?? '-';
    const sentAt = item.sentAt ?? item.SentAt ?? '';
    const sentAtFormatted = sentAt ? formatDate(sentAt) : '-';
    
    const content = document.getElementById('inquiryDetailContent');
    if (content) {
        content.innerHTML = `
            <table class="table table-sm">
                <tr><td><strong>Voucher ID:</strong></td><td><code>${escapeHtml(voucherId)}</code></td></tr>
                <tr><td><strong>Customer:</strong></td><td>${escapeHtml(customerName)}</td></tr>
                <tr><td><strong>Type:</strong></td><td><span class="badge bg-info">${escapeHtml(reserveType)}</span></td></tr>
                <tr><td><strong>Subject:</strong></td><td>${escapeHtml(title)}</td></tr>
                <tr><td><strong>Sent at:</strong></td><td>${sentAtFormatted}</td></tr>
                <tr><td><strong>Message:</strong></td><td><div class="mt-2" style="white-space: pre-wrap;">${escapeHtml(body)}</div></td></tr>
            </table>
        `;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('inquiryDetailModal'));
    modal.show();
}

function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

async function loadReservations() {
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.RESERVATIONS));
        if (!response.ok) throw new Error('Failed to load reservations');
        
        const allReservationsData = await response.json();
        
        // Debug: Log total reservations and sample reservation structure
        console.log('Reservations page - Total reservations from API:', allReservationsData.length);
        if (allReservationsData.length > 0) {
            console.log('Reservations page - Sample reservation:', allReservationsData[0]);
            console.log('Reservations page - Sample reservation dates:', {
                checkInDate: allReservationsData[0].checkInDate || allReservationsData[0].CheckInDate,
                checkOutDate: allReservationsData[0].checkOutDate || allReservationsData[0].CheckOutDate,
                departureDate: allReservationsData[0].departureDate || allReservationsData[0].DepartureDate,
                returnDate: allReservationsData[0].returnDate || allReservationsData[0].ReturnDate,
                travelDate: allReservationsData[0].travelDate || allReservationsData[0].TravelDate,
                allKeys: Object.keys(allReservationsData[0])
            });
            console.log('Reservations page - PaymentStatus values:', allReservationsData.map(r => ({
                id: r.id || r.Id,
                paymentStatus: r.paymentStatus || r.PaymentStatus || 'NULL'
            })));
        }
        
        // Filter to only show reservations with completed payment (handle both camelCase and PascalCase)
        allReservations = allReservationsData.filter(r => {
            const paymentStatus = r.paymentStatus || r.PaymentStatus;
            const isPaid = paymentStatus === 'Paid';
            return isPaid;
        });
        
        console.log('Reservations page - Filtered paid reservations:', allReservations.length);
        
        // Sort by date (newest first)
        allReservations.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.CreatedAt);
            const dateB = new Date(b.createdAt || b.CreatedAt);
            return dateB - dateA;
        });
        
        applyFilters();
    } catch (error) {
        console.error('Error loading reservations:', error);
        document.getElementById('reservationsTable').innerHTML = 
            '<tr><td colspan="10" class="text-center text-danger">Error loading reservations. Please try again.</td></tr>';
    }
}

function applyFilters() {
    const searchInputEl = document.getElementById('searchInput');
    const typeFilterEl = document.getElementById('typeFilter');
    const statusFilterEl = document.getElementById('statusFilter');
    const paymentStatusFilterEl = document.getElementById('paymentStatusFilter');
    const dateFilterEl = document.getElementById('dateFilter');
    
    if (!searchInputEl || !typeFilterEl || !statusFilterEl || !dateFilterEl) {
        console.warn('Filter elements not found, skipping filter application');
        return;
    }
    
    const searchTerm = searchInputEl.value.toLowerCase();
    const typeFilter = typeFilterEl.value;
    const statusFilter = statusFilterEl.value;
    const paymentStatusFilter = paymentStatusFilterEl ? paymentStatusFilterEl.value : '';
    const dateFilter = dateFilterEl.value;
    
    filteredReservations = allReservations.filter(r => {
        const matchesSearch = !searchTerm || 
            r.firstName?.toLowerCase().includes(searchTerm) ||
            r.secondName?.toLowerCase().includes(searchTerm) ||
            r.surname?.toLowerCase().includes(searchTerm) ||
            r.email?.toLowerCase().includes(searchTerm) ||
            r.phoneNumber?.includes(searchTerm);
        
        const matchesType = !typeFilter || r.reserveType === typeFilter;
        const matchesStatus = !statusFilter || (r.processingStatus || 'Waiting') === statusFilter;
        const matchesPaymentStatus = !paymentStatusFilter || (r.paymentStatus || '') === paymentStatusFilter;
        
        let matchesDate = true;
        if (dateFilter) {
            const resDate = new Date(r.createdAt).toISOString().split('T')[0];
            matchesDate = resDate === dateFilter;
        }
        
        return matchesSearch && matchesType && matchesStatus && matchesPaymentStatus && matchesDate;
    });
    
    currentPage = 1;
    renderReservations();
}

function clearFilters() {
    const searchInputEl = document.getElementById('searchInput');
    const typeFilterEl = document.getElementById('typeFilter');
    const statusFilterEl = document.getElementById('statusFilter');
    const paymentStatusFilterEl = document.getElementById('paymentStatusFilter');
    const dateFilterEl = document.getElementById('dateFilter');
    
    if (searchInputEl) searchInputEl.value = '';
    if (typeFilterEl) typeFilterEl.value = '';
    if (statusFilterEl) statusFilterEl.value = '';
    if (paymentStatusFilterEl) paymentStatusFilterEl.value = '';
    if (dateFilterEl) dateFilterEl.value = '';
    
    applyFilters();
}

function renderReservations() {
    const tableBody = document.getElementById('reservationsTable');
    
    if (filteredReservations.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">No reservations found</td></tr>';
        document.getElementById('paginationContainer').innerHTML = '';
        return;
    }
    
    // Pagination
    const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageReservations = filteredReservations.slice(startIndex, endIndex);
    
    tableBody.innerHTML = pageReservations.map(r => {
        const status = r.processingStatus || 'Pending';
        const statusBadge = getStatusBadge(status);
        
        // Debug: Log first reservation to see date fields
        if (pageReservations.indexOf(r) === 0) {
            console.log('First reservation in page:', {
                id: r.id,
                type: r.reserveType,
                checkInDate: r.checkInDate,
                CheckInDate: r.CheckInDate,
                checkOutDate: r.checkOutDate,
                CheckOutDate: r.CheckOutDate,
                allDateKeys: Object.keys(r).filter(k => k.toLowerCase().includes('date')),
                fullReservation: r
            });
        }
        
        const datesDisplay = formatReservationDates(r);
        return `
        <tr>
            <td>#${r.id}</td>
            <td>${r.firstName} ${r.secondName || ''} ${r.surname}</td>
            <td>${r.email || 'N/A'}</td>
            <td>${r.phoneNumber || 'N/A'}</td>
            <td><span class="badge bg-info">${r.reserveType}</span></td>
            <td>${formatCurrency(r.price)} IQD</td>
            <td>${datesDisplay}</td>
            <td>
                ${statusBadge}
                ${r.paymentStatus ? `<br><small>${getPaymentStatusBadge(r.paymentStatus)}</small>` : ''}
            </td>
            <td>${formatDate(r.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewReservationDetails(${r.id})" title="View Details">
                    <i class="bi bi-eye"></i> View
                </button>
                ${r.invoiceId ? `
                    <button class="btn btn-sm btn-outline-success" onclick="downloadInvoice('${r.invoiceId}')" title="Download Invoice PDF">
                        <i class="bi bi-download"></i> Invoice
                    </button>
                ` : ''}
                ${r.gatewayPaymentId ? `
                    <button class="btn btn-sm btn-outline-info" onclick="viewPaymentEvents('${r.gatewayPaymentId}')" title="View Payment Events">
                        <i class="bi bi-clock-history"></i> Events
                    </button>
                ` : ''}
            </td>
        </tr>
    `;
    }).join('');
    
    // Render pagination
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const container = document.getElementById('paginationContainer');
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<nav><ul class="pagination justify-content-center">';
    
    // Previous button
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Previous</a>
    </li>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Next button
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Next</a>
    </li>`;
    
    html += '</ul></nav>';
    container.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderReservations();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function getStatusBadge(status) {
    const statusMap = {
        'Waiting': { class: 'bg-warning text-dark', icon: 'bi-clock-history', label: 'Waiting for Webhook' },
        'Completed': { class: 'bg-success', icon: 'bi-check-circle-fill', label: 'Completed' },
        'email-fail': { class: 'bg-danger', icon: 'bi-envelope-x', label: 'Email Failed' },
        // Legacy statuses for backward compatibility
        'Saved': { class: 'bg-success', icon: 'bi-check-circle-fill', label: 'Completed' },
        'Pending': { class: 'bg-warning text-dark', icon: 'bi-clock', label: 'Waiting' },
        'Failed': { class: 'bg-danger', icon: 'bi-x-circle', label: 'Failed' }
    };
    
    const statusInfo = statusMap[status] || statusMap['Waiting'];
    return `<span class="badge ${statusInfo.class}" title="${status}">
        <i class="bi ${statusInfo.icon}"></i> ${statusInfo.label}
    </span>`;
}

function getPaymentStatusBadge(status) {
    if (!status) return '<span class="text-muted">-</span>';
    
    const statusMap = {
        'Paid': { class: 'bg-success', icon: 'bi-check-circle-fill', label: 'Paid' },
        'Pending': { class: 'bg-warning text-dark', icon: 'bi-clock-history', label: 'Pending' },
        'Failed': { class: 'bg-danger', icon: 'bi-x-circle', label: 'Failed' },
        'Canceled': { class: 'bg-secondary', icon: 'bi-x-octagon', label: 'Canceled' },
        'Refunded': { class: 'bg-info', icon: 'bi-arrow-counterclockwise', label: 'Refunded' },
        'Unknown': { class: 'bg-dark', icon: 'bi-question-circle', label: 'Unknown' }
    };
    
    const statusInfo = statusMap[status] || { class: 'bg-secondary', icon: 'bi-question', label: status };
    return `<span class="badge ${statusInfo.class}" title="${status}">
        <i class="bi ${statusInfo.icon}"></i> ${statusInfo.label}
    </span>`;
}

function formatReservationDates(reservation) {
    if (!reservation) return '<span class="text-muted small">-</span>';
    
    // Handle both camelCase and PascalCase - check all possible variations
    const checkInDate = reservation.checkInDate || reservation.CheckInDate || reservation.check_in_date;
    const checkOutDate = reservation.checkOutDate || reservation.CheckOutDate || reservation.check_out_date;
    const departureDate = reservation.departureDate || reservation.DepartureDate || reservation.departure_date;
    const returnDate = reservation.returnDate || reservation.ReturnDate || reservation.return_date;
    const travelDate = reservation.travelDate || reservation.TravelDate || reservation.travel_date;
    
    const reserveType = reservation.reserveType || reservation.ReserveType || reservation.reserve_type || '';
    
    if (reserveType === 'Hotel' || reserveType === 'Group' || reserveType === 'Package') {
        if (checkInDate && checkOutDate) {
            // Calculate nights
            const nights = calculateNights(checkInDate, checkOutDate);
            return `
                <div class="small">
                    <div><i class="bi bi-calendar-check text-primary"></i> ${formatDateOnly(checkInDate)}</div>
                    <div><i class="bi bi-calendar-x text-danger"></i> ${formatDateOnly(checkOutDate)}</div>
                    ${nights > 0 ? `<div class="text-muted"><i class="bi bi-moon-stars"></i> ${nights} ${nights === 1 ? 'night' : 'nights'}</div>` : ''}
                </div>
            `;
        } else if (checkInDate) {
            return `<div class="small"><i class="bi bi-calendar-check text-primary"></i> ${formatDateOnly(checkInDate)}</div>`;
        }
    } else if (reserveType === 'Transfer' || reserveType === 'FlightPackage') {
        if (departureDate && returnDate) {
            return `
                <div class="small">
                    <div><i class="bi bi-airplane-takeoff text-primary"></i> ${formatDateOnly(departureDate)}</div>
                    <div><i class="bi bi-airplane-landing text-success"></i> ${formatDateOnly(returnDate)}</div>
                </div>
            `;
        } else if (departureDate) {
            return `<div class="small"><i class="bi bi-airplane-takeoff text-primary"></i> ${formatDateOnly(departureDate)}</div>`;
        }
    } else if (travelDate) {
        return `<div class="small"><i class="bi bi-calendar-event text-info"></i> ${formatDateOnly(travelDate)}</div>`;
    }
    
    // Always return something so the column is visible
    return '<span class="text-muted small">-</span>';
}

function calculateNights(checkIn, checkOut) {
    if (!checkIn || !checkOut) return 0;
    try {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        return nights > 0 ? nights : 0;
    } catch (e) {
        console.error('Error calculating nights:', e);
        return 0;
    }
}

function formatDateOnly(dateString) {
    if (!dateString) return 'N/A';
    try {
        // Handle both ISO format (yyyy-MM-dd) and other formats
        let date;
        if (dateString.includes('T')) {
            date = new Date(dateString);
        } else {
            // If it's just a date string (yyyy-MM-dd), add time to avoid timezone issues
            date = new Date(dateString + 'T00:00:00Z');
        }
        
        if (isNaN(date.getTime())) {
            return dateString; // Return original if parsing fails
        }
        
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        console.error('Error formatting date:', dateString, e);
        return dateString;
    }
}

function formatReservationDatesForDetails(reservation) {
    // Handle both camelCase and PascalCase
    const checkInDate = reservation.checkInDate || reservation.CheckInDate;
    const checkOutDate = reservation.checkOutDate || reservation.CheckOutDate;
    const departureDate = reservation.departureDate || reservation.DepartureDate;
    const returnDate = reservation.returnDate || reservation.ReturnDate;
    const travelDate = reservation.travelDate || reservation.TravelDate;
    
    const reserveType = reservation.reserveType || reservation.ReserveType || '';
    let datesHtml = '';
    
    if (reserveType === 'Hotel' || reserveType === 'Group' || reserveType === 'Package') {
        if (checkInDate) {
            datesHtml += `<tr><td><strong>Check-In Date:</strong></td><td><i class="bi bi-calendar-check text-primary"></i> ${formatDateOnly(checkInDate)}</td></tr>`;
        }
        if (checkOutDate) {
            datesHtml += `<tr><td><strong>Check-Out Date:</strong></td><td><i class="bi bi-calendar-x text-danger"></i> ${formatDateOnly(checkOutDate)}</td></tr>`;
        }
    } else if (reserveType === 'Transfer' || reserveType === 'FlightPackage') {
        if (departureDate) {
            datesHtml += `<tr><td><strong>Departure Date:</strong></td><td><i class="bi bi-airplane-takeoff text-primary"></i> ${formatDateOnly(departureDate)}</td></tr>`;
        }
        if (returnDate) {
            datesHtml += `<tr><td><strong>Return Date:</strong></td><td><i class="bi bi-airplane-landing text-success"></i> ${formatDateOnly(returnDate)}</td></tr>`;
        }
    } else if (travelDate) {
        datesHtml += `<tr><td><strong>Travel Date:</strong></td><td><i class="bi bi-calendar-event text-info"></i> ${formatDateOnly(travelDate)}</td></tr>`;
    }
    
    return datesHtml;
}

async function viewReservationDetails(id) {
    const reservation = allReservations.find(r => r.id === id);
    if (!reservation) {
        alert('Reservation not found');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('reservationDetailsModal'));
    const content = document.getElementById('reservationDetailsContent');
    
    // Get entity details if EntityId exists
    let entityDetails = '';
    if (reservation.entityId) {
        try {
            let entity = null;
            if (reservation.reserveType === 'Hotel') {
                const res = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.HOTELS}/${reservation.entityId}`));
                if (res.ok) entity = await res.json();
            } else if (reservation.reserveType === 'Group') {
                const res = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.GROUPS}/${reservation.entityId}`));
                if (res.ok) entity = await res.json();
            } else if (reservation.reserveType === 'Transfer') {
                const res = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.TRANSFERS}/${reservation.entityId}`));
                if (res.ok) entity = await res.json();
            }
            
            if (entity) {
                entityDetails = `
                    <div class="mb-3">
                        <h6>${reservation.reserveType} Details</h6>
                        <p class="mb-1"><strong>Name:</strong> ${entity.name || entity.route || 'N/A'}</p>
                        ${entity.city ? `<p class="mb-1"><strong>Location:</strong> ${entity.city}, ${entity.country || ''}</p>` : ''}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading entity details:', error);
        }
    }
    
    // Load payment events if invoiceId exists
    let paymentEventsHtml = '';
    if (reservation.invoiceId) {
        try {
            const eventsRes = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.PAYMENT_EVENTS_BY_INVOICE_ID}/${reservation.invoiceId}/events`));
            if (eventsRes.ok) {
                const eventsData = await eventsRes.json();
                if (eventsData.success && eventsData.events && eventsData.events.length > 0) {
                    paymentEventsHtml = `
                        <div class="mt-4">
                            <h6>Payment Events History <span class="badge bg-secondary">${eventsData.eventCount}</span></h6>
                            <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                                <table class="table table-sm table-bordered">
                                    <thead class="table-light sticky-top">
                                        <tr>
                                            <th>Event Type</th>
                                            <th>Status</th>
                                            <th>Normalized</th>
                                            <th>Amount</th>
                                            <th>Received At</th>
                                            <th>Signature</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${eventsData.events.map(e => `
                                            <tr>
                                                <td><span class="badge bg-info">${e.eventType}</span></td>
                                                <td><code class="small">${e.status || 'N/A'}</code></td>
                                                <td>${getPaymentStatusBadge(e.normalizedStatus)}</td>
                                                <td>${e.amount ? formatCurrency(e.amount) + ' ' + (e.currency || 'IQD') : 'N/A'}</td>
                                                <td><small>${formatDate(e.receivedAt)}</small></td>
                                                <td>${e.signatureValid === null ? '<span class="text-muted">N/A</span>' : 
                                                    e.signatureValid ? '<span class="text-success"><i class="bi bi-check-circle"></i> Valid</span>' : 
                                                    '<span class="text-danger"><i class="bi bi-x-circle"></i> Invalid</span>'}</td>
                                                <td><small class="text-muted">${e.notes || '-'}</small></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                } else {
                    paymentEventsHtml = '<div class="mt-3"><p class="text-muted small">No payment events found for this reservation.</p></div>';
                }
            }
        } catch (error) {
            console.error('Error loading payment events:', error);
            paymentEventsHtml = '<div class="mt-3"><p class="text-danger small">Error loading payment events.</p></div>';
        }
    }
    
    content.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Customer Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Full Name:</strong></td><td>${reservation.firstName} ${reservation.secondName || ''} ${reservation.surname}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>${reservation.email || 'N/A'}</td></tr>
                    <tr><td><strong>Phone:</strong></td><td>${reservation.phoneNumber || 'N/A'}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Reservation Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Reservation ID:</strong></td><td>#${reservation.id}</td></tr>
                    <tr><td><strong>Type:</strong></td><td><span class="badge bg-info">${reservation.reserveType}</span></td></tr>
                    <tr><td><strong>Amount:</strong></td><td>${formatCurrency(reservation.price)} IQD</td></tr>
                    ${formatReservationDatesForDetails(reservation)}
                    <tr><td><strong>Processing Status:</strong></td><td>${getStatusBadge(reservation.processingStatus || 'Waiting')}</td></tr>
                    ${reservation.paymentStatus ? `<tr><td><strong>Payment Status:</strong></td><td>${getPaymentStatusBadge(reservation.paymentStatus)}</td></tr>` : ''}
                    ${reservation.gatewayPaymentId ? `<tr><td><strong>Gateway Payment ID:</strong></td><td><code class="small">${reservation.gatewayPaymentId}</code></td></tr>` : ''}
                    ${reservation.gatewayStatusRaw ? `<tr><td><strong>Gateway Status:</strong></td><td><code class="small">${reservation.gatewayStatusRaw}</code></td></tr>` : ''}
                    ${reservation.paymentUpdatedAt ? `<tr><td><strong>Payment Updated:</strong></td><td>${formatDate(reservation.paymentUpdatedAt)}</td></tr>` : ''}
                    ${reservation.processingError ? `<tr><td><strong>Error:</strong></td><td><span class="text-danger small">${reservation.processingError}</span></td></tr>` : ''}
                    <tr><td><strong>Created:</strong></td><td>${formatDate(reservation.createdAt)}</td></tr>
                    ${reservation.updatedAt ? `<tr><td><strong>Updated:</strong></td><td>${formatDate(reservation.updatedAt)}</td></tr>` : ''}
                    ${reservation.entityId ? `<tr><td><strong>Entity ID:</strong></td><td>${reservation.entityId}</td></tr>` : ''}
                    ${reservation.invoiceId ? `<tr><td><strong>Invoice ID:</strong></td><td>${reservation.invoiceId}</td></tr>` : ''}
                </table>
            </div>
        </div>
        ${entityDetails}
        ${paymentEventsHtml}
    `;
    
    modal.show();
}

function downloadInvoice(invoiceId) {
    if (!invoiceId) {
        alert('Invoice ID not found for this reservation');
        return;
    }
    
    try {
        // Build PDF URL and open in new tab/window
        const pdfUrl = `${API_CONFIG.BASE_URL}/payment/invoice/${encodeURIComponent(invoiceId)}/pdf`;
        window.open(pdfUrl, '_blank');
    } catch (error) {
        console.error('Error downloading invoice:', error);
        alert('Failed to download invoice. Please try again later.');
    }
}

async function viewPaymentEvents(paymentId) {
    if (!paymentId) {
        alert('Payment ID not found');
        return;
    }
    
    try {
        const response = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.PAYMENT_EVENTS_BY_PAYMENT_ID}/${paymentId}`));
        if (!response.ok) throw new Error('Failed to load payment events');
        
        const data = await response.json();
        if (!data.success) {
            alert('Failed to load payment events: ' + (data.message || 'Unknown error'));
            return;
        }
        
        // Create modal content
        const modalHtml = `
            <div class="modal fade" id="paymentEventsModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Payment Events History <span class="badge bg-secondary">${data.eventCount || 0}</span></h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="text-muted"><strong>Payment ID:</strong> <code>${paymentId}</code></p>
                            ${data.events && data.events.length > 0 ? `
                                <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
                                    <table class="table table-sm table-bordered table-hover">
                                        <thead class="table-light sticky-top">
                                            <tr>
                                                <th>#</th>
                                                <th>Event Type</th>
                                                <th>Raw Status</th>
                                                <th>Normalized Status</th>
                                                <th>Amount</th>
                                                <th>Currency</th>
                                                <th>Received At</th>
                                                <th>Signature Valid</th>
                                                <th>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${data.events.map((e, idx) => `
                                                <tr>
                                                    <td>${idx + 1}</td>
                                                    <td><span class="badge bg-info">${e.eventType}</span></td>
                                                    <td><code class="small">${e.status || 'N/A'}</code></td>
                                                    <td>${getPaymentStatusBadge(e.normalizedStatus)}</td>
                                                    <td>${e.amount ? formatCurrency(e.amount) : 'N/A'}</td>
                                                    <td>${e.currency || 'N/A'}</td>
                                                    <td><small>${formatDate(e.receivedAt)}</small></td>
                                                    <td>${e.signatureValid === null ? '<span class="text-muted">N/A</span>' : 
                                                        e.signatureValid ? '<span class="text-success"><i class="bi bi-check-circle"></i> Valid</span>' : 
                                                        '<span class="text-danger"><i class="bi bi-x-circle"></i> Invalid</span>'}</td>
                                                    <td><small class="text-muted">${e.notes || '-'}</small></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : '<p class="text-muted">No payment events found.</p>'}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('paymentEventsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('paymentEventsModal'));
        modal.show();
        
        // Clean up modal when hidden
        document.getElementById('paymentEventsModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    } catch (error) {
        console.error('Error loading payment events:', error);
        alert('Failed to load payment events. Please try again later.');
    }
}

function exportReservations() {
    if (filteredReservations.length === 0) {
        alert('No reservations to export');
        return;
    }
    
    // Create CSV content
    const headers = ['ID', 'First Name', 'Second Name', 'Surname', 'Email', 'Phone', 'Type', 'Amount (IQD)', 'Check-In Date', 'Check-Out Date', 'Departure Date', 'Return Date', 'Travel Date', 'Status', 'Error', 'Date'];
    const rows = filteredReservations.map(r => [
        r.id,
        r.firstName || '',
        r.secondName || '',
        r.surname || '',
        r.email || '',
        r.phoneNumber || '',
        r.reserveType || '',
        r.price || 0,
        r.checkInDate || r.CheckInDate || '',
        r.checkOutDate || r.CheckOutDate || '',
        r.departureDate || r.DepartureDate || '',
        r.returnDate || r.ReturnDate || '',
        r.travelDate || r.TravelDate || '',
        r.processingStatus || 'Pending',
        r.processingError || '',
        new Date(r.createdAt).toLocaleString()
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reservations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

