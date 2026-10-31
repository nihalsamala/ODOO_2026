import React, { useState } from 'react';
import { ShieldCheck, ShoppingCart } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import { formatCurrency, formatInterval } from '../../utils/formatters';
import subscriptionService from '../../services/subscriptionService';
import { useToast } from '../../context/ToastContext';

export function SubscribeModal({ isOpen, onClose, product, plan, onSuccess }) {
  const { showToast } = useToast();
  const minQty = plan?.planDetails?.minimumQuantity ?? plan?.minimumQuantity ?? 1;

  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(minQty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !product || !plan) return null;

  const activeVariants = product.activeVariants || (product.variants || []).filter((v) => v.active);
  const selectedVariant = activeVariants.find((v) => String(v.id) === String(selectedVariantId));

  // Pricing calculation according to trusted backend catalog formula:
  // product sales price + variant adjustment + plan price
  const basePrice = Number(product.salesPrice) || 0;
  const planPrice = Number(plan.price ?? plan.planDetails?.price) || 0;
  const variantAdj = selectedVariant?.priceAdjustment ? Number(selectedVariant.priceAdjustment) : 0;
  const estimatedUnitPrice = basePrice + variantAdj + planPrice;
  const estimatedSubtotal = estimatedUnitPrice * (Number(quantity) || 1);

  const handleQuantityChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      setQuantity(1);
      setError(`Minimum required quantity is ${minQty}`);
    } else {
      setQuantity(val);
      if (val < minQty) {
        setError(`Minimum required quantity for this plan is ${minQty}`);
      } else {
        setError('');
      }
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (quantity < minQty) {
      setError(`Minimum required quantity is ${minQty}`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Strictly send only authorized customer purchase fields.
      // Do NOT send customerId, agreedUnitPrice, initialStatus, startDate, or expiryDate.
      const payload = {
        productId: Number(product.id),
        planId: Number(plan.planId || plan.id),
        variantId: selectedVariantId ? Number(selectedVariantId) : null,
        quantity: Number(quantity),
      };

      const result = await subscriptionService.purchaseSubscription(payload);
      showToast(
        `Subscription ${result.subscriptionNumber || ''} confirmed! An initial invoice has been generated for payment.`,
        'success'
      );
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to complete subscription purchase.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? undefined : onClose}
      title={`Subscribe to ${product.name}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={ShoppingCart}
            onClick={handleConfirm}
            loading={submitting}
            disabled={submitting || Boolean(error)}
          >
            Confirm Subscription
          </Button>
        </>
      }
    >
      <form onSubmit={handleConfirm}>
        {/* Selected Plan Summary Banner */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border-subtle)',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Selected Product & Plan
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-main)', marginTop: '2px' }}>
              {product.name} — {plan.name}
            </div>
          </div>
          <Badge variant="info">
            {formatInterval(plan.billingInterval || plan.interval)}
          </Badge>
        </div>

        {/* Variant Selection (if product has active variants) */}
        {activeVariants.length > 0 && (
          <FormSelect
            label="Product Variant (Optional)"
            name="variantId"
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            disabled={submitting}
            placeholder="Standard (No Variant Adjustment)"
            options={activeVariants.map((v) => ({
              value: v.id,
              label: `${v.name} (+${formatCurrency(v.priceAdjustment)})`,
            }))}
            hint={selectedVariant ? `Adds ${formatCurrency(selectedVariant.priceAdjustment)} to unit price` : 'Select an optional variant'}
          />
        )}

        {/* Quantity Input */}
        <FormInput
          label="Subscription Quantity (Seats / Units)"
          name="quantity"
          type="number"
          min={minQty}
          value={quantity}
          onChange={handleQuantityChange}
          disabled={submitting}
          required
          error={error}
          hint={minQty > 1 ? `Minimum required quantity for this plan: ${minQty}` : undefined}
        />

        {/* Pricing Calculation Snapshot Callout */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--color-primary-subtle)',
            border: '1px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-md)',
            marginTop: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                Estimated Price ({quantity} {quantity === 1 ? 'unit' : 'units'})
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Base {formatCurrency(basePrice)} + Plan {formatCurrency(planPrice)}
                {selectedVariant ? ` + Variant ${formatCurrency(variantAdj)}` : ''} = {formatCurrency(estimatedUnitPrice)}/unit
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {formatCurrency(estimatedSubtotal)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                Per {formatInterval(plan.billingInterval || plan.interval)}
              </div>
            </div>
          </div>
        </div>

        {/* Compliance and Order Notice */}
        <div
          style={{
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border-subtle)',
            fontSize: '0.775rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: 'var(--color-text-main)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={15} color="var(--color-primary)" />
            Order Confirmation & Invoicing Notice
          </div>
          Submitting creates a <strong>CONFIRMED</strong> subscription and automatically generates your initial invoice. The unit price is authoritatively verified and snapshotted by the backend catalog. Payment is recorded separately against your invoice.
        </div>
      </form>
    </Modal>
  );
}

export default SubscribeModal;
