import apiClient from './api';

export const taxService = {
  /**
   * Fetch all tax rules
   * GET /api/taxes
   */
  async getTaxRules(activeOnly) {
    const params = {};
    if (activeOnly !== undefined) params.activeOnly = activeOnly;
    const response = await apiClient.get('/api/taxes', { params });
    return response.data;
  },

  /**
   * Create a new tax rule (Admin only)
   * POST /api/taxes
   */
  async createTaxRule(taxData) {
    const payload = {
      name: taxData.name?.trim(),
      rate: Number(taxData.rate) || 0,
      active: taxData.active !== undefined ? taxData.active : true,
    };
    const response = await apiClient.post('/api/taxes', payload);
    return response.data;
  },

  /**
   * Update a tax rule
   * PUT /api/taxes/{id}
   */
  async updateTaxRule(id, taxData) {
    const payload = {
      name: taxData.name?.trim(),
      rate: Number(taxData.rate) || 0,
      active: taxData.active !== undefined ? taxData.active : true,
    };
    const response = await apiClient.put(`/api/taxes/${id}`, payload);
    return response.data;
  },
};

export default taxService;
