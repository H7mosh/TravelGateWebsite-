/**
 * Voucher Lookup & Inquiry
 * Handles reservation lookup by voucher/invoice ID and sending inquiries
 */

let currentVoucherId = null;

document.addEventListener('DOMContentLoaded', function() {
    initVoucherLookup();
});

function initVoucherLookup() {
    const searchBtn = document.getElementById('searchBtn');
    const sendBtn = document.getElementById('sendInquiryBtn');
    
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    
    const voucherInput = document.getElementById('voucherIdInput');
    if (voucherInput) {
        voucherInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleSearch();
        });
    }
    
    if (sendBtn) sendBtn.addEventListener('click', handleSendInquiry);
}

async function handleSearch() {
    const input = document.getElementById('voucherIdInput');
    const errorEl = document.getElementById('searchError');
    const resultSection = document.getElementById('resultSection');
    
    if (!input || !errorEl || !resultSection) return;
    
    const voucherId = (input.value || '').trim();
    
    errorEl.style.display = 'none';
    errorEl.textContent = '';
    resultSection.style.display = 'none';
    
    if (!voucherId) {
        errorEl.textContent = 'Please enter your voucher or invoice ID.';
        errorEl.style.display = 'block';
        return;
    }
    
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Searching...';
    }
    
    try {
        const url = `${API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.RESERVATIONS_BY_VOUCHER)}/${encodeURIComponent(voucherId)}`;
        const response = await fetch(url);
        
        if (response.status === 404) {
            errorEl.textContent = 'No reservation found for this voucher ID.';
            errorEl.style.display = 'block';
            return;
        }
        
        if (!response.ok) {
            errorEl.textContent = 'Something went wrong. Please try again.';
            errorEl.style.display = 'block';
            return;
        }
        
        const data = await response.json();
        currentVoucherId = data.invoiceId ?? data.InvoiceId ?? voucherId;
        
        const contentEl = document.getElementById('reservationDetailsContent');
        if (contentEl) {
            contentEl.innerHTML = formatReservationForVoucher(data);
        }
        
        const alreadySentNote = document.getElementById('alreadySentNote');
        if (alreadySentNote) {
            alreadySentNote.style.display = data.hasInquiry ? 'block' : 'none';
        }
        
        const inquirySuccess = document.getElementById('inquirySuccess');
        if (inquirySuccess) inquirySuccess.style.display = 'none';
        const inquiryError = document.getElementById('inquiryError');
        if (inquiryError) {
            inquiryError.style.display = 'none';
            inquiryError.textContent = '';
        }
        
        resultSection.style.display = 'block';
        document.getElementById('reservationDetailsCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (err) {
        console.error('Lookup error:', err);
        errorEl.textContent = 'Network error. Please check your connection and try again.';
        errorEl.style.display = 'block';
    } finally {
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.innerHTML = '<i class="bi bi-search me-2"></i>Search';
        }
    }
}

function formatReservationForVoucher(res) {
    const invoiceId = res.invoiceId ?? res.InvoiceId ?? 'N/A';
    const firstName = res.firstName ?? res.FirstName ?? '';
    const secondName = res.secondName ?? res.SecondName ?? '';
    const surname = res.surname ?? res.Surname ?? '';
    const fullName = `${firstName} ${secondName} ${surname}`.trim() || 'N/A';
    const email = res.email ?? res.Email ?? 'N/A';
    const phone = res.phoneNumber ?? res.PhoneNumber ?? 'N/A';
    const price = res.price ?? res.Price ?? 0;
    const reserveType = res.reserveType ?? res.ReserveType ?? 'N/A';
    const processingStatus = res.processingStatus ?? res.ProcessingStatus ?? 'N/A';
    const paymentStatus = res.paymentStatus ?? res.PaymentStatus ?? '';
    
    const checkIn = res.checkInDate ?? res.CheckInDate;
    const checkOut = res.checkOutDate ?? res.CheckOutDate;
    const departure = res.departureDate ?? res.DepartureDate;
    const returnDate = res.returnDate ?? res.ReturnDate;
    const travel = res.travelDate ?? res.TravelDate;
    
    let datesHtml = '';
    if (reserveType === 'Hotel' || reserveType === 'Group' || reserveType === 'GroupProgram' || reserveType === 'Package') {
        if (checkIn) datesHtml += `<p class="mb-1"><strong>Check-In:</strong> ${formatDateOnly(checkIn)}</p>`;
        if (checkOut) datesHtml += `<p class="mb-1"><strong>Check-Out:</strong> ${formatDateOnly(checkOut)}</p>`;
    } else if (departure || returnDate || travel) {
        if (departure) datesHtml += `<p class="mb-1"><strong>Departure:</strong> ${formatDateOnly(departure)}</p>`;
        if (returnDate) datesHtml += `<p class="mb-1"><strong>Return:</strong> ${formatDateOnly(returnDate)}</p>`;
        if (travel) datesHtml += `<p class="mb-1"><strong>Travel Date:</strong> ${formatDateOnly(travel)}</p>`;
    }
    if (!datesHtml) datesHtml = '<p class="mb-1 text-muted">-</p>';
    
    const statusDisplay = paymentStatus ? `${processingStatus} / ${paymentStatus}` : processingStatus;
    
    return `
        <div class="col-md-6">
            <p class="mb-2"><strong>Invoice ID:</strong> <code>${escapeHtml(invoiceId)}</code></p>
            <p class="mb-2"><strong>Type:</strong> <span class="badge bg-info">${escapeHtml(reserveType)}</span></p>
            <p class="mb-2"><strong>Customer:</strong> ${escapeHtml(fullName)}</p>
            <p class="mb-2"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
            <p class="mb-2"><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        </div>
        <div class="col-md-6">
            <p class="mb-2"><strong>Amount:</strong> ${formatCurrency(price)} IQD</p>
            <div class="mb-2"><strong>Dates:</strong>${datesHtml}</div>
            <p class="mb-0"><strong>Status:</strong> ${escapeHtml(statusDisplay)}</p>
        </div>
    `;
}

function formatDateOnly(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00Z');
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return dateStr;
    }
}

function formatCurrency(value) {
    const n = parseFloat(value);
    if (isNaN(n)) return '0';
    return n.toLocaleString();
}

function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function handleSendInquiry() {
    if (!currentVoucherId) return;
    
    const subjectEl = document.getElementById('inquirySubject');
    const messageEl = document.getElementById('inquiryMessage');
    const errorEl = document.getElementById('inquiryError');
    const successEl = document.getElementById('inquirySuccess');
    
    if (!subjectEl || !messageEl || !errorEl || !successEl) return;
    
    const title = (subjectEl.value || '').trim();
    const body = (messageEl.value || '').trim();
    
    errorEl.style.display = 'none';
    errorEl.textContent = '';
    successEl.style.display = 'none';
    
    if (!title || !body) {
        errorEl.textContent = 'Please enter both subject and message.';
        errorEl.style.display = 'block';
        return;
    }
    
    const sendBtn = document.getElementById('sendInquiryBtn');
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';
    }
    
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.VOUCHER_INQUIRY_SEND), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                voucherId: currentVoucherId,
                title: title,
                body: body
            })
        });
        
        const data = await response.json().catch(() => ({}));
        
        if (response.ok && data.success) {
            successEl.style.display = 'block';
            subjectEl.value = '';
            messageEl.value = '';
            const alreadySentNote = document.getElementById('alreadySentNote');
            if (alreadySentNote) alreadySentNote.style.display = 'block';
        } else {
            errorEl.textContent = data.message || 'Failed to send. Please try again.';
            errorEl.style.display = 'block';
        }
    } catch (err) {
        console.error('Send inquiry error:', err);
        errorEl.textContent = 'Network error. Please try again.';
        errorEl.style.display = 'block';
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="bi bi-send me-2"></i>Send Inquiry';
        }
    }
}
