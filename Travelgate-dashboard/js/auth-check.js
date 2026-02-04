// Shared authentication check script for all dashboard pages
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication on page load
    if (!auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Verify user with server (check if user still exists and is active)
    const verification = await auth.verifyUser();
    if (!verification.authenticated) {
        auth.logout();
        return;
    }

    // Add logout button to sidebar if not already present
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav && !document.querySelector('.nav-item[onclick*="logout"]')) {
        const logoutItem = document.createElement('a');
        logoutItem.href = '#';
        logoutItem.className = 'nav-item';
        logoutItem.onclick = function(e) {
            e.preventDefault();
            auth.logout();
            return false;
        };
        logoutItem.innerHTML = '<i class="bi bi-box-arrow-right"></i> Logout';
        
        // Add separator
        const separator = document.createElement('div');
        separator.style.cssText = 'border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: auto; padding-top: 1rem;';
        separator.appendChild(logoutItem);
        sidebarNav.appendChild(separator);
    }

    // Show user info in header if available
    const user = auth.getUser();
    if (user) {
        const headerActions = document.querySelector('.header-actions');
        if (headerActions && !headerActions.querySelector('.user-info')) {
            const userInfo = document.createElement('span');
            userInfo.className = 'text-muted me-3 user-info';
            userInfo.textContent = `Welcome, ${user.fullName || user.username}`;
            headerActions.insertBefore(userInfo, headerActions.firstChild);
        }
    }
});

