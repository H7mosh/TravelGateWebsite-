// Simple authentication management (no tokens, no expiration)
const auth = {
    USERNAME_KEY: 'travelgate_username',
    USER_KEY: 'travelgate_user',

    // Login function
    async login(username, password) {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH + '/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success && data.user) {
                // Store username and user info (no token, no expiration)
                localStorage.setItem(this.USERNAME_KEY, username);
                localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
                return { success: true };
            } else {
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error. Please check your connection.' };
        }
    },

    // Logout function
    async logout() {
        try {
            // Notify server (optional)
            await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH + '/logout'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        // Clear local storage
        localStorage.removeItem(this.USERNAME_KEY);
        localStorage.removeItem(this.USER_KEY);
        
        // Redirect to login
        window.location.href = 'login.html';
    },

    // Get stored username
    getUsername() {
        return localStorage.getItem(this.USERNAME_KEY);
    },

    // Get current user
    getUser() {
        const userStr = localStorage.getItem(this.USER_KEY);
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getUsername();
    },

    // Verify user with server (check if user still exists and is active)
    async verifyUser() {
        const username = this.getUsername();
        
        if (!username) {
            return { success: false, authenticated: false };
        }

        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH + '/verify'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });

            const data = await response.json();

            if (data.success && data.user) {
                // Update user info
                localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
                return { success: true, authenticated: true, user: data.user };
            } else {
                // User invalid - return false; auth-check will call logout() to clear and redirect
                return { success: false, authenticated: false };
            }
        } catch (error) {
            console.error('User verification error:', error);
            // On network error, allow access but mark as unverified
            return { success: false, authenticated: true, error: 'Network error' };
        }
    }
};

// Make auth available globally
window.auth = auth;

