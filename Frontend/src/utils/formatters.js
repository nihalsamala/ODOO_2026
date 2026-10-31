/**
 * Format currency amount with currency symbol
 * @param {number|string} amount 
 * @param {string} currency default 'INR'
 */
export function formatCurrency(amount, currency = 'INR') {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0.00';
  }
  const numeric = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

/**
 * Format date string to readable format: 'DD MMM YYYY'
 * @param {string} dateString 
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format datetime to readable format
 * @param {string} dateString 
 */
export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Maps entity statuses to UI badge styles
 * @param {string} status 
 * @returns {string} badge CSS class
 */
export function getStatusBadgeVariant(status) {
  if (!status) return 'neutral';
  const s = status.toUpperCase();
  switch (s) {
    case 'ACTIVE':
    case 'PAID':
    case 'CONFIRMED':
      return 'success';
    case 'PARTIALLY_PAID':
    case 'QUOTATION':
    case 'PAUSED':
      return 'warning';
    case 'OVERDUE':
    case 'CANCELLED':
    case 'FAILED':
      return 'danger';
    case 'DRAFT':
      return 'neutral';
    case 'CLOSED':
      return 'purple';
    default:
      return 'neutral';
  }
}

/**
 * Formats lifecycle rule into readable label
 */
export function formatLifecycleRule(rule) {
  if (!rule) return 'Manual Renewal';
  switch (rule.toLowerCase()) {
    case 'auto-renew':
    case 'auto_renew':
      return 'Auto-Renew';
    case 'auto-close':
    case 'auto_close':
      return 'Auto-Close';
    case 'manual-renewal':
    case 'manual_renewal':
      return 'Manual Renewal';
    default:
      return rule;
  }
}

/**
 * Formats billing interval
 */
export function formatInterval(interval) {
  if (!interval) return 'Monthly';
  switch (interval.toLowerCase()) {
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    case 'yearly': return 'Yearly';
    default: return interval;
  }
}

/**
 * Formats payment method
 */
export function formatPaymentMethod(method) {
  if (!method) return '—';
  switch (method.toUpperCase()) {
    case 'BANK_TRANSFER': return 'Bank Transfer';
    case 'CREDIT_CARD': return 'Credit Card';
    case 'UPI': return 'UPI';
    case 'NET_BANKING': return 'Net Banking';
    case 'CASH': return 'Cash';
    default: return method;
  }
}
