import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Layers, Calendar, RefreshCw } from 'lucide-react';
import planService from '../../services/planService';
import { formatCurrency, formatInterval, formatLifecycleRule, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import PlanModal from './PlanModal';

export function PlansPage() {
  const { showToast } = useToast();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await planService.getPlans();
      setPlans(data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setModalOpen(true);
  };

  const handleSavePlan = async (formData) => {
    setSubmitting(true);
    try {
      if (editingPlan) {
        await planService.updatePlan(editingPlan.id, formData);
        showToast(`Plan "${formData.name}" updated successfully.`, 'success');
      } else {
        await planService.createPlan(formData);
        showToast(`Plan "${formData.name}" created successfully.`, 'success');
      }
      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      showToast(err.message || 'Failed to save plan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Plan Name',
      accessor: 'name',
      render: (row) => (
        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{row.name}</div>
      ),
    },
    {
      header: 'Billing Interval',
      accessor: 'interval',
      width: '130px',
      render: (row) => (
        <span className="badge badge-info" style={{ fontSize: '0.725rem' }}>
          {formatInterval(row.interval)}
        </span>
      ),
    },
    {
      header: 'Base Price',
      accessor: 'price',
      align: 'right',
      width: '140px',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{formatCurrency(row.price)}</span>
      ),
    },
    {
      header: 'Min Qty',
      accessor: 'minimumQuantity',
      align: 'center',
      width: '90px',
      render: (row) => (
        <span style={{ fontWeight: 500 }}>{row.minimumQuantity || 1}</span>
      ),
    },
    {
      header: 'Availability Period',
      width: '210px',
      render: (row) => (
        <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)' }}>
          {formatDate(row.availableFrom)} – {formatDate(row.availableTo)}
        </div>
      ),
    },
    {
      header: 'Lifecycle Policy',
      accessor: 'lifecycleRule',
      width: '160px',
      render: (row) => (
        <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
          <RefreshCw size={11} style={{ marginRight: '3px' }} />
          {formatLifecycleRule(row.lifecycleRule)}
        </span>
      ),
    },
    {
      header: 'Actions',
      width: '100px',
      align: 'right',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          icon={Edit2}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenEdit(row);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Subscription Plans</h1>
          <p className="page-header-subtitle">
            Define recurring cadences, minimum seat thresholds, and renewal policies.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            New Plan
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={plans}
        loading={loading}
        searchPlaceholder="Search plans by name or interval..."
        searchFields={['name', 'interval', 'lifecycleRule']}
        emptyTitle="No plans configured"
        emptyDescription="Create subscription plans to attach to compatible products."
      />

      <PlanModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSavePlan}
        plan={editingPlan}
        loading={submitting}
      />
    </div>
  );
}

export default PlansPage;
