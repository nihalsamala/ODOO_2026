import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';

export function CreateDiscountRuleModal({ isOpen, onClose, onCreated, showToast }) {
  const today = new Date().toISOString().split('T')[0];
  const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    type: 'PERCENTAGE',
    value: '',
    minPurchase: '5000',
    minQty: '1',
    startsAt: today,
    endsAt: nextYear,
    maxUses: '50',
    scope: 'ALL',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.value || Number(formData.value) <= 0) {
      newErrors.value = 'Discount value must be greater than 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onCreated({
        ...formData,
        value: Number(formData.value),
        minPurchase: Number(formData.minPurchase) || 0,
        minQty: Number(formData.minQty) || 1,
        maxUses: Number(formData.maxUses) || 100,
      });
      showToast('Discount rule created successfully.', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to create discount rule', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Discount Rule"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Create Discount Rule
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <FormSelect
            label="Discount Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={[
              { value: 'PERCENTAGE', label: 'Percentage (%)' },
              { value: 'FIXED', label: 'Fixed Amount (₹)' },
            ]}
          />

          <FormInput
            label={formData.type === 'PERCENTAGE' ? 'Discount Value (%)' : 'Discount Amount (₹)'}
            name="value"
            type="number"
            step="0.01"
            value={formData.value}
            onChange={handleChange}
            placeholder={formData.type === 'PERCENTAGE' ? '10' : '1000'}
            required
            error={errors.value}
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Minimum Purchase (₹)"
            name="minPurchase"
            type="number"
            value={formData.minPurchase}
            onChange={handleChange}
            hint="Threshold order total required"
          />

          <FormInput
            label="Minimum Unit Quantity"
            name="minQty"
            type="number"
            value={formData.minQty}
            onChange={handleChange}
            hint="Minimum units required"
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Starts At"
            name="startsAt"
            type="date"
            value={formData.startsAt}
            onChange={handleChange}
            required
          />

          <FormInput
            label="Ends At (Expiration)"
            name="endsAt"
            type="date"
            value={formData.endsAt}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Maximum Redemptions"
            name="maxUses"
            type="number"
            value={formData.maxUses}
            onChange={handleChange}
            hint="Total usage limit across all accounts"
          />

          <FormSelect
            label="Applicable Scope"
            name="scope"
            value={formData.scope}
            onChange={handleChange}
            options={[
              { value: 'ALL', label: 'All Subscriptions & Products' },
              { value: 'PRODUCT', label: 'Product Level Only' },
              { value: 'PLAN', label: 'Plan Level Only' },
            ]}
          />
        </div>
      </form>
    </Modal>
  );
}

export default CreateDiscountRuleModal;
