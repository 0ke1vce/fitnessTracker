const API_URL = `http://${window.location.hostname || 'localhost'}:5000/api`;

class ApiService {
    static getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    static async request(endpoint, method = 'GET', body = null) {
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
                if (response.status === 401 && endpoint !== '/auth/login') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    // Ensure we bounce user out visually
                    if (typeof checkAuth === 'function') checkAuth();
                    throw new Error('Session expired or invalid token. Please log in again.');
                }
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error) {
            showToast(error.message, 'error');
            throw error;
        } finally {
            hideLoader();
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
}
