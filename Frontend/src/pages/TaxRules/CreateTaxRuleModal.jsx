import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import FormInput from '../../components/forms/FormInput';

export function CreateTaxRuleModal({ isOpen, onClose, onCreated, showToast }) {
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    active: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Tax rule name is required';
    if (formData.rate === '' || isNaN(Number(formData.rate)) || Number(formData.rate) < 0) {
      newErrors.rate = 'Rate must be a non-negative percentage';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onCreated({
        name: formData.name,
        rate: Number(formData.rate),
        active: formData.active,
      });
      showToast('Tax rule created successfully.', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to create tax rule', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Tax Rule"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Create Tax Rule
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Tax Name / Authority"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. GST Standard 18% / VAT / Sales Tax"
          required
          error={errors.name}
        />

        <FormInput
          label="Tax Rate (%)"
          name="rate"
          type="number"
          step="0.01"
          min="0"
          value={formData.rate}
          onChange={handleChange}
          placeholder="18.0"
          required
          error={errors.rate}
          hint="Snapshot percentage applied during recurring billing"
        />

        <div style={{ marginTop: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontWeight: 600 }}>Active Tax Rule</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}

export default CreateTaxRuleModal;
