import apiClient from './api';

export const productService = {
  /**
   * Fetch all products
   * GET /api/products
   */
  async getProducts(activeOnly) {
    const params = {};
    if (activeOnly !== undefined) params.activeOnly = activeOnly;
    const response = await apiClient.get('/api/products', { params });
    return response.data;
  },

  /**
   * Create new product with optional variants
   * POST /api/products
   */
  async createProduct(productData) {
    // Normalize product type for backend (SERVICE, DIGITAL, PHYSICAL)
    let type = productData.type || 'SERVICE';
    if (type === 'SAAS') type = 'SERVICE';

    const payload = {
      name: productData.name?.trim(),
      type: type,
      salesPrice: Number(productData.salesPrice) || 0,
      costPrice: productData.costPrice ? Number(productData.costPrice) : 0,
      notes: productData.notes || '',
      active: productData.active !== undefined ? productData.active : true,
      variants: Array.isArray(productData.variants)
        ? productData.variants
            .filter((v) => v.name && v.name.trim())
            .map((v) => ({
              name: v.name.trim(),
              priceAdjustment: Number(v.priceAdjustment) || 0,
              active: v.active !== undefined ? v.active : true,
            }))
        : [],
    };

    const response = await apiClient.post('/api/products', payload);
    return response.data;
  },

  /**
   * Get single product details by ID
   * GET /api/products/{id}
   */
  async getProductById(id) {
    const response = await apiClient.get(`/api/products/${id}`);
    return response.data;
  },

  /**
   * Update existing product
   * PUT /api/products/{id}
   */
  async updateProduct(id, productData) {
    let type = productData.type || 'SERVICE';
    if (type === 'SAAS') type = 'SERVICE';

    const payload = {
      name: productData.name?.trim(),
      type: type,
      salesPrice: Number(productData.salesPrice) || 0,
      costPrice: productData.costPrice ? Number(productData.costPrice) : 0,
      notes: productData.notes || '',
      active: productData.active !== undefined ? productData.active : true,
    };

    const response = await apiClient.put(`/api/products/${id}`, payload);
    return response.data;
  },

  /**
   * Get product variants
   * GET /api/products/{id}/variants
   */
  async getVariants(productId, activeOnly) {
    const params = {};
    if (activeOnly !== undefined) params.activeOnly = activeOnly;
    const response = await apiClient.get(`/api/products/${productId}/variants`, { params });
    return response.data;
  },

  /**
   * Add a variant to a product
   * POST /api/products/{id}/variants
   */
  async addVariant(productId, variantData) {
    const response = await apiClient.post(`/api/products/${productId}/variants`, {
      name: variantData.name?.trim(),
      priceAdjustment: Number(variantData.priceAdjustment) || 0,
      active: variantData.active !== undefined ? variantData.active : true,
    });
    return response.data;
  },

  /**
   * Update a product variant
   * PUT /api/products/{id}/variants/{variantId}
   */
  async updateVariant(productId, variantId, variantData) {
    const response = await apiClient.put(`/api/products/${productId}/variants/${variantId}`, {
      name: variantData.name?.trim(),
      priceAdjustment: Number(variantData.priceAdjustment) || 0,
      active: variantData.active !== undefined ? variantData.active : true,
    });
    return response.data;
  },

  /**
   * Get compatible plans for a product using backend /api/product-plans
   * GET /api/product-plans
   */
  async getProductPlans(productId) {
    const response = await apiClient.get('/api/product-plans');
    const allMappings = response.data || [];
    const productMappings = allMappings.filter(
      (m) => m.productId === Number(productId) && m.active !== false
    );
    // Return objects formatted with id matching planId so UI works seamlessly
    return productMappings.map((m) => ({
      id: m.planId,
      mappingId: m.id,
      planId: m.planId,
      name: m.planName,
      billingInterval: m.billingInterval,
      price: m.planPrice,
    }));
  },

  /**
   * Update product-plan compatibility mapping
   * Syncs with backend /api/product-plans (link / delete)
   */
  async updateProductPlans(productId, planIds) {
    const pId = Number(productId);
    const targetPlanIds = (planIds || []).map(Number);

    // Fetch existing mappings
    const response = await apiClient.get('/api/product-plans');
    const existing = (response.data || []).filter((m) => m.productId === pId);

    // Delete mappings no longer selected
    const toDelete = existing.filter((m) => !targetPlanIds.includes(m.planId));
    for (const del of toDelete) {
      await apiClient.delete(`/api/product-plans/${del.id}`);
    }

    // Add new mappings
    const existingPlanIds = existing.map((m) => m.planId);
    const toAdd = targetPlanIds.filter((id) => !existingPlanIds.includes(id));
    for (const planId of toAdd) {
      await apiClient.post('/api/product-plans', {
        productId: pId,
        planId: planId,
        active: true,
      });
    }

    return true;
  },
};

export default productService;
