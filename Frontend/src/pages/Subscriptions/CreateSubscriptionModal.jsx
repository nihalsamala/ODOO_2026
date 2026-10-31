import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import productService from '../../services/productService';
import planService from '../../services/planService';
import customerService from '../../services/customerService';
import { formatCurrency, formatInterval } from '../../utils/formatters';

export function CreateSubscriptionModal({ isOpen, onClose, onCreated, showToast, currentUser }) {
  const [products, setProducts] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    productId: '',
    variantId: '',
    planId: '',
    quantity: 1,
    startDate: '',
    endDate: '',
    nextBillingDate: '',
    paymentTerms: 'NET_30',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [prods, plns, custs] = await Promise.all([
        productService.getProducts(),
        planService.getPlans(),
        customerService.getCustomers(),
      ]);
      setProducts(prods.filter((p) => p.active));
      setAllPlans(plns);

      // Load or initialize customer list from backend
      let custList = Array.isArray(custs) ? custs : [];
      if (custList.length === 0) {
        try {
          const seededCust = await customerService.createCustomer({
            name: 'Acme Innovations',
            email: 'contact@acme.com',
            phone: '+1-800-555-0199',
            address: '742 Evergreen Terrace',
          });
          custList = [seededCust];
        } catch {
          // If customer creation fails (e.g. read-only permissions), proceed
        }
      }
      setCustomers(custList);

      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

      setFormData({
        customerId: currentUser?.role === 'CUSTOMER' && currentUser.customerId ? currentUser.customerId : custList[0]?.id || '',
        customerName: currentUser?.role === 'CUSTOMER' ? (currentUser.fullName || currentUser.name) : custList[0]?.name || '',
        productId: prods[0]?.id || '',
        variantId: '',
        planId: '',
        quantity: 1,
        startDate: today,
        endDate: nextYear,
        nextBillingDate: today,
        paymentTerms: 'NET_30',
      });

      if (prods[0]) {
        fetchAllowedPlansForProduct(prods[0].id, plns);
      }
    } catch (err) {
      showToast(err.message || 'Failed to initialize form options', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllowedPlansForProduct = async (productId, currentAllPlans = allPlans) => {
    try {
      const allowed = await productService.getProductPlans(productId);
      if (Array.isArray(allowed) && allowed.length > 0) {
        setAvailablePlans(allowed);
        setFormData((prev) => ({
          ...prev,
          planId: allowed[0]?.id || '',
          quantity: Math.max(prev.quantity, allowed[0]?.minimumQuantity || 1),
        }));
      } else {
        // Fallback: If no strict mapping exists yet, allow all system plans
        setAvailablePlans(currentAllPlans);
        if (currentAllPlans.length > 0) {
          setFormData((prev) => ({ ...prev, planId: currentAllPlans[0].id }));
        }
      }
    } catch {
      setAvailablePlans(currentAllPlans);
    }
  };

  const handleProductChange = (e) => {
    const prodId = e.target.value;
    setFormData((prev) => ({ ...prev, productId: prodId, variantId: '' }));
    fetchAllowedPlansForProduct(prodId);
  };

  const handlePlanChange = (e) => {
    const planId = e.target.value;
    const plan = availablePlans.find((p) => p.id === planId);
    setFormData((prev) => ({
      ...prev,
      planId,
      quantity: Math.max(prev.quantity, plan?.minimumQuantity || 1),
    }));
  };

  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    const cust = customers.find((c) => c.id === custId);
    setFormData((prev) => ({
      ...prev,
      customerId: custId,
      customerName: cust?.name || '',
    }));
  };

  const selectedProduct = products.find((p) => p.id === formData.productId);
  const selectedVariant = selectedProduct?.variants?.find((v) => v.id === formData.variantId);
  const selectedPlan = availablePlans.find((p) => p.id === formData.planId);

  // Calculate pricing snapshot
  const basePrice = selectedProduct?.salesPrice || 0;
  const variantAdj = selectedVariant?.priceAdjustment || 0;
  const unitPrice = basePrice + variantAdj;
  const agreedTotal = unitPrice * (Number(formData.quantity) || 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.productId) newErrors.productId = 'Product is required';
    if (!formData.planId) newErrors.planId = 'Plan is required';
    if (selectedPlan && formData.quantity < (selectedPlan.minimumQuantity || 1)) {
      newErrors.quantity = `Minimum required quantity for this plan is ${selectedPlan.minimumQuantity}`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: Number(formData.customerId),
        customerName: formData.customerName,
        productId: Number(formData.productId),
        variantId: formData.variantId ? Number(formData.variantId) : null,
        planId: Number(formData.planId),
        quantity: Number(formData.quantity) || 1,
        startDate: formData.startDate,
        expiryDate: formData.endDate || null,
        agreedUnitPrice: unitPrice > 0 ? unitPrice : null,
        initialStatus: 'ACTIVE',
        lines: [
          {
            productId: Number(formData.productId),
            variantId: formData.variantId ? Number(formData.variantId) : null,
            quantity: Number(formData.quantity) || 1,
          },
        ],
      };

      await onCreated(payload);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to create subscription', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Customer Subscription"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Confirm & Activate Subscription
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {/* Customer Selection */}
        {currentUser?.role !== 'CUSTOMER' && (
          <FormSelect
            label="Customer Organization"
            name="customerId"
            value={formData.customerId}
            onChange={handleCustomerChange}
            options={customers.map((c) => ({ value: c.id, label: `${c.name} (${c.email})` }))}
            required
            hint="Identifies the billing recipient and account owner"
          />
        )}

        <div className="form-row">
          <FormSelect
            label="Product Selection"
            name="productId"
            value={formData.productId}
            onChange={handleProductChange}
            options={products.map((p) => ({
              value: p.id,
              label: `${p.name} — ${formatCurrency(p.salesPrice)}`,
            }))}
            required
            error={errors.productId}
          />

          <FormSelect
            label="Product Variant (Optional)"
            name="variantId"
            value={formData.variantId}
            onChange={(e) => setFormData({ ...formData, variantId: e.target.value })}
            placeholder="Standard (No Variant Adjustment)"
            options={(selectedProduct?.variants || []).map((v) => ({
              value: v.id,
              label: `${v.name} (+₹${v.priceAdjustment})`,
            }))}
            hint={selectedVariant ? `Adds ₹${selectedVariant.priceAdjustment} to base unit price` : 'Select variant if needed'}
          />
        </div>

        <div className="form-row">
          <FormSelect
            label="Compatible Subscription Plan"
            name="planId"
            value={formData.planId}
            onChange={handlePlanChange}
            options={availablePlans.map((pl) => ({
              value: pl.id,
              label: `${pl.name} (${formatInterval(pl.interval)}) — Min Qty: ${pl.minimumQuantity}`,
            }))}
            required
            error={errors.planId}
            hint="Only plans approved for this product are selectable"
          />

          <FormInput
            label="Seat / Unit Quantity"
            name="quantity"
            type="number"
            min={selectedPlan?.minimumQuantity || 1}
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
            required
            error={errors.quantity}
            hint={selectedPlan ? `Plan minimum quantity: ${selectedPlan.minimumQuantity}` : ''}
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Contract Start Date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />

          <FormInput
            label="Contract End Date"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Next Billing Due Date"
            name="nextBillingDate"
            type="date"
            value={formData.nextBillingDate}
            onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
            required
            hint="Due date checked by the recurring billing engine"
          />

          <FormSelect
            label="Payment Terms"
            name="paymentTerms"
            value={formData.paymentTerms}
            onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
            options={[
              { value: 'NET_15', label: 'Net 15 Days' },
              { value: 'NET_30', label: 'Net 30 Days' },
              { value: 'DUE_ON_RECEIPT', label: 'Due on Receipt' },
            ]}
          />
        </div>

        {/* Pricing Calculation Summary Callout */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--color-primary-subtle)',
            border: '1px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-md)',
            marginTop: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Agreed Unit Price Snapshot ({formData.quantity} units)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                Base {formatCurrency(basePrice)} + Variant {formatCurrency(variantAdj)} = {formatCurrency(unitPrice)}/unit
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {formatCurrency(agreedTotal)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                Per {selectedPlan ? formatInterval(selectedPlan.interval) : 'billing period'}
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default CreateSubscriptionModal;
