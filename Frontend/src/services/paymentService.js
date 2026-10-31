import apiClient from './api';

function normalizePaymentMethod(method) {
  if (!method) return 'BANK_TRANSFER';
  const m = method.toUpperCase().replace(/\s+/g, '_');
  if (['CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'UPI', 'PAYPAL'].includes(m)) {
    return m;
  }
  if (m === 'NET_BANKING') return 'BANK_TRANSFER';
  return 'BANK_TRANSFER';
}

function normalizePaymentResponse(payment) {
  if (!payment) return payment;
  return {
    ...payment,
    method: payment.paymentMethod,
    paidAt: payment.paymentDate,
  };
}

export const paymentService = {
  /**
   * Record a payment against an invoice
   * POST /api/payments
   */
  async recordPayment(invoiceIdOrData, paymentData = {}) {
    let payload;
    if (typeof invoiceIdOrData === 'object' && invoiceIdOrData !== null) {
      payload = invoiceIdOrData;
    } else {
      payload = {
        ...paymentData,
        invoiceId: invoiceIdOrData,
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const date = payload.paymentDate || (payload.paidAt ? payload.paidAt.split(' ')[0] : today);

    const body = {
      invoiceId: Number(payload.invoiceId),
      amount: Number(payload.amount),
      paymentMethod: normalizePaymentMethod(payload.paymentMethod || payload.method),
      paymentDate: date,
      note: payload.note || '',
    };

    const response = await apiClient.post('/api/payments', body);
    return normalizePaymentResponse(response.data);
  },

  /**
   * Get payment history for an invoice
   * GET /api/payments?invoiceId={id}
   */
  async getPaymentsForInvoice(invoiceId) {
    const response = await apiClient.get('/api/payments', {
      params: { invoiceId: Number(invoiceId) },
    });
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map(normalizePaymentResponse);
  },

  /**
   * Get payments with optional filters
   * GET /api/payments
   */
  async getPayments(params = {}) {
    const cleanParams = {};
    if (params.invoiceId) cleanParams.invoiceId = params.invoiceId;
    if (params.customerId) cleanParams.customerId = params.customerId;

    const response = await apiClient.get('/api/payments', { params: cleanParams });
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map(normalizePaymentResponse);
  },

  /**
   * Get single payment by ID
   * GET /api/payments/{id}
   */
  async getPaymentById(id) {
    const response = await apiClient.get(`/api/payments/${id}`);
    return normalizePaymentResponse(response.data);
  },
};

export default paymentService;
