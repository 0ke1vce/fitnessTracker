const API_URL = `http://${window.location.hostname || 'localhost'}:5000/api`;

class ApiService {
    static getHeaders() {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        
        if (token && token !== 'undefined' && token !== 'null') {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    static _loggingOut = false;
    static _activeRequests = 0;

    static async request(endpoint, method = 'GET', body = null) {
        this._activeRequests++;
        showLoader();
        try {
            const options = {
                method,
                headers: this.getHeaders()
            };
            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(`${API_URL}${endpoint}`, options);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
                    // Only handle logout once across parallel requests
                    if (!ApiService._loggingOut) {
                        ApiService._loggingOut = true;
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        // Switch to auth view directly — NO reload to avoid infinite loop
                        const authView = document.getElementById('authView');
                        const dashView = document.getElementById('dashboardView');
                        if (authView) authView.classList.remove('hidden');
                        if (dashView) dashView.classList.add('hidden');
                        hideLoader();
                        showToast('Session expired. Please log in again.', 'error');
                        // Reset flag after a short delay so future logins work
                        setTimeout(() => { ApiService._loggingOut = false; }, 1000);
                    }
                    throw new Error('Session expired');
                }
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error) {
            if (!ApiService._loggingOut) showToast(error.message, 'error');
            throw error;
        } finally {
            this._activeRequests--;
            if (this._activeRequests <= 0) {
                this._activeRequests = 0; // Guard
                hideLoader();
            }
        }
    }

    static async login(email, password) {
        return this.request('/auth/login', 'POST', { email, password });
    }

    static async register(userData) {
        return this.request('/auth/register', 'POST', userData);
    }

    static async getExercises() {
        return this.request('/exercises');
    }

    static async getWorkouts() {
        return this.request('/workouts');
    }

    static async addWorkout(data) {
        return this.request('/workouts', 'POST', data);
    }

    static async deleteWorkout(id) {
        return this.request(`/workouts/${id}`, 'DELETE');
    }

    static async getProgress() {
        return this.request('/progress');
    }

    static async addProgress(data) {
        return this.request('/progress', 'POST', data);
    }

    static async deleteProgress(id) {
        return this.request(`/progress/${id}`, 'DELETE');
    }

    static async getProfile() {
        return this.request('/profile');
    }

    static async updateProfile(data) {
        return this.request('/profile', 'PUT', data);
    }

    // Advanced Features
    static async generateWorkoutPlan(goal) {
        return this.request('/generator/generate', 'POST', { goal });
    }

    static async getActivePlan() {
        return this.request('/generator/active');
    }

    static async getVolumeAnalytics() {
        return this.request('/analytics/volume');
    }

    static async getOneRMAnalytics() {
        return this.request('/analytics/onerm');
    }

    // Trainers & Subscriptions
    static async getTrainers() {
        return this.request('/trainers');
    }

    static async subscribeToTrainer(trainerId) {
        return this.request('/trainers/subscribe', 'POST', { trainerId });
    }

    static async getActiveSubscription() {
        return this.request('/trainers/subscription');
    }

    // Gamification
    static async getGamificationStats() {
        return this.request('/gamification/stats');
    }
}
