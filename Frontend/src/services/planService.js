import apiClient from './api';

function normalizePlanPayload(planData) {
  let interval = (planData.billingInterval || planData.interval || 'MONTHLY').toUpperCase();
  if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(interval)) {
    interval = 'MONTHLY';
  }

  let rule = (planData.lifecycleRule || 'AUTO_RENEW').replace(/-/g, '_').toUpperCase();
  if (!['AUTO_RENEW', 'AUTO_CLOSE', 'MANUAL_RENEWAL'].includes(rule)) {
    rule = 'AUTO_RENEW';
  }

  return {
    name: planData.name?.trim(),
    price: Number(planData.price) || 0,
    billingInterval: interval,
    minimumQuantity: Number(planData.minimumQuantity) || 1,
    availabilityStartDate: planData.availabilityStartDate || planData.availableFrom || new Date().toISOString().split('T')[0],
    availabilityEndDate: planData.availabilityEndDate || planData.availableTo || null,
    lifecycleRule: rule,
    active: planData.active !== undefined ? planData.active : true,
  };
}

function normalizePlanResponse(plan) {
  if (!plan) return plan;
  return {
    ...plan,
    interval: plan.billingInterval || plan.interval,
    availableFrom: plan.availabilityStartDate || plan.availableFrom,
    availableTo: plan.availabilityEndDate || plan.availableTo,
  };
}

export const planService = {
  /**
   * Fetch all plans
   * GET /api/plans
   */
  async getPlans(activeOnly) {
    const params = {};
    if (activeOnly !== undefined) params.activeOnly = activeOnly;
    const response = await apiClient.get('/api/plans', { params });
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map(normalizePlanResponse);
  },

  /**
   * Create new subscription plan
   * POST /api/plans
   */
  async createPlan(planData) {
    const payload = normalizePlanPayload(planData);
    const response = await apiClient.post('/api/plans', payload);
    return normalizePlanResponse(response.data);
  },

  /**
   * Get single plan by ID
   * GET /api/plans/{id}
   */
  async getPlanById(id) {
    const response = await apiClient.get(`/api/plans/${id}`);
    return normalizePlanResponse(response.data);
  },

  /**
   * Update plan details
   * PUT /api/plans/{id}
   */
  async updatePlan(id, planData) {
    const payload = normalizePlanPayload(planData);
    const response = await apiClient.put(`/api/plans/${id}`, payload);
    return normalizePlanResponse(response.data);
  },
};

export default planService;
