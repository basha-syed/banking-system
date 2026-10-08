/**
 * Unified API Client for Apex Banking System
 */
const API_BASE_URL = '/api';

class API {
  // Helper to fetch authorization header
  static getHeaders() {
    const token = localStorage.getItem('apex_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Generic Request Handler
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle 401 Unauthorized session expiry
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          localStorage.removeItem('apex_token');
          localStorage.removeItem('apex_user');
          if (window.location.hash !== '#login') {
            window.location.hash = 'login';
            if (window.UI) window.UI.showToast('warning', 'Session Expired', 'Please log in again to continue.');
          }
        }
        throw new Error(data.message || 'API request failed.');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  // HTTP Method Shortcuts
  static get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  static post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  static put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  static delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

window.API = API;
