import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import productService from '../../services/productService';
import planService from '../../services/planService';
import { formatCurrency, formatInterval } from '../../utils/formatters';

export function ProductPlansModal({ isOpen, onClose, product, onSaved, showToast }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      loadData();
    }
  }, [isOpen, product]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all system plans
      const allPlans = await planService.getPlans();
      setPlans(allPlans);

      // 2. Fetch plans currently assigned to this product
      const assignedPlans = await productService.getProductPlans(product.id);
      const assignedIds = Array.isArray(assignedPlans) ? assignedPlans.map((p) => p.id) : [];
      setSelectedPlanIds(assignedIds);
    } catch (err) {
      showToast(err.message || 'Failed to load product plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlan = (planId) => {
    setSelectedPlanIds((prev) =>
      prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await productService.updateProductPlans(product.id, selectedPlanIds);
      showToast(`Compatible plans updated for ${product.name}`, 'success');
      onSaved();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to update plan compatibility', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure Allowed Plans: ${product.name}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Save Compatible Plans
          </Button>
        </>
      }
    >
      <div style={{ marginBottom: '16px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
        Select which subscription plans customers can choose when subscribing to this product.
        The backend verifies this combination during subscription creation.
      </div>

      {loading ? (
        <LoadingSpinner text="Loading plans..." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {plans.map((plan) => {
            const isChecked = selectedPlanIds.includes(plan.id);
            return (
              <label
                key={plan.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isChecked ? 'var(--color-primary-border)' : 'var(--color-border)'}`,
                  backgroundColor: isChecked ? 'var(--color-primary-subtle)' : 'var(--color-bg-surface)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleTogglePlan(plan.id)}
                  style={{ width: '18px', height: '18px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                    {plan.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {formatCurrency(plan.price)} • {formatInterval(plan.interval)} billing
                  </div>
                </div>
                <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                  Min Qty: {plan.minimumQuantity || 1}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

export default ProductPlansModal;
