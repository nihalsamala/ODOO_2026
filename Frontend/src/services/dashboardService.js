import apiClient from './api';

export const dashboardService = {
  /**
   * Fetch dashboard financial & operational metrics
   * GET /api/dashboard/summary?startDate=...&endDate=...
   */
  async getDashboardSummary(params = {}) {
    const cleanParams = {};
    if (params.startDate || params.from) {
      cleanParams.startDate = params.startDate || params.from;
    }
    if (params.endDate || params.to) {
      cleanParams.endDate = params.endDate || params.to;
    }

    const response = await apiClient.get('/api/dashboard/summary', {
      params: cleanParams,
    });
    const data = response.data || {};

    return {
      ...data,
      activeSubscriptions: Number(data.activeSubscriptions || 0),
      paymentsReceived: Number(data.revenueReceived != null ? data.revenueReceived : data.paymentsReceived || 0),
      revenueReceived: Number(data.revenueReceived != null ? data.revenueReceived : data.paymentsReceived || 0),
      outstandingBalance: Number(data.amountOwed != null ? data.amountOwed : data.outstandingBalance || 0),
      amountOwed: Number(data.amountOwed != null ? data.amountOwed : data.outstandingBalance || 0),
      overdueInvoices: Number(data.overdueInvoices || 0),
      totalCustomers: Number(data.totalCustomers || 0),
      totalInvoices: Number(data.totalInvoices || 0),
    };
  },
};

export default dashboardService;
