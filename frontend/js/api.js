const API_BASE = '/api';

const API = {
  getToken() {
    return localStorage.getItem('campusfix_token');
  },

  getUser() {
    const userStr = localStorage.getItem('campusfix_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },

  setSession(token, user) {
    localStorage.setItem('campusfix_token', token);
    localStorage.setItem('campusfix_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('campusfix_token');
    localStorage.removeItem('campusfix_user');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = options.headers || {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.clearSession();
          if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('index.html')) {
            window.location.href = 'login.html?session=expired';
          }
        }
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }
};
