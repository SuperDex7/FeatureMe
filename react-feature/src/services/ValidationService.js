import api from './AuthService';

/**
 * Service for real-time validation of usernames and emails during signup
 */
class ValidationService {
    constructor() {
        this.validationTimeouts = new Map();
        this.debounceDelay = 500; // 500ms delay before making API call
    }

    /**
     * Check if username is available with debouncing
     * @param {string} username - The username to check
     * @param {function} callback - Callback function with result {available: boolean, username: string}
     */
    checkUsernameAvailability(username, callback) {
        // Clear existing timeout for this field
        if (this.validationTimeouts.has('username')) {
            clearTimeout(this.validationTimeouts.get('username'));
        }

        // Don't validate empty usernames
        if (!username || username.trim() === '') {
            callback({ available: true, username: username });
            return;
        }

        // Don't validate usernames that are too short
        if (username.length < 3) {
            callback({ available: false, username: username, error: 'Username must be at least 3 characters' });
            return;
        }

        // Set new timeout
        const timeoutId = setTimeout(async () => {
            try {
                const response = await api.get(`/user/auth/check-username/${encodeURIComponent(username)}`);
                callback(response.data);
            } catch (error) {
                console.error('Error checking username availability:', error);
                callback({ available: false, username: username, error: 'Error checking username availability' });
            }
        }, this.debounceDelay);

        this.validationTimeouts.set('username', timeoutId);
    }

    /**
     * Check if email is available with debouncing
     * @param {string} email - The email to check
     * @param {function} callback - Callback function with result {available: boolean, email: string}
     */
    checkEmailAvailability(email, callback) {
        // Clear existing timeout for this field
        if (this.validationTimeouts.has('email')) {
            clearTimeout(this.validationTimeouts.get('email'));
        }

        // Don't validate empty emails
        if (!email || email.trim() === '') {
            callback({ available: true, email: email });
            return;
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            callback({ available: false, email: email, error: 'Please enter a valid email address' });
            return;
        }

        // Set new timeout
        const timeoutId = setTimeout(async () => {
            try {
                const response = await api.get(`/user/auth/check-email/${encodeURIComponent(email)}`);
                callback(response.data);
            } catch (error) {
                console.error('Error checking email availability:', error);
                callback({ available: false, email: email, error: 'Error checking email availability' });
            }
        }, this.debounceDelay);

        this.validationTimeouts.set('email', timeoutId);
    }

    /**
     * Clear all pending validations
     */
    clearAllValidations() {
        this.validationTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.validationTimeouts.clear();
    }

    /**
     * Clear validation for a specific field
     * @param {string} field - The field to clear ('username' or 'email')
     */
    clearValidation(field) {
        if (this.validationTimeouts.has(field)) {
            clearTimeout(this.validationTimeouts.get(field));
            this.validationTimeouts.delete(field);
        }
    }
}

// Export singleton instance
export default new ValidationService();
