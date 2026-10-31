import apiClient from './api';

export const customerService = {
  /**
   * Fetch all customers
   * GET /api/customers
   */
  async getCustomers() {
    const response = await apiClient.get('/api/customers');
    return response.data;
  },

  /**
   * Get single customer by ID
   * GET /api/customers/{id}
   */
  async getCustomerById(id) {
    const response = await apiClient.get(`/api/customers/${id}`);
    return response.data;
  },

  /**
   * Create new customer
   * POST /api/customers
   */
  async createCustomer(customerData) {
    const response = await apiClient.post('/api/customers', customerData);
    return response.data;
  },

  /**
   * Update existing customer
   * PUT /api/customers/{id}
   */
  async updateCustomer(id, customerData) {
    const response = await apiClient.put(`/api/customers/${id}`, customerData);
    return response.data;
  },
};

export default customerService;
