import React, { useState, useEffect } from 'react';
import { Plus, Percent, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import discountService from '../../services/discountService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import CreateDiscountRuleModal from './CreateDiscountRuleModal';

export function DiscountRulesPage() {
  const { showToast } = useToast();

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await discountService.getDiscountRules();
      setRules(data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch discount rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreateRule = async (formData) => {
    await discountService.createDiscountRule(formData);
    fetchRules();
  };

  const today = new Date().toISOString().split('T')[0];

  const columns = [
    {
      header: 'Rule ID',
      accessor: 'id',
      width: '120px',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.id}</span>,
    },
    {
      header: 'Discount Benefit',
      accessor: 'value',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            {row.type === 'PERCENTAGE' ? `${row.value}% OFF` : `₹${row.value} FLAT`}
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
            Min Order: {formatCurrency(row.minPurchase)} • Min Qty: {row.minQty || 1}
          </div>
        </div>
      ),
    },
    {
      header: 'Validity Period',
      width: '210px',
      render: (row) => (
        <div style={{ fontSize: '0.8rem' }}>
          {formatDate(row.startsAt)} – {formatDate(row.endsAt)}
        </div>
      ),
    },
    {
      header: 'Redemptions',
      width: '150px',
      render: (row) => {
        const used = row.usesCount || 0;
        const max = row.maxUses || 100;
        const isExhausted = used >= max;
        return (
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              {used} / {max} used
            </div>
            {isExhausted && (
              <span style={{ fontSize: '0.675rem', color: 'var(--color-danger)' }}>
                Limit Reached
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Scope',
      accessor: 'scope',
      width: '120px',
      render: (row) => (
        <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
          {row.scope || 'ALL'}
        </span>
      ),
    },
    {
      header: 'Status',
      width: '130px',
      render: (row) => {
        const isExpired = row.endsAt < today;
        const isExhausted = (row.usesCount || 0) >= (row.maxUses || 100);
        const isActive = row.active && !isExpired && !isExhausted;

        return (
          <Badge variant={isActive ? 'success' : 'neutral'}>
            {isActive ? 'Active' : isExpired ? 'Expired' : 'Exhausted'}
          </Badge>
        );
      },
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Discount Rules Configuration</h1>
          <p className="page-header-subtitle">
            Admin configuration for percentage or flat discounts, usage caps, and validity thresholds.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
            New Discount Rule
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rules}
        loading={loading}
        searchPlaceholder="Search discount rules..."
        searchFields={['id', 'type', 'scope']}
        emptyTitle="No discount rules configured"
        emptyDescription="Create discount rules to apply during invoice generation."
      />

      <CreateDiscountRuleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreateRule}
        showToast={showToast}
      />
    </div>
  );
}

export default DiscountRulesPage;
