document.addEventListener('DOMContentLoaded', function() {
    // Update active nav item
    updateActiveNavItem('settings.html');
    
    loadDailyLimitSettings();
    loadAllReservationsEnabled();
    loadAllSectionVisibility();
    updateSystemInfo();
    
    // Update every 30 seconds
    setInterval(loadDailyLimitSettings, 30000);
    setInterval(loadAllReservationsEnabled, 30000);
    setInterval(loadAllSectionVisibility, 30000);
});

async function loadDailyLimitSettings() {
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SETTINGS + '/daily-reservation-limit'));
        if (!response.ok) throw new Error('Failed to load daily limit settings');
        
        const data = await response.json();
        
        // Update input field (remove commas for input, display with commas)
        const limitValue = data.limit.toString().replace(/,/g, '');
        document.getElementById('dailyLimitInput').value = limitValue;
        
        // Update today's status
        document.getElementById('todayTotal').textContent = formatCurrency(data.todayTotal) + ' IQD';
        document.getElementById('remainingCapacity').textContent = formatCurrency(data.remaining) + ' IQD';
        
        // Update progress bar
        const percentage = data.limit > 0 ? (data.todayTotal / data.limit * 100) : 0;
        const progressBar = document.getElementById('limitProgressBar');
        const percentageText = document.getElementById('limitPercentage');
        
        progressBar.style.width = `${Math.min(percentage, 100)}%`;
        percentageText.textContent = `${percentage.toFixed(1)}%`;
        
        // Update progress bar color based on percentage
        progressBar.classList.remove('bg-success', 'bg-warning', 'bg-danger');
        if (percentage < 50) {
            progressBar.classList.add('bg-success');
        } else if (percentage < 80) {
            progressBar.classList.add('bg-warning');
        } else {
            progressBar.classList.add('bg-danger');
        }
        
        // Update status text
        const statusText = document.getElementById('limitStatusText');
        if (percentage >= 100) {
            statusText.textContent = '⚠️ Daily limit reached! No new reservations can be accepted.';
            statusText.className = 'text-danger';
        } else if (percentage >= 80) {
            statusText.textContent = '⚠️ Warning: Daily limit is almost reached.';
            statusText.className = 'text-warning';
        } else {
            statusText.textContent = '✓ System is operating normally.';
            statusText.className = 'text-success';
        }
        
    } catch (error) {
        console.error('Error loading daily limit settings:', error);
        document.getElementById('limitStatusText').textContent = 'Error loading limit status.';
        document.getElementById('limitStatusText').className = 'text-danger';
    }
}

async function updateDailyLimit() {
    const limitInput = document.getElementById('dailyLimitInput');
    const limitValue = parseFloat(limitInput.value.replace(/,/g, ''));
    
    if (!limitValue || limitValue <= 0) {
        alert('Please enter a valid limit greater than 0');
        return;
    }
    
    if (!confirm(`Are you sure you want to set the daily reservation limit to ${formatCurrency(limitValue)} IQD?`)) {
        return;
    }
    
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SETTINGS + '/daily-reservation-limit'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                limit: limitValue,
                description: 'Daily reservation limit in IQD. When total reservations for today reach this amount, no more reservations will be accepted.'
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to update limit' }));
            throw new Error(error.error || error.message || 'Failed to update limit');
        }
        
        const result = await response.json();
        alert('Daily reservation limit updated successfully!');
        
        // Reload settings
        await loadDailyLimitSettings();
    } catch (error) {
        console.error('Error updating daily limit:', error);
        alert('Error updating daily limit: ' + error.message);
    }
}

// Load all reservation types enabled status
async function loadAllReservationsEnabled() {
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SETTINGS + '/reservations-enabled-all'));
        if (!response.ok) throw new Error('Failed to load reservations enabled status');
        
        const data = await response.json();
        
        // Update all toggles
        const reservationTypes = ['Hotel', 'Group', 'Transfer', 'FlightPackage', 'GroupProgram'];
        
        reservationTypes.forEach(type => {
            const toggle = document.getElementById(`reservationsEnabledToggle_${type}`);
            const statusText = document.getElementById(`reservationsStatusText_${type}`);
            
            if (toggle && statusText) {
                const enabled = data[type] !== false; // Default to true if not set
                toggle.checked = enabled;
                
                if (enabled) {
                    const displayName = type === 'GroupProgram' ? 'Group Program' : type;
                    statusText.textContent = `✓ ${displayName} reservations are enabled. Customers can make new ${displayName} reservations.`;
                    statusText.className = 'text-success';
                } else {
                    const displayName = type === 'GroupProgram' ? 'Group Program' : type;
                    statusText.textContent = `⚠️ ${displayName} reservations are disabled. No new ${displayName} reservations can be created.`;
                    statusText.className = 'text-danger';
                }
            }
        });
    } catch (error) {
        console.error('Error loading reservations enabled status:', error);
        const reservationTypes = ['Hotel', 'Group', 'Transfer', 'FlightPackage', 'GroupProgram'];
        reservationTypes.forEach(type => {
            const statusText = document.getElementById(`reservationsStatusText_${type}`);
            if (statusText) {
                statusText.textContent = 'Error loading status.';
                statusText.className = 'text-danger';
            }
        });
    }
}

// Toggle specific reservation type
async function toggleReservationType(reservationType) {
    const toggle = document.getElementById(`reservationsEnabledToggle_${reservationType}`);
    if (!toggle) {
        console.error(`Toggle not found for ${reservationType}`);
        return;
    }
    
    const enabled = toggle.checked;
    
    const displayName = reservationType === 'GroupProgram' ? 'Group Program' : reservationType;
    if (!confirm(`Are you sure you want to ${enabled ? 'enable' : 'disable'} ${displayName} reservations?`)) {
        // Revert toggle if user cancels
        toggle.checked = !enabled;
        return;
    }
    
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SETTINGS + `/reservations-enabled/${reservationType}`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                enabled: enabled
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to update reservations status' }));
            throw new Error(error.error || error.message || 'Failed to update reservations status');
        }
        
        const result = await response.json();
        const displayName = reservationType === 'GroupProgram' ? 'Group Program' : reservationType;
        alert(`${displayName} reservations ${enabled ? 'enabled' : 'disabled'} successfully!`);
        
        // Reload status
        await loadAllReservationsEnabled();
    } catch (error) {
        console.error(`Error updating ${reservationType} reservations status:`, error);
        const displayName = reservationType === 'GroupProgram' ? 'Group Program' : reservationType;
        alert(`Error updating ${displayName} reservations status: ${error.message}`);
        // Revert toggle on error
        toggle.checked = !enabled;
        await loadAllReservationsEnabled();
    }
}

// Legacy function for backward compatibility (if needed)
async function loadReservationsEnabled() {
    // Redirect to new function
    await loadAllReservationsEnabled();
}

async function toggleReservations() {
    // This function is kept for backward compatibility but can show a message
    alert('Please use the individual reservation type toggles below to enable/disable specific reservation types.');
}

function updateSystemInfo() {
    document.getElementById('apiBaseUrl').textContent = API_CONFIG.BASE_URL;
    document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
}

// Load all section visibility settings
async function loadAllSectionVisibility() {
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SETTINGS + '/section-visibility-all'));
        if (!response.ok) throw new Error('Failed to load section visibility status');
        
        const data = await response.json();
        
        // Update all toggles
        const sections = ['Hotels', 'Packages', 'Groups', 'GroupPrograms', 'Transfers', 'Flights'];
        
        sections.forEach(section => {
            const toggle = document.getElementById(`sectionVisibilityToggle_${section}`);
            const statusText = document.getElementById(`sectionVisibilityStatusText_${section}`);
            
            if (toggle && statusText) {
                const visible = data[section] !== false; // Default to true if not set
                toggle.checked = visible;
                
                const displayName = section === 'GroupPrograms' ? 'Group Programs' : 
                                   section === 'Packages' ? 'Hotel Packages' :
                                   section === 'Groups' ? 'Group Tours' :
                                   section === 'Transfers' ? 'Transfers' :
                                   section === 'Flights' ? 'Flights' : 'Hotels';
                
                if (visible) {
                    statusText.textContent = `✓ ${displayName} section is visible on the website.`;
                    statusText.className = 'text-success';
                } else {
                    statusText.textContent = `⚠️ ${displayName} section is hidden from visitors.`;
                    statusText.className = 'text-warning';
                }
            }
        });
    } catch (error) {
        console.error('Error loading section visibility status:', error);
        const sections = ['Hotels', 'Packages', 'Groups', 'GroupPrograms', 'Transfers', 'Flights'];
        sections.forEach(section => {
            const statusText = document.getElementById(`sectionVisibilityStatusText_${section}`);
            if (statusText) {
                statusText.textContent = 'Error loading status.';
                statusText.className = 'text-danger';
            }
        });
    }
}

// Toggle section visibility
async function toggleSectionVisibility(sectionName) {
    const toggle = document.getElementById(`sectionVisibilityToggle_${sectionName}`);
    if (!toggle) {
        console.error(`Toggle not found for ${sectionName}`);
        return;
    }
    
    const visible = toggle.checked;
    
    const displayName = sectionName === 'GroupPrograms' ? 'Group Programs' : 
                       sectionName === 'Packages' ? 'Hotel Packages' :
                       sectionName === 'Groups' ? 'Group Tours' :
                       sectionName === 'Transfers' ? 'Transfers' :
                       sectionName === 'Flights' ? 'Flights' : 'Hotels';
    
    if (!confirm(`Are you sure you want to ${visible ? 'show' : 'hide'} the ${displayName} section on the website?`)) {
        // Revert toggle if user cancels
        toggle.checked = !visible;
        return;
    }
    
    try {
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SETTINGS + `/section-visibility/${sectionName}`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                visible: visible
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to update section visibility' }));
            throw new Error(error.error || error.message || 'Failed to update section visibility');
        }
        
        const result = await response.json();
        alert(`${displayName} section ${visible ? 'shown' : 'hidden'} successfully!`);
        
        // Reload status
        await loadAllSectionVisibility();
    } catch (error) {
        console.error(`Error updating ${sectionName} section visibility:`, error);
        alert(`Error updating ${displayName} section visibility: ${error.message}`);
        // Revert toggle on error
        toggle.checked = !visible;
        await loadAllSectionVisibility();
    }
}

