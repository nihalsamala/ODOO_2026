import apiClient from './api';

export const authService = {
  /**
   * Authenticate user with credentials
   * POST /api/auth/login
   */
  async login(credentials) {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  },

  /**
   * Register new user account
   * POST /api/auth/register
   */
  async register(userData) {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  },

  /**
   * Client-side logout helper
   */
  logout() {
    localStorage.removeItem('subscriptiq_token');
    localStorage.removeItem('subscriptiq_user');
  },
};

export default authService;
