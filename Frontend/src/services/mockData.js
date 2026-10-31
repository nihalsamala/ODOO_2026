/**
 * SubscriptIQ Mock Data Store
 * Source of truth for local mock mode simulation.
 * Stored in localStorage for realistic state persistence during hackathon demos.
 */

const STORAGE_KEY = 'subscriptiq_mock_db_v1';

const INITIAL_MOCK_DATA = {
  users: [
    {
      id: 'usr_admin',
      name: 'SubscriptIQ Admin',
      email: 'admin@subscriptiq.com',
      role: 'ADMIN',
      token: 'mock-jwt-admin-token-xyz',
    },
    {
      id: 'usr_staff',
      name: 'SubscriptIQ Staff',
      email: 'staff@subscriptiq.com',
      role: 'STAFF',
      token: 'mock-jwt-staff-token-xyz',
    },
    {
      id: 'usr_customer',
      name: 'Demo Customer',
      email: 'user@subscriptiq.com',
      role: 'CUSTOMER',
      token: 'mock-jwt-customer-token-1',
    },
    {
      id: 'cust_1',
      name: 'Acro Industries (Rohan Gupta)',
      email: 'billing@acroindustries.com',
      role: 'CUSTOMER',
      token: 'mock-jwt-customer-token-1',
    },
    {
      id: 'cust_2',
      name: 'NovaTech Solutions (Elena Vance)',
      email: 'accounts@novatech.co',
      role: 'CUSTOMER',
      token: 'mock-jwt-customer-token-2',
    },
  ],

  products: [
    {
      id: 'prod_1',
      name: 'Brightloop Cloud Platform',
      type: 'SAAS',
      salesPrice: 5000.0,
      costPrice: 1800.0,
      notes: 'Core multi-tenant subscription infrastructure and data engine',
      active: true,
      variants: [
        { id: 'var_1', name: 'High-Performance Dedicated Compute', priceAdjustment: 560.0 },
        { id: 'var_2', name: 'Dedicated IP & 99.99% SLA', priceAdjustment: 1200.0 },
      ],
    },
    {
      id: 'prod_2',
      name: 'Enterprise API Gateway',
      type: 'SERVICE',
      salesPrice: 12000.0,
      costPrice: 4500.0,
      notes: 'High throughput managed API reverse proxy & rate limiter',
      active: true,
      variants: [
        { id: 'var_3', name: 'Global Multi-Region Failover', priceAdjustment: 3000.0 },
      ],
    },
    {
      id: 'prod_3',
      name: 'Audit & Compliance Engine',
      type: 'SAAS',
      salesPrice: 3500.0,
      costPrice: 900.0,
      notes: 'SOC2 & ISO 27001 automated compliance telemetry',
      active: true,
      variants: [],
    },
  ],

  plans: [
    {
      id: 'plan_1',
      name: 'Monthly Starter',
      price: 4999.0,
      interval: 'monthly',
      minimumQuantity: 1,
      availableFrom: '2026-01-01',
      availableTo: '2026-12-31',
      lifecycleRule: 'auto-renew',
    },
    {
      id: 'plan_2',
      name: 'Annual Scale',
      price: 49990.0,
      interval: 'yearly',
      minimumQuantity: 1,
      availableFrom: '2026-01-01',
      availableTo: '2026-12-31',
      lifecycleRule: 'auto-renew',
    },
    {
      id: 'plan_3',
      name: 'Enterprise Quarterly',
      price: 28000.0,
      interval: 'monthly',
      minimumQuantity: 3,
      availableFrom: '2026-01-01',
      availableTo: '2026-12-31',
      lifecycleRule: 'manual-renewal',
    },
    {
      id: 'plan_4',
      name: 'Evaluation Sandbox',
      price: 1500.0,
      interval: 'weekly',
      minimumQuantity: 1,
      availableFrom: '2026-01-01',
      availableTo: '2026-06-30',
      lifecycleRule: 'auto-close',
    },
  ],

  // Product-to-Plan compatibility map: productId -> array of planIds
  compatibility: {
    prod_1: ['plan_1', 'plan_2', 'plan_4'],
    prod_2: ['plan_2', 'plan_3'],
    prod_3: ['plan_1', 'plan_2', 'plan_3'],
  },

  subscriptions: [
    {
      id: 'sub_101',
      number: 'SUB-2026-001',
      customerId: 'cust_1',
      customerName: 'Acro Industries',
      customerEmail: 'billing@acroindustries.com',
      planId: 'plan_1',
      planName: 'Monthly Starter',
      status: 'ACTIVE',
      startDate: '2026-09-01',
      endDate: '2027-08-31',
      nextBillingDate: '2026-11-01',
      paymentTerms: 'NET_30',
      lines: [
        {
          id: 'sline_1',
          productId: 'prod_1',
          productName: 'Brightloop Cloud Platform',
          variantId: 'var_1',
          variantName: 'High-Performance Dedicated Compute',
          description: 'Brightloop Cloud Platform with Dedicated Compute',
          quantity: 2,
          unitPriceSnapshot: 5560.0, // Base 5000 + 560
          lineTotal: 11120.0,
        },
      ],
      agreedTotal: 11120.0,
    },
    {
      id: 'sub_102',
      number: 'SUB-2026-002',
      customerId: 'cust_2',
      customerName: 'NovaTech Solutions',
      customerEmail: 'accounts@novatech.co',
      planId: 'plan_3',
      planName: 'Enterprise Quarterly',
      status: 'CONFIRMED',
      startDate: '2026-10-15',
      endDate: '2027-10-14',
      nextBillingDate: '2026-11-15',
      paymentTerms: 'NET_15',
      lines: [
        {
          id: 'sline_2',
          productId: 'prod_2',
          productName: 'Enterprise API Gateway',
          variantId: 'var_3',
          variantName: 'Global Multi-Region Failover',
          description: 'Enterprise API Gateway with Multi-Region Failover',
          quantity: 3,
          unitPriceSnapshot: 15000.0,
          lineTotal: 45000.0,
        },
      ],
      agreedTotal: 45000.0,
    },
    {
      id: 'sub_103',
      number: 'SUB-2026-003',
      customerId: 'cust_1',
      customerName: 'Acro Industries',
      customerEmail: 'billing@acroindustries.com',
      planId: 'plan_2',
      planName: 'Annual Scale',
      status: 'PAUSED',
      startDate: '2026-05-01',
      endDate: '2027-04-30',
      nextBillingDate: '2026-12-01',
      paymentTerms: 'DUE_ON_RECEIPT',
      lines: [
        {
          id: 'sline_3',
          productId: 'prod_3',
          productName: 'Audit & Compliance Engine',
          variantId: null,
          variantName: null,
          description: 'Audit & Compliance Engine Standard',
          quantity: 1,
          unitPriceSnapshot: 49990.0,
          lineTotal: 49990.0,
        },
      ],
      agreedTotal: 49990.0,
    },
  ],

  invoices: [
    {
      id: 'inv_201',
      number: 'INV-2026-001',
      subscriptionId: 'sub_101',
      customerId: 'cust_1',
      customerName: 'Acro Industries',
      billingPeriodStart: '2026-10-01',
      billingPeriodEnd: '2026-10-31',
      issueDate: '2026-10-01',
      dueDate: '2026-10-31',
      subtotal: 11120.0,
      taxTotal: 2001.6,
      discountTotal: 0.0,
      total: 13121.6,
      amountPaid: 6000.0,
      outstandingBalance: 7121.6,
      status: 'PARTIALLY_PAID',
      lines: [
        {
          id: 'iline_1',
          product: 'Brightloop Cloud Platform (Dedicated Compute)',
          quantity: 2,
          unitPrice: 5560.0,
          taxRateSnapshot: 18.0,
          discountSnapshot: 0.0,
          lineTotal: 11120.0,
        },
      ],
    },
    {
      id: 'inv_202',
      number: 'INV-2026-002',
      subscriptionId: 'sub_101',
      customerId: 'cust_1',
      customerName: 'Acro Industries',
      billingPeriodStart: '2026-09-01',
      billingPeriodEnd: '2026-09-30',
      issueDate: '2026-09-01',
      dueDate: '2026-09-30',
      subtotal: 11120.0,
      taxTotal: 2001.6,
      discountTotal: 1000.0,
      total: 12121.6,
      amountPaid: 12121.6,
      outstandingBalance: 0.0,
      status: 'PAID',
      lines: [
        {
          id: 'iline_2',
          product: 'Brightloop Cloud Platform (Dedicated Compute)',
          quantity: 2,
          unitPrice: 5560.0,
          taxRateSnapshot: 18.0,
          discountSnapshot: 1000.0,
          lineTotal: 10120.0,
        },
      ],
    },
    {
      id: 'inv_203',
      number: 'INV-2026-003',
      subscriptionId: 'sub_102',
      customerId: 'cust_2',
      customerName: 'NovaTech Solutions',
      billingPeriodStart: '2026-10-15',
      billingPeriodEnd: '2026-11-14',
      issueDate: '2026-10-15',
      dueDate: '2026-10-25', // Past due date to demonstrate overdue recognition!
      subtotal: 45000.0,
      taxTotal: 8100.0,
      discountTotal: 4500.0,
      total: 48600.0,
      amountPaid: 0.0,
      outstandingBalance: 48600.0,
      status: 'CONFIRMED',
      lines: [
        {
          id: 'iline_3',
          product: 'Enterprise API Gateway (Multi-Region)',
          quantity: 3,
          unitPrice: 15000.0,
          taxRateSnapshot: 18.0,
          discountSnapshot: 4500.0,
          lineTotal: 40500.0,
        },
      ],
    },
  ],

  payments: [
    {
      id: 'pay_301',
      invoiceId: 'inv_201',
      invoiceNumber: 'INV-2026-001',
      amount: 6000.0,
      method: 'BANK_TRANSFER',
      paidAt: '2026-10-10 14:30:00',
      note: 'Partial wire transfer ref #HDFC98213',
    },
    {
      id: 'pay_302',
      invoiceId: 'inv_202',
      invoiceNumber: 'INV-2026-002',
      amount: 12121.6,
      method: 'CREDIT_CARD',
      paidAt: '2026-09-12 11:15:00',
      note: 'Full settlement via corporate card',
    },
  ],

  discountRules: [
    {
      id: 'disc_1',
      type: 'PERCENTAGE',
      value: 10.0,
      minPurchase: 10000.0,
      minQty: 1,
      startsAt: '2026-01-01',
      endsAt: '2026-12-31',
      maxUses: 50,
      usesCount: 12,
      scope: 'ALL',
      active: true,
    },
    {
      id: 'disc_2',
      type: 'FIXED',
      value: 1000.0,
      minPurchase: 5000.0,
      minQty: 1,
      startsAt: '2026-06-01',
      endsAt: '2026-11-30',
      maxUses: 100,
      usesCount: 88,
      scope: 'PRODUCT',
      active: true,
    },
    {
      id: 'disc_3',
      type: 'PERCENTAGE',
      value: 20.0,
      minPurchase: 25000.0,
      minQty: 2,
      startsAt: '2026-01-01',
      endsAt: '2026-03-31', // Expired
      maxUses: 20,
      usesCount: 20, // Exhausted
      scope: 'PLAN',
      active: false,
    },
  ],

  taxRules: [
    {
      id: 'tax_1',
      name: 'GST Standard (India)',
      rate: 18.0,
      active: true,
    },
    {
      id: 'tax_2',
      name: 'Zero-Rated International Export',
      rate: 0.0,
      active: true,
    },
    {
      id: 'tax_3',
      name: 'State IT Cess (Legacy)',
      rate: 2.5,
      active: false,
    },
  ],
};

export function getMockDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DATA));
      return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse mock DB from localStorage, resetting:', e);
    return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
  }
}

export function saveMockDb(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save mock DB:', e);
  }
}

export function resetMockDb() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DATA));
  return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
}
