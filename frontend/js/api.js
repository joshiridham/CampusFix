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

// Global Utility Functions shared across all dashboards
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showAlert(container, msg, type = 'info') {
  if (!container) return;
  container.className = `alert alert-${type} alert-dismissible fade show`;
  container.innerHTML = `
    <span>${escapeHtml(msg)}</span>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  container.classList.remove('d-none');
}

function getStatusBadge(status) {
  switch (status) {
    case 'Pending':
      return '<span class="badge badge-status badge-pending"><i class="bi bi-clock-history me-1"></i>Pending</span>';
    case 'Verified':
      return '<span class="badge badge-status badge-verified"><i class="bi bi-patch-check me-1"></i>Verified</span>';
    case 'Assigned':
      return '<span class="badge badge-status badge-assigned"><i class="bi bi-person-check me-1"></i>Assigned</span>';
    case 'In Progress':
      return '<span class="badge badge-status badge-in-progress"><i class="bi bi-arrow-repeat me-1"></i>In Progress</span>';
    case 'Resolved':
      return '<span class="badge badge-status badge-resolved"><i class="bi bi-check-circle-fill me-1"></i>Resolved</span>';
    case 'Rejected':
      return '<span class="badge badge-status badge-rejected"><i class="bi bi-x-circle-fill me-1"></i>Rejected</span>';
    default:
      return `<span class="badge bg-secondary">${escapeHtml(status || 'Pending')}</span>`;
  }
}

function getPriorityBadge(priority) {
  switch (priority) {
    case 'Urgent':
      return '<span class="badge badge-status badge-priority-urgent"><i class="bi bi-lightning-fill me-1"></i>Urgent</span>';
    case 'High':
      return '<span class="badge badge-status badge-priority-high">High</span>';
    case 'Medium':
      return '<span class="badge badge-status badge-priority-medium">Medium</span>';
    case 'Low':
      return '<span class="badge badge-status badge-priority-low">Low</span>';
    default:
      return `<span class="badge bg-light text-dark border">${escapeHtml(priority || 'Medium')}</span>`;
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
