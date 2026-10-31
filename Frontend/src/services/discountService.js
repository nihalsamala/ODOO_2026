import apiClient from './api';

function normalizeDiscountPayload(data) {
  // Generate code if not provided
  let code = data.code?.trim();
  if (!code) {
    const val = data.value || 10;
    const prefix = data.type === 'FIXED_AMOUNT' ? 'FLAT' : 'DISC';
    code = `${prefix}${val}_${Date.now().toString(36).toUpperCase()}`;
  }

  let type = data.type || 'PERCENTAGE';
  if (type !== 'PERCENTAGE' && type !== 'FIXED_AMOUNT') {
    type = 'PERCENTAGE';
  }

  return {
    code: code,
    type: type,
    value: Number(data.value) || 0,
    minPurchaseAmount: Number(data.minPurchaseAmount ?? data.minPurchase ?? 0),
    minQuantity: Number(data.minQuantity ?? data.minQty ?? 1),
    startDate: data.startDate || data.startsAt || new Date().toISOString().split('T')[0],
    endDate: data.endDate || data.endsAt || null,
    maxUsageCount: Number(data.maxUsageCount ?? data.maxUses ?? 100),
    targetType: data.targetType || (data.scope === 'ALL' ? 'ALL' : 'ALL'),
    targetProductId: data.targetProductId ? Number(data.targetProductId) : null,
    active: data.active !== undefined ? data.active : true,
  };
}

function normalizeDiscountResponse(d) {
  if (!d) return d;
  return {
    ...d,
    minPurchase: d.minPurchaseAmount,
    minQty: d.minQuantity,
    startsAt: d.startDate,
    endsAt: d.endDate,
    usesCount: d.currentUsageCount,
    maxUses: d.maxUsageCount,
    scope: d.targetType,
  };
}

export const discountService = {
  /**
   * Fetch all discount rules
   * GET /api/discounts
   */
  async getDiscountRules(activeOnly) {
    const params = {};
    if (activeOnly !== undefined) params.activeOnly = activeOnly;
    const response = await apiClient.get('/api/discounts', { params });
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map(normalizeDiscountResponse);
  },

  /**
   * Create a new discount rule
   * POST /api/discounts
   */
  async createDiscountRule(ruleData) {
    const payload = normalizeDiscountPayload(ruleData);
    const response = await apiClient.post('/api/discounts', payload);
    return normalizeDiscountResponse(response.data);
  },
};

export default discountService;
