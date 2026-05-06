const API_BASE = 'http://localhost:5000/api';

export const api = {
    async request(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        const config = {
            method,
            headers,
            ...(body && { body: JSON.stringify(body) })
        };

        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'API Request Failed');
        }
        return data;
    },

    login: (email, password) => api.request('/auth/login', 'POST', { email, password }),
    register: (userData) => api.request('/auth/register', 'POST', userData),
    getProfile: () => api.request('/profile'),
    getWorkouts: () => api.request('/workouts'),
    getGamificationStats: () => api.request('/gamification/stats')
};
