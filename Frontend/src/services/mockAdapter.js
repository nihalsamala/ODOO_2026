/**
 * SubscriptIQ Mock API Adapter
 * Simulates the exact Java Spring Boot REST API contract when running in mock mode.
 * Can be completely toggled off via VITE_USE_MOCK=false or UI toggle for live backend connection.
 */

import { getMockDb, saveMockDb } from './mockData';

// Delay helper to mimic network latency
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export async function handleMockRequest(config) {
  await delay(120);

  const { method, url, data: rawData, params } = config;
  const db = getMockDb();
  const parsedData = typeof rawData === 'string' ? JSON.parse(rawData || '{}') : (rawData || {});

  // Clean url to remove baseUrl and query parameters
  const cleanUrl = url.split('?')[0].replace(/^\/api/, '/api');

  // Retrieve current user from localStorage for role/customer checks
  let currentUser = null;
  try {
    const rawUser = localStorage.getItem('subscriptiq_user');
    if (rawUser) currentUser = JSON.parse(rawUser);
  } catch (e) {
    currentUser = null;
  }

  // -------------------------------------------------------------
  // 1. AUTH
  // -------------------------------------------------------------
  if (cleanUrl === '/api/auth/login' && method.toLowerCase() === 'post') {
    const { email, password } = parsedData;
    const user = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase().trim());
    if (user) {
      return {
        status: 200,
        data: {
          token: user.token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      };
    }
    // Demo fallback: default to staff if unknown or return 401
    const err = new Error('Invalid email or password');
    err.response = { status: 401, data: { message: 'Invalid credentials. Use demo accounts or register.' } };
    throw err;
  }

  if (cleanUrl === '/api/auth/register' && method.toLowerCase() === 'post') {
    const { name, email, role } = parsedData;
    const existing = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
    if (existing) {
      const err = new Error('Email already registered');
      err.response = { status: 400, data: { message: 'Email already exists in system' } };
      throw err;
    }
    const newUser = {
      id: `usr_${Date.now()}`,
      name: name || 'Demo User',
      email: email,
      role: role || 'CUSTOMER',
      token: `mock-jwt-${Date.now()}`,
    };
    db.users.push(newUser);
    saveMockDb(db);
    return {
      status: 201,
      data: {
        token: newUser.token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      },
    };
  }

  // -------------------------------------------------------------
  // 2. PRODUCTS
  // -------------------------------------------------------------
  if (cleanUrl === '/api/products' && method.toLowerCase() === 'get') {
    return { status: 200, data: db.products };
  }

  if (cleanUrl === '/api/products' && method.toLowerCase() === 'post') {
    const newProduct = {
      id: `prod_${Date.now()}`,
      name: parsedData.name || 'Untitled Product',
      type: parsedData.type || 'SAAS',
      salesPrice: Number(parsedData.salesPrice) || 0,
      costPrice: Number(parsedData.costPrice) || 0,
      notes: parsedData.notes || '',
      active: parsedData.active !== undefined ? parsedData.active : true,
      variants: Array.isArray(parsedData.variants) ? parsedData.variants : [],
    };
    db.products.unshift(newProduct);
    // Initialize empty compatibility
    db.compatibility[newProduct.id] = [];
    saveMockDb(db);
    return { status: 201, data: newProduct };
  }

  const productMatch = cleanUrl.match(/^\/api\/products\/([^\/]+)$/);
  if (productMatch) {
    const prodId = productMatch[1];
    const index = db.products.findIndex((p) => p.id === prodId);

    if (method.toLowerCase() === 'get') {
      if (index === -1) {
        const err = new Error('Product not found');
        err.response = { status: 404, data: { message: `Product ${prodId} not found` } };
        throw err;
      }
      return { status: 200, data: db.products[index] };
    }

    if (method.toLowerCase() === 'put') {
      if (index === -1) {
        const err = new Error('Product not found');
        err.response = { status: 404, data: { message: `Product ${prodId} not found` } };
        throw err;
      }
      db.products[index] = {
        ...db.products[index],
        ...parsedData,
        salesPrice: Number(parsedData.salesPrice ?? db.products[index].salesPrice),
        costPrice: Number(parsedData.costPrice ?? db.products[index].costPrice),
      };
      saveMockDb(db);
      return { status: 200, data: db.products[index] };
    }
  }

  // -------------------------------------------------------------
  // 3. PRODUCT-PLAN COMPATIBILITY
  // -------------------------------------------------------------
  const compatMatch = cleanUrl.match(/^\/api\/products\/([^\/]+)\/plans$/);
  if (compatMatch) {
    const prodId = compatMatch[1];
    if (method.toLowerCase() === 'get') {
      const allowedPlanIds = db.compatibility[prodId] || [];
      const plans = db.plans.filter((p) => allowedPlanIds.includes(p.id));
      return { status: 200, data: plans };
    }
    if (method.toLowerCase() === 'put') {
      // payload could be { planIds: [...] } or array [...]
      const planIds = Array.isArray(parsedData) ? parsedData : (parsedData.planIds || []);
      db.compatibility[prodId] = planIds;
      saveMockDb(db);
      const plans = db.plans.filter((p) => planIds.includes(p.id));
      return { status: 200, data: plans };
    }
  }

  // -------------------------------------------------------------
  // 4. PLANS
  // -------------------------------------------------------------
  if (cleanUrl === '/api/plans' && method.toLowerCase() === 'get') {
    return { status: 200, data: db.plans };
  }

  if (cleanUrl === '/api/plans' && method.toLowerCase() === 'post') {
    const newPlan = {
      id: `plan_${Date.now()}`,
      name: parsedData.name || 'New Plan',
      price: Number(parsedData.price) || 0,
      interval: parsedData.interval || 'monthly',
      minimumQuantity: Number(parsedData.minimumQuantity) || 1,
      availableFrom: parsedData.availableFrom || new Date().toISOString().split('T')[0],
      availableTo: parsedData.availableTo || '2027-12-31',
      lifecycleRule: parsedData.lifecycleRule || 'auto-renew',
    };
    db.plans.unshift(newPlan);
    saveMockDb(db);
    return { status: 201, data: newPlan };
  }

  const planMatch = cleanUrl.match(/^\/api\/plans\/([^\/]+)$/);
  if (planMatch) {
    const planId = planMatch[1];
    const index = db.plans.findIndex((p) => p.id === planId);
    if (method.toLowerCase() === 'get') {
      if (index === -1) {
        const err = new Error('Plan not found');
        err.response = { status: 404, data: { message: `Plan ${planId} not found` } };
        throw err;
      }
      return { status: 200, data: db.plans[index] };
    }
    if (method.toLowerCase() === 'put') {
      if (index === -1) {
        const err = new Error('Plan not found');
        err.response = { status: 404, data: { message: `Plan ${planId} not found` } };
        throw err;
      }
      db.plans[index] = {
        ...db.plans[index],
        ...parsedData,
        price: Number(parsedData.price ?? db.plans[index].price),
        minimumQuantity: Number(parsedData.minimumQuantity ?? db.plans[index].minimumQuantity),
      };
      saveMockDb(db);
      return { status: 200, data: db.plans[index] };
    }
  }

  // -------------------------------------------------------------
  // 5. SUBSCRIPTIONS
  // -------------------------------------------------------------
  if (cleanUrl === '/api/subscriptions' && method.toLowerCase() === 'get') {
    let list = [...db.subscriptions];
    // Enforce customer ownership isolation
    if (currentUser && currentUser.role === 'CUSTOMER') {
      list = list.filter((s) => s.customerId === currentUser.id);
    }
    return { status: 200, data: list };
  }

  if (cleanUrl === '/api/subscriptions' && method.toLowerCase() === 'post') {
    const plan = db.plans.find((p) => p.id === parsedData.planId);
    const subNumber = `SUB-${new Date().getFullYear()}-${String(db.subscriptions.length + 1).padStart(3, '0')}`;
    
    // Calculate lines snapshot
    const lines = (parsedData.lines || []).map((l, i) => {
      const prod = db.products.find((p) => p.id === l.productId);
      const variant = prod?.variants?.find((v) => v.id === l.variantId);
      const unitPrice = (prod?.salesPrice || 0) + (variant?.priceAdjustment || 0);
      const qty = Number(l.quantity) || 1;
      return {
        id: `sline_${Date.now()}_${i}`,
        productId: l.productId,
        productName: prod?.name || 'Product',
        variantId: l.variantId || null,
        variantName: variant?.name || null,
        description: `${prod?.name || 'Product'}${variant ? ` (${variant.name})` : ''}`,
        quantity: qty,
        unitPriceSnapshot: unitPrice,
        lineTotal: unitPrice * qty,
      };
    });

    const agreedTotal = lines.reduce((acc, l) => acc + l.lineTotal, 0);

    const newSub = {
      id: `sub_${Date.now()}`,
      number: subNumber,
      customerId: parsedData.customerId || currentUser?.id || 'cust_1',
      customerName: parsedData.customerName || (currentUser?.name || 'Customer Organization'),
      customerEmail: parsedData.customerEmail || currentUser?.email || 'customer@subscriptiq.io',
      planId: parsedData.planId,
      planName: plan?.name || 'Standard Plan',
      status: parsedData.status || 'CONFIRMED',
      startDate: parsedData.startDate || new Date().toISOString().split('T')[0],
      endDate: parsedData.endDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      nextBillingDate: parsedData.nextBillingDate || new Date().toISOString().split('T')[0],
      paymentTerms: parsedData.paymentTerms || 'NET_30',
      lines: lines,
      agreedTotal: agreedTotal,
    };

    db.subscriptions.unshift(newSub);
    saveMockDb(db);
    return { status: 201, data: newSub };
  }

  // Lifecycle actions
  const pauseMatch = cleanUrl.match(/^\/api\/subscriptions\/([^\/]+)\/pause$/);
  if (pauseMatch && method.toLowerCase() === 'post') {
    const subId = pauseMatch[1];
    const sub = db.subscriptions.find((s) => s.id === subId);
    if (!sub) throw new Error('Subscription not found');
    sub.status = 'PAUSED';
    saveMockDb(db);
    return { status: 200, data: sub };
  }

  const resumeMatch = cleanUrl.match(/^\/api\/subscriptions\/([^\/]+)\/resume$/);
  if (resumeMatch && method.toLowerCase() === 'post') {
    const subId = resumeMatch[1];
    const sub = db.subscriptions.find((s) => s.id === subId);
    if (!sub) throw new Error('Subscription not found');
    sub.status = 'ACTIVE';
    // Shift next billing date by 14 days for demo
    const d = new Date(sub.nextBillingDate);
    d.setDate(d.getDate() + 14);
    sub.nextBillingDate = d.toISOString().split('T')[0];
    saveMockDb(db);
    return { status: 200, data: sub };
  }

  const closeMatch = cleanUrl.match(/^\/api\/subscriptions\/([^\/]+)\/close$/);
  if (closeMatch && method.toLowerCase() === 'post') {
    const subId = closeMatch[1];
    const sub = db.subscriptions.find((s) => s.id === subId);
    if (!sub) throw new Error('Subscription not found');
    sub.status = 'CLOSED';
    saveMockDb(db);
    return { status: 200, data: sub };
  }

  const renewMatch = cleanUrl.match(/^\/api\/subscriptions\/([^\/]+)\/renew$/);
  if (renewMatch && method.toLowerCase() === 'post') {
    const subId = renewMatch[1];
    const sub = db.subscriptions.find((s) => s.id === subId);
    if (!sub) throw new Error('Subscription not found');
    const end = new Date(sub.endDate);
    end.setFullYear(end.getFullYear() + 1);
    sub.endDate = end.toISOString().split('T')[0];
    sub.status = 'ACTIVE';
    saveMockDb(db);
    return { status: 200, data: sub };
  }

  const singleSubMatch = cleanUrl.match(/^\/api\/subscriptions\/([^\/]+)$/);
  if (singleSubMatch && method.toLowerCase() === 'get') {
    const subId = singleSubMatch[1];
    const sub = db.subscriptions.find((s) => s.id === subId);
    if (!sub) {
      const err = new Error('Subscription not found');
      err.response = { status: 404, data: { message: 'Subscription not found' } };
      throw err;
    }
    // Customer isolation check
    if (currentUser && currentUser.role === 'CUSTOMER' && sub.customerId !== currentUser.id) {
      const err = new Error('Unauthorized');
      err.response = { status: 403, data: { message: 'Access denied to this subscription' } };
      throw err;
    }
    return { status: 200, data: sub };
  }

  // -------------------------------------------------------------
  // 6. BILLING RUN & INVOICES
  // -------------------------------------------------------------
  if (cleanUrl === '/api/billing/run' && method.toLowerCase() === 'post') {
    // Check due active subscriptions
    const today = new Date().toISOString().split('T')[0];
    let createdCount = 0;
    let duplicateSkipped = 0;

    const dueSubs = db.subscriptions.filter(
      (s) => (s.status === 'ACTIVE' || s.status === 'CONFIRMED') && s.nextBillingDate <= today
    );

    dueSubs.forEach((sub) => {
      const billingPeriodStart = sub.nextBillingDate;
      const periodEndObj = new Date(billingPeriodStart);
      periodEndObj.setMonth(periodEndObj.getMonth() + 1);
      const billingPeriodEnd = periodEndObj.toISOString().split('T')[0];

      // Check unique (subscriptionId, billingPeriodStart) duplicate guard
      const existing = db.invoices.find(
        (inv) => inv.subscriptionId === sub.id && inv.billingPeriodStart === billingPeriodStart
      );

      if (existing) {
        duplicateSkipped++;
        return;
      }

      // Calculate invoice totals with tax (18%) and discount if eligible
      const subtotal = sub.agreedTotal || 5000;
      const taxRate = 18.0;
      const taxTotal = Number((subtotal * 0.18).toFixed(2));
      const discountTotal = 0.0;
      const total = Number((subtotal + taxTotal - discountTotal).toFixed(2));

      const newInv = {
        id: `inv_${Date.now()}_${createdCount + 1}`,
        number: `INV-${new Date().getFullYear()}-${String(db.invoices.length + 1).padStart(3, '0')}`,
        subscriptionId: sub.id,
        customerId: sub.customerId,
        customerName: sub.customerName,
        billingPeriodStart: billingPeriodStart,
        billingPeriodEnd: billingPeriodEnd,
        issueDate: today,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        subtotal: subtotal,
        taxTotal: taxTotal,
        discountTotal: discountTotal,
        total: total,
        amountPaid: 0.0,
        outstandingBalance: total,
        status: 'CONFIRMED',
        lines: (sub.lines || []).map((sl, i) => ({
          id: `iline_${Date.now()}_${i}`,
          product: sl.description,
          quantity: sl.quantity,
          unitPrice: sl.unitPriceSnapshot,
          taxRateSnapshot: taxRate,
          discountSnapshot: 0.0,
          lineTotal: sl.lineTotal,
        })),
      };

      db.invoices.unshift(newInv);
      createdCount++;

      // Advance next billing date
      sub.nextBillingDate = billingPeriodEnd;
      if (sub.status === 'CONFIRMED') sub.status = 'ACTIVE';
    });

    saveMockDb(db);
    return {
      status: 200,
      data: {
        success: true,
        message: `Billing run completed: ${createdCount} new invoices generated, ${duplicateSkipped} duplicates skipped (duplicate guard active).`,
        invoicesGenerated: createdCount,
        duplicatesPrevented: duplicateSkipped,
      },
    };
  }

  if (cleanUrl === '/api/invoices' && method.toLowerCase() === 'get') {
    let list = [...db.invoices];
    if (currentUser && currentUser.role === 'CUSTOMER') {
      list = list.filter((inv) => inv.customerId === currentUser.id);
    }
    return { status: 200, data: list };
  }

  const confirmInvoiceMatch = cleanUrl.match(/^\/api\/invoices\/([^\/]+)\/confirm$/);
  if (confirmInvoiceMatch && method.toLowerCase() === 'post') {
    const invId = confirmInvoiceMatch[1];
    const inv = db.invoices.find((i) => i.id === invId);
    if (!inv) throw new Error('Invoice not found');
    if (inv.status === 'DRAFT') {
      inv.status = 'CONFIRMED';
    }
    saveMockDb(db);
    return { status: 200, data: inv };
  }

  const singleInvoiceMatch = cleanUrl.match(/^\/api\/invoices\/([^\/]+)$/);
  if (singleInvoiceMatch && method.toLowerCase() === 'get') {
    const invId = singleInvoiceMatch[1];
    const inv = db.invoices.find((i) => i.id === invId);
    if (!inv) {
      const err = new Error('Invoice not found');
      err.response = { status: 404, data: { message: 'Invoice not found' } };
      throw err;
    }
    if (currentUser && currentUser.role === 'CUSTOMER' && inv.customerId !== currentUser.id) {
      const err = new Error('Unauthorized');
      err.response = { status: 403, data: { message: 'Access denied to this invoice' } };
      throw err;
    }
    return { status: 200, data: inv };
  }

  // -------------------------------------------------------------
  // 7. PAYMENTS
  // -------------------------------------------------------------
  const paymentsMatch = cleanUrl.match(/^\/api\/invoices\/([^\/]+)\/payments$/);
  if (paymentsMatch) {
    const invId = paymentsMatch[1];
    const inv = db.invoices.find((i) => i.id === invId);

    if (method.toLowerCase() === 'get') {
      const list = db.payments.filter((p) => p.invoiceId === invId);
      return { status: 200, data: list };
    }

    if (method.toLowerCase() === 'post') {
      if (!inv) {
        const err = new Error('Invoice not found');
        err.response = { status: 404, data: { message: 'Invoice not found' } };
        throw err;
      }

      const paymentAmount = Number(parsedData.amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        const err = new Error('Invalid payment amount');
        err.response = { status: 400, data: { message: 'Payment amount must be greater than 0' } };
        throw err;
      }

      if (paymentAmount > inv.outstandingBalance + 0.01) {
        const err = new Error('Amount exceeds balance');
        err.response = {
          status: 400,
          data: {
            message: `Payment amount (${paymentAmount}) cannot exceed outstanding balance (${inv.outstandingBalance})`,
          },
        };
        throw err;
      }

      const newPayment = {
        id: `pay_${Date.now()}`,
        invoiceId: inv.id,
        invoiceNumber: inv.number,
        amount: paymentAmount,
        method: parsedData.method || 'BANK_TRANSFER',
        paidAt: parsedData.paidAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
        note: parsedData.note || '',
      };

      db.payments.unshift(newPayment);

      // Recalculate invoice paid amount and outstanding balance
      inv.amountPaid = Number((inv.amountPaid + paymentAmount).toFixed(2));
      inv.outstandingBalance = Number((inv.total - inv.amountPaid).toFixed(2));
      if (inv.outstandingBalance <= 0) {
        inv.outstandingBalance = 0.0;
        inv.status = 'PAID';
      } else {
        inv.status = 'PARTIALLY_PAID';
      }

      saveMockDb(db);
      return { status: 201, data: { payment: newPayment, updatedInvoice: inv } };
    }
  }

  // -------------------------------------------------------------
  // 8. DISCOUNT RULES
  // -------------------------------------------------------------
  if (cleanUrl === '/api/discount-rules' && method.toLowerCase() === 'get') {
    return { status: 200, data: db.discountRules };
  }

  if (cleanUrl === '/api/discount-rules' && method.toLowerCase() === 'post') {
    const newRule = {
      id: `disc_${Date.now()}`,
      type: parsedData.type || 'PERCENTAGE',
      value: Number(parsedData.value) || 0,
      minPurchase: Number(parsedData.minPurchase) || 0,
      minQty: Number(parsedData.minQty) || 1,
      startsAt: parsedData.startsAt || new Date().toISOString().split('T')[0],
      endsAt: parsedData.endsAt || '2027-12-31',
      maxUses: Number(parsedData.maxUses) || 100,
      usesCount: 0,
      scope: parsedData.scope || 'ALL',
      active: true,
    };
    db.discountRules.unshift(newRule);
    saveMockDb(db);
    return { status: 201, data: newRule };
  }

  // -------------------------------------------------------------
  // 9. TAX RULES
  // -------------------------------------------------------------
  if (cleanUrl === '/api/tax-rules' && method.toLowerCase() === 'get') {
    return { status: 200, data: db.taxRules };
  }

  if (cleanUrl === '/api/tax-rules' && method.toLowerCase() === 'post') {
    const newTax = {
      id: `tax_${Date.now()}`,
      name: parsedData.name || 'Custom Tax',
      rate: Number(parsedData.rate) || 0,
      active: parsedData.active !== undefined ? parsedData.active : true,
    };
    db.taxRules.unshift(newTax);
    saveMockDb(db);
    return { status: 201, data: newTax };
  }

  // -------------------------------------------------------------
  // 10. DASHBOARD SUMMARY
  // -------------------------------------------------------------
  if (cleanUrl === '/api/dashboard/summary' && method.toLowerCase() === 'get') {
    const today = new Date().toISOString().split('T')[0];

    // Compute metrics dynamically from current state
    let relevantInvoices = [...db.invoices];
    let relevantSubs = [...db.subscriptions];
    let relevantPayments = [...db.payments];

    if (currentUser && currentUser.role === 'CUSTOMER') {
      relevantInvoices = relevantInvoices.filter((i) => i.customerId === currentUser.id);
      relevantSubs = relevantSubs.filter((s) => s.customerId === currentUser.id);
      const userInvIds = new Set(relevantInvoices.map((i) => i.id));
      relevantPayments = relevantPayments.filter((p) => userInvIds.has(p.invoiceId));
    }

    const activeCount = relevantSubs.filter((s) => s.status === 'ACTIVE' || s.status === 'CONFIRMED').length;
    const totalPaymentsReceived = relevantPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const totalOutstanding = relevantInvoices.reduce((acc, i) => acc + (Number(i.outstandingBalance) || 0), 0);
    const overdueCount = relevantInvoices.filter(
      (i) => i.dueDate < today && i.outstandingBalance > 0 && i.status !== 'CANCELLED'
    ).length;

    // Monthly breakdown for visual charts
    const monthlyOverview = [
      { month: 'Jun', billed: 32000, collected: 32000, outstanding: 0 },
      { month: 'Jul', billed: 48000, collected: 45000, outstanding: 3000 },
      { month: 'Aug', billed: 56000, collected: 52000, outstanding: 4000 },
      { month: 'Sep', billed: 64000, collected: 60000, outstanding: 4000 },
      { month: 'Oct', billed: 73843, collected: 18121, outstanding: 55721 },
    ];

    const subscriptionsByStatus = {
      ACTIVE: relevantSubs.filter((s) => s.status === 'ACTIVE').length,
      CONFIRMED: relevantSubs.filter((s) => s.status === 'CONFIRMED').length,
      PAUSED: relevantSubs.filter((s) => s.status === 'PAUSED').length,
      CLOSED: relevantSubs.filter((s) => s.status === 'CLOSED').length,
      DRAFT: relevantSubs.filter((s) => s.status === 'DRAFT').length,
      QUOTATION: relevantSubs.filter((s) => s.status === 'QUOTATION').length,
    };

    return {
      status: 200,
      data: {
        activeSubscriptions: activeCount,
        paymentsReceived: totalPaymentsReceived,
        outstandingBalance: totalOutstanding,
        overdueInvoices: overdueCount,
        monthlyOverview: monthlyOverview,
        subscriptionsByStatus: subscriptionsByStatus,
        recentInvoices: relevantInvoices.slice(0, 5),
        recentSubscriptions: relevantSubs.slice(0, 5),
      },
    };
  }

  // Fallback 404 for unhandled mock endpoint
  const unhandledErr = new Error(`Mock endpoint not implemented: ${method.toUpperCase()} ${cleanUrl}`);
  unhandledErr.response = { status: 404, data: { message: `Endpoint not found: ${cleanUrl}` } };
  throw unhandledErr;
}
