import apiClient from './api';

function normalizeInvoiceResponse(inv) {
  if (!inv) return inv;
  return {
    ...inv,
    number: inv.invoiceNumber || inv.number,
    invoiceNumber: inv.invoiceNumber || inv.number,
    lines: Array.isArray(inv.lines) ? inv.lines : [],
  };
}

export const invoiceService = {
  /**
   * Run recurring billing process / generate due invoices
   * POST /api/invoices/generate
   */
  async runBilling(params = {}) {
    const cleanParams = {};
    if (params.subscriptionId) cleanParams.subscriptionId = params.subscriptionId;
    if (params.asOfDate) cleanParams.asOfDate = params.asOfDate;

    const response = await apiClient.post('/api/invoices/generate', null, {
      params: cleanParams,
    });
    return response.data;
  },

  /**
   * Generate invoice explicitly (alias for runBilling)
   */
  async generateInvoices(params = {}) {
    return this.runBilling(params);
  },

  /**
   * Get all invoices
   * GET /api/invoices
   */
  async getInvoices(params = {}) {
    const cleanParams = {};
    if (params.customerId) cleanParams.customerId = params.customerId;
    if (params.subscriptionId) cleanParams.subscriptionId = params.subscriptionId;
    if (params.status && params.status !== 'ALL') cleanParams.status = params.status;

    const response = await apiClient.get('/api/invoices', { params: cleanParams });
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map(normalizeInvoiceResponse);
  },

  /**
   * Get single invoice details by ID
   * GET /api/invoices/{id}
   */
  async getInvoiceById(id) {
    const response = await apiClient.get(`/api/invoices/${id}`);
    return normalizeInvoiceResponse(response.data);
  },

  /**
   * Confirm a draft invoice
   * POST /api/invoices/{id}/confirm
   */
  async confirmInvoice(id) {
    const response = await apiClient.post(`/api/invoices/${id}/confirm`);
    return normalizeInvoiceResponse(response.data);
  },

  /**
   * Cancel an invoice
   * POST /api/invoices/{id}/cancel
   */
  async cancelInvoice(id) {
    const response = await apiClient.post(`/api/invoices/${id}/cancel`);
    return normalizeInvoiceResponse(response.data);
  },
};

export default invoiceService;
