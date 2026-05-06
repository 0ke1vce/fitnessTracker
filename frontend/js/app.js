document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function checkAuth() {
    let token = localStorage.getItem('token');
    
    // Safety check: if token is the string "undefined" or "null", treat as null
    if (token === 'undefined' || token === 'null' || token === '') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        token = null;
    }

    // Validate token is a real JWT (has 3 dot-separated parts) and not expired
    if (token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) throw new Error('bad token');
            const payload = JSON.parse(atob(parts[1]));
            // Check expiry if present
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                throw new Error('token expired');
            }
        } catch (e) {
            console.warn('Invalid/expired token, clearing:', e.message);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            token = null;
        }
    }

    const authView = document.getElementById('authView');
    const dashboardView = document.getElementById('dashboardView');
    const loader = document.getElementById('loader');

    // Always hide loader first
    if (loader) {
        loader.classList.add('hidden');
        loader.style.display = 'none';
    }

    if (token) {
        authView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        try {
            initDashboard();
        } catch (e) {
            console.error('Dashboard error:', e);
            hideLoader();
        }
    } else {
        dashboardView.classList.add('hidden');
        authView.classList.remove('hidden');
    }
}

// Global UI helpers
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = '';
        loader.classList.remove('hidden');
    }
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
        loader.style.display = 'none';
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'circle-exclamation'}"></i> ${message}`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
