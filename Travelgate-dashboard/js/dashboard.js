// Shared function to update active nav item - available globally
function updateActiveNavItem(currentPage) {
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        const href = item.getAttribute('href');
        if (href && (href === currentPage || href.endsWith(currentPage))) {
            item.classList.add('active');
        }
    });
}

// Make it available globally
window.updateActiveNavItem = updateActiveNavItem;

// Load dashboard data on page load (only on dashboard/index page)
document.addEventListener('DOMContentLoaded', function() {
    // Only run dashboard-specific code if we're on the dashboard page
    const isDashboardPage = window.location.pathname.includes('index.html') || 
                           window.location.pathname.endsWith('/') ||
                           !window.location.pathname.includes('.html');
    
    if (isDashboardPage) {
        updateCurrentDate();
        updateIraqTime();
        // Update Iraq time every second
        setInterval(updateIraqTime, 1000);
        loadDashboardStats();
        loadRecentReservations();
        
        // Update active nav item
        updateActiveNavItem('index.html');
    }
});

function updateCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
}

function updateIraqTime() {
    const iraqTimeValueEl = document.getElementById('iraqTimeValue');
    if (iraqTimeValueEl) {
        const now = new Date();
        // Iraq is UTC+3 (Baghdad time) - use Asia/Baghdad timezone
        const timeString = now.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Baghdad',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        iraqTimeValueEl.textContent = timeString;
    }
}

async function loadDashboardStats() {
    try {
        // Load reservations count
        const reservationsRes = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.RESERVATIONS));
        if (reservationsRes.ok) {
            const reservations = await reservationsRes.json();
            
            // Filter to only count reservations with completed payment (handle both camelCase and PascalCase)
            const paidReservations = reservations.filter(r => {
                const paymentStatus = r.paymentStatus || r.PaymentStatus;
                return paymentStatus === 'Paid';
            });
            
            const totalReservationsEl = document.getElementById('totalReservations');
            if (totalReservationsEl) {
                totalReservationsEl.textContent = paidReservations.length || 0;
            }
            
            // Calculate today's revenue split by completion status (only for paid reservations)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayReservations = paidReservations.filter(r => {
                const resDate = new Date(r.createdAt || r.CreatedAt);
                return resDate >= today;
            });
            
            // Split into completed and non-completed
            // Handle both camelCase and PascalCase field names from API
            const completedReservations = todayReservations.filter(r => {
                const status = r.processingStatus || r.ProcessingStatus || 'Waiting';
                return status === 'Completed' || status === 'email-fail';
            });
            const nonCompletedReservations = todayReservations.filter(r => {
                const status = r.processingStatus || r.ProcessingStatus || 'Waiting';
                return status !== 'Completed' && status !== 'email-fail';
            });
            
            const completedRevenue = completedReservations.reduce((sum, r) => sum + (parseFloat(r.price || r.Price) || 0), 0);
            const nonCompletedRevenue = nonCompletedReservations.reduce((sum, r) => sum + (parseFloat(r.price || r.Price) || 0), 0);
            
            // Update completed revenue card
            const completedRevenueEl = document.getElementById('completedRevenue');
            if (completedRevenueEl) {
                completedRevenueEl.textContent = formatCurrency(completedRevenue) + ' IQD';
            }
            
            // Update non-completed revenue card
            const nonCompletedRevenueEl = document.getElementById('nonCompletedRevenue');
            if (nonCompletedRevenueEl) {
                nonCompletedRevenueEl.textContent = formatCurrency(nonCompletedRevenue) + ' IQD';
            }
        }
        
        // Load daily limit status
        try {
            const limitRes = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SETTINGS + '/daily-reservation-limit'));
            if (limitRes.ok) {
                const limitData = await limitRes.json();
                const percentage = limitData.limit > 0 ? (limitData.todayTotal / limitData.limit * 100) : 0;
                const dailyLimitStatusEl = document.getElementById('dailyLimitStatus');
                if (dailyLimitStatusEl) {
                    dailyLimitStatusEl.textContent = `${percentage.toFixed(1)}% Used`;
                    
                    // Add warning if limit is high
                    if (percentage > 80) {
                        const statIcon = dailyLimitStatusEl.closest('.stat-card')?.querySelector('.stat-icon');
                        if (statIcon) {
                            statIcon.classList.remove('bg-warning');
                            statIcon.classList.add('bg-danger');
                        }
                    }
                }
            }
        } catch (limitError) {
            console.warn('Could not load limit status:', limitError);
        }
        
        // Load hotels count
        const hotelsRes = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.HOTELS));
        if (hotelsRes.ok) {
            const hotels = await hotelsRes.json();
            const totalHotelsEl = document.getElementById('totalHotels');
            if (totalHotelsEl) {
                totalHotelsEl.textContent = hotels.length || 0;
            }
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentReservations() {
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.RESERVATIONS));
        if (!response.ok) throw new Error('Failed to load reservations');
        
        const reservations = await response.json();
        const tableBody = document.getElementById('recentReservationsTable');
        
        if (!tableBody) {
            console.warn('Recent reservations table not found');
            return;
        }
        
        // Debug: Log total reservations and sample reservation structure
        console.log('Total reservations from API:', reservations.length);
        if (reservations.length > 0) {
            console.log('Sample reservation structure:', reservations[0]);
            console.log('PaymentStatus in sample:', reservations[0].PaymentStatus || reservations[0].paymentStatus);
        }
        
        // Filter to only show reservations with completed payment (handle both camelCase and PascalCase)
        const paidReservations = reservations.filter(r => {
            const paymentStatus = r.paymentStatus || r.PaymentStatus;
            return paymentStatus === 'Paid';
        });
        
        // Debug: Log filtering results
        console.log('Paid reservations count:', paidReservations.length);
        console.log('All payment statuses:', reservations.map(r => r.paymentStatus || r.PaymentStatus || 'NULL'));
        
        if (paidReservations.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No reservations found</td></tr>';
            return;
        }
        
        // Sort by date (newest first) - show all
        const recent = paidReservations
            .sort((a, b) => {
                const dateA = new Date(a.createdAt || a.CreatedAt);
                const dateB = new Date(b.createdAt || b.CreatedAt);
                return dateB - dateA;
            });
        
        tableBody.innerHTML = recent.map(r => {
            const processingStatus = r.processingStatus || r.ProcessingStatus || 'Waiting';
            const statusBadge = getStatusBadge(processingStatus);
            const paymentStatus = r.paymentStatus || r.PaymentStatus;
            const paymentStatusBadge = paymentStatus ? getPaymentStatusBadge(paymentStatus) : '';
            
            return `
            <tr>
                <td>#${r.id || r.Id}</td>
                <td>${r.firstName || r.FirstName} ${r.secondName || r.SecondName || ''} ${r.surname || r.Surname}</td>
                <td><span class="badge bg-info">${r.reserveType || r.ReserveType}</span></td>
                <td>${formatCurrency(r.price || r.Price)} IQD</td>
                <td>${formatDate(r.createdAt || r.CreatedAt)}</td>
                <td>
                    ${statusBadge}
                    ${paymentStatusBadge ? `<br><small>${paymentStatusBadge}</small>` : ''}
                </td>
            </tr>
        `;
        }).join('');
    } catch (error) {
        console.error('Error loading recent reservations:', error);
        const tableBody = document.getElementById('recentReservationsTable');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading reservations</td></tr>';
        }
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US').format(amount);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        let date;
        
        // If date string doesn't have timezone indicator, assume it's UTC from the database
        if (typeof dateString === 'string') {
            // Check if it's already a proper ISO string with timezone
            if (dateString.endsWith('Z') || dateString.includes('+') || dateString.match(/-\d{2}:\d{2}$/)) {
                // Has timezone info, parse directly
                date = new Date(dateString);
            } else {
                // No timezone info - assume UTC (database stores as UTC)
                // Add 'Z' to indicate UTC
                const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
                date = new Date(utcString);
            }
        } else {
            date = new Date(dateString);
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid date:', dateString);
            return 'Invalid Date';
        }
        
        // Get user's local timezone
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Format as local time (JavaScript automatically converts UTC to local)
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true // Use 12-hour format with AM/PM
        };
        
        // This will automatically convert from UTC to local time
        return date.toLocaleString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', dateString, error);
        return 'Invalid Date';
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

// Export for use in other files
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.getStatusBadge = getStatusBadge;
window.getPaymentStatusBadge = getPaymentStatusBadge;

