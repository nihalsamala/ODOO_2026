import React, { useState, useEffect } from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import FormTextarea from '../../components/forms/FormTextarea';
import { formatCurrency } from '../../utils/formatters';

export function ProductModal({ isOpen, onClose, onSave, product = null, loading = false }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'SERVICE',
    salesPrice: '',
    costPrice: '',
    notes: '',
    active: true,
    variants: [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        type: product.type === 'SAAS' ? 'SERVICE' : (product.type || 'SERVICE'),
        salesPrice: product.salesPrice !== undefined ? String(product.salesPrice) : '',
        costPrice: product.costPrice !== undefined ? String(product.costPrice) : '',
        notes: product.notes || '',
        active: product.active !== undefined ? product.active : true,
        variants: Array.isArray(product.variants) ? JSON.parse(JSON.stringify(product.variants)) : [],
      });
    } else {
      setFormData({
        name: '',
        type: 'SERVICE',
        salesPrice: '',
        costPrice: '',
        notes: '',
        active: true,
        variants: [],
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { id: `var_${Date.now()}`, name: '', priceAdjustment: 0 },
      ],
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[index] = {
        ...updated[index],
        [field]: field === 'priceAdjustment' ? Number(value) || 0 : value,
      };
      return { ...prev, variants: updated };
    });
  };

  const handleRemoveVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.salesPrice || Number(formData.salesPrice) <= 0) {
      newErrors.salesPrice = 'Sales price must be greater than 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...formData,
      salesPrice: Number(formData.salesPrice),
      costPrice: Number(formData.costPrice) || 0,
    });
  };

  const basePrice = Number(formData.salesPrice) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product & Variants' : 'Create New Product'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {product ? 'Save Changes' : 'Create Product'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <FormInput
            label="Product Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Brightloop Cloud Platform"
            required
            error={errors.name}
          />

          <FormSelect
            label="Product Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={[
              { value: 'SERVICE', label: 'Service / Cloud' },
              { value: 'DIGITAL', label: 'Digital Product' },
              { value: 'PHYSICAL', label: 'Physical Asset / Device' },
            ]}
          />
        </div>

        <div className="form-row">
          <FormInput
            label="Base Sales Price (₹)"
            name="salesPrice"
            type="number"
            step="0.01"
            value={formData.salesPrice}
            onChange={handleChange}
            placeholder="5000.00"
            required
            error={errors.salesPrice}
            hint="Base recurring price before variant adjustments"
          />

          <FormInput
            label="Cost Price (₹)"
            name="costPrice"
            type="number"
            step="0.01"
            value={formData.costPrice}
            onChange={handleChange}
            placeholder="1800.00"
            hint="Internal unit cost for margin tracking"
          />
        </div>

        <FormTextarea
          label="Notes & Specifications"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Service tier descriptions, license terms, or notes..."
          rows={2}
        />

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontWeight: 600 }}>Active Product (Available for subscriptions)</span>
          </label>
        </div>

        {/* Product Variants Section */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                Product Variants & Add-ons
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Example from blueprint: Base price ₹5,000 + Variant adjustment ₹560 = Final price ₹5,560.
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={handleAddVariant}
            >
              Add Variant
            </Button>
          </div>

          {formData.variants.length === 0 ? (
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-subtle)', textAlign: 'center', padding: '16px' }}>
              No variants defined. The base product will be billed without adjustment.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {formData.variants.map((variant, index) => {
                const finalVariantPrice = basePrice + (Number(variant.priceAdjustment) || 0);
                return (
                  <div
                    key={variant.id || index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'var(--color-bg-surface)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ flex: 2 }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Variant Name (e.g. Dedicated Compute)"
                        value={variant.name}
                        onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ flex: 1.2 }}>
                      <div style={{ position: 'relative' }}>
                        <span
                          style={{
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '0.75rem',
                            color: 'var(--color-text-subtle)',
                          }}
                        >
                          +₹
                        </span>
                        <input
                          type="number"
                          className="form-control"
                          style={{ paddingLeft: '28px' }}
                          placeholder="Adjustment (560)"
                          value={variant.priceAdjustment}
                          onChange={(e) => handleVariantChange(index, 'priceAdjustment', e.target.value)}
                        />
                      </div>
                    </div>
                    <div style={{ minWidth: '100px', fontSize: '0.775rem', color: 'var(--color-text-muted)' }}>
                      Final: <strong>{formatCurrency(finalVariantPrice)}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title="Remove variant"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default ProductModal;
