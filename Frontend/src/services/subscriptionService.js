import apiClient from './api';

function normalizeSubscriptionPayload(data) {
  // Extract product, variant, and quantity from line items if provided as lines array
  let productId = data.productId;
  let variantId = data.variantId;
  let quantity = data.quantity || 1;

  if (Array.isArray(data.lines) && data.lines.length > 0) {
    const firstLine = data.lines[0];
    if (firstLine.productId) productId = firstLine.productId;
    if (firstLine.variantId !== undefined) variantId = firstLine.variantId;
    if (firstLine.quantity) quantity = firstLine.quantity;
  }

  // Initial status: backend accepts DRAFT, CONFIRMED, ACTIVE
  let initialStatus = data.initialStatus || data.status || 'ACTIVE';
  if (initialStatus === 'PAUSED' || initialStatus === 'CLOSED') {
    initialStatus = 'ACTIVE';
  }

  return {
    customerId: Number(data.customerId),
    planId: Number(data.planId),
    productId: Number(productId),
    variantId: variantId ? Number(variantId) : null,
    quantity: Number(quantity) || 1,
    startDate: data.startDate || new Date().toISOString().split('T')[0],
    expiryDate: data.expiryDate || data.endDate || null,
    agreedUnitPrice: data.agreedUnitPrice ? Number(data.agreedUnitPrice) : null,
    initialStatus: initialStatus,
  };
}

function normalizeSubscriptionResponse(sub) {
  if (!sub) return sub;
  const agreedTotal = sub.subtotal != null
    ? Number(sub.subtotal)
    : (sub.agreedUnitPrice && sub.quantity ? Number(sub.agreedUnitPrice) * sub.quantity : Number(sub.agreedTotal || 0));

  const lines = Array.isArray(sub.lines) && sub.lines.length > 0
    ? sub.lines
    : [
        {
          id: sub.id,
          productId: sub.productId,
          productName: sub.productName || 'Subscription Item',
          variantId: sub.variantId,
          variantName: sub.variantName,
          quantity: sub.quantity || 1,
          unitPriceSnapshot: sub.agreedUnitPrice,
          lineTotal: agreedTotal,
        },
      ];

  return {
    ...sub,
    number: sub.subscriptionNumber || sub.number,
    subscriptionNumber: sub.subscriptionNumber || sub.number,
    agreedTotal: agreedTotal,
    subtotal: agreedTotal,
    endDate: sub.expiryDate || sub.endDate,
    expiryDate: sub.expiryDate || sub.endDate,
    lines: lines,
  };
}

export const subscriptionService = {
  /**
   * Fetch subscriptions list
   * GET /api/subscriptions
   */
  async getSubscriptions(params = {}) {
    const cleanParams = {};
    if (params.customerId) cleanParams.customerId = params.customerId;
    if (params.status && params.status !== 'ALL') cleanParams.status = params.status;

    const response = await apiClient.get('/api/subscriptions', { params: cleanParams });
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map(normalizeSubscriptionResponse);
  },

  /**
   * Create a subscription
   * POST /api/subscriptions
   */
  async createSubscription(subscriptionData) {
    const payload = normalizeSubscriptionPayload(subscriptionData);
    const response = await apiClient.post('/api/subscriptions', payload);
    return normalizeSubscriptionResponse(response.data);
  },

  /**
   * Purchase a subscription through the customer catalog
   * POST /api/subscriptions/purchase
   * Only sends { productId, planId, variantId, quantity }
   */
  async purchaseSubscription(purchaseData) {
    const payload = {
      productId: Number(purchaseData.productId),
      planId: Number(purchaseData.planId),
      variantId: purchaseData.variantId ? Number(purchaseData.variantId) : null,
      quantity: Number(purchaseData.quantity) || 1,
    };
    const response = await apiClient.post('/api/subscriptions/purchase', payload);
    return normalizeSubscriptionResponse(response.data);
  },

  /**
   * Get single subscription details
   * GET /api/subscriptions/{id}
   */
  async getSubscriptionById(id) {
    const response = await apiClient.get(`/api/subscriptions/${id}`);
    return normalizeSubscriptionResponse(response.data);
  },

  /**
   * Confirm subscription (DRAFT/QUOTATION -> CONFIRMED)
   * POST /api/subscriptions/{id}/confirm
   */
  async confirmSubscription(id) {
    const response = await apiClient.post(`/api/subscriptions/${id}/confirm`);
    return normalizeSubscriptionResponse(response.data);
  },

  /**
   * Activate subscription (CONFIRMED/DRAFT -> ACTIVE)
   * POST /api/subscriptions/{id}/activate
   */
  async activateSubscription(id) {
    const response = await apiClient.post(`/api/subscriptions/${id}/activate`);
    return normalizeSubscriptionResponse(response.data);
  },

  /**
   * Pause subscription (suspends recurring billing)
   * POST /api/subscriptions/{id}/pause
   */
  async pauseSubscription(id) {
    const response = await apiClient.post(`/api/subscriptions/${id}/pause`);
    return normalizeSubscriptionResponse(response.data);
  },

  /**
   * Resume paused subscription
   * POST /api/subscriptions/{id}/resume
   */
  async resumeSubscription(id) {
    const response = await apiClient.post(`/api/subscriptions/${id}/resume`);
    return normalizeSubscriptionResponse(response.data);
  },

  /**
   * Close subscription
   * POST /api/subscriptions/{id}/close
   */
  async closeSubscription(id) {
    const response = await apiClient.post(`/api/subscriptions/${id}/close`);
    return normalizeSubscriptionResponse(response.data);
  },

  /**
   * Renew subscription
   */
  async renewSubscription(id) {
    // If backend doesn't have dedicated renew endpoint, re-activate or extend
    try {
      const response = await apiClient.post(`/api/subscriptions/${id}/activate`);
      return normalizeSubscriptionResponse(response.data);
    } catch {
      const response = await apiClient.post(`/api/subscriptions/${id}/resume`);
      return normalizeSubscriptionResponse(response.data);
    }
  },

  /**
   * Fetch upcoming subscription renewal alerts
   * GET /api/subscriptions/renewal-alerts
   */
  async getRenewalAlerts(params = {}) {
    const cleanParams = {};
    if (params.daysAhead) cleanParams.daysAhead = params.daysAhead;
    if (params.customerId) cleanParams.customerId = params.customerId;

    const response = await apiClient.get('/api/subscriptions/renewal-alerts', { params: cleanParams });
    return Array.isArray(response.data) ? response.data : [];
  },
};

export default subscriptionService;
