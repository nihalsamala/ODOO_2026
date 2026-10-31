import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';

export function PlanModal({ isOpen, onClose, onSave, plan = null, loading = false }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    interval: 'monthly',
    minimumQuantity: 1,
    availableFrom: '',
    availableTo: '',
    lifecycleRule: 'auto-renew',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        price: plan.price !== undefined ? String(plan.price) : '',
        interval: plan.interval || 'monthly',
        minimumQuantity: plan.minimumQuantity || 1,
        availableFrom: plan.availableFrom || '',
        availableTo: plan.availableTo || '',
        lifecycleRule: plan.lifecycleRule || 'auto-renew',
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        name: '',
        price: '',
        interval: 'monthly',
        minimumQuantity: 1,
        availableFrom: today,
        availableTo: '2027-12-31',
        lifecycleRule: 'auto-renew',
      });
    }
    setErrors({});
  }, [plan, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Plan name is required';
    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    if (!formData.availableFrom) newErrors.availableFrom = 'Start date required';
    if (!formData.availableTo) newErrors.availableTo = 'End date required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...formData,
      price: Number(formData.price),
      minimumQuantity: Number(formData.minimumQuantity) || 1,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={plan ? 'Edit Subscription Plan' : 'Create New Plan'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {plan ? 'Save Changes' : 'Create Plan'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Plan Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Monthly Starter / Enterprise Scale"
          required
          error={errors.name}
        />

        <div className="form-row">
          <FormInput
            label="Plan Price (₹)"
            name="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
            placeholder="4999.00"
            required
            error={errors.price}
          />

          <FormSelect
            label="Billing Interval"
            name="interval"
            value={formData.interval}
            onChange={handleChange}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Minimum Quantity"
            name="minimumQuantity"
            type="number"
            min="1"
            value={formData.minimumQuantity}
            onChange={handleChange}
            required
            hint="Minimum licenses or seats required for this plan"
          />

          <FormSelect
            label="Lifecycle Rule"
            name="lifecycleRule"
            value={formData.lifecycleRule}
            onChange={handleChange}
            options={[
              { value: 'auto-renew', label: 'Auto-Renew (Extends cycle)' },
              { value: 'auto-close', label: 'Auto-Close (Terminates on end)' },
              { value: 'manual-renewal', label: 'Manual Renewal (Requires action)' },
            ]}
            hint="Governs policy upon subscription expiration"
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Available From"
            name="availableFrom"
            type="date"
            value={formData.availableFrom}
            onChange={handleChange}
            required
            error={errors.availableFrom}
          />

          <FormInput
            label="Available To"
            name="availableTo"
            type="date"
            value={formData.availableTo}
            onChange={handleChange}
            required
            error={errors.availableTo}
          />
        </div>
      </form>
    </Modal>
  );
}

export default PlanModal;
