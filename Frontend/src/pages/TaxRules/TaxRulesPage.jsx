import React, { useState, useEffect } from 'react';
import { Plus, Receipt, Check, X } from 'lucide-react';
import taxService from '../../services/taxService';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import CreateTaxRuleModal from './CreateTaxRuleModal';

export function TaxRulesPage() {
  const { showToast } = useToast();

  const [taxRules, setTaxRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchTaxRules = async () => {
    setLoading(true);
    try {
      const data = await taxService.getTaxRules();
      setTaxRules(data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch tax rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxRules();
  }, []);

  const handleCreateTax = async (formData) => {
    await taxService.createTaxRule(formData);
    fetchTaxRules();
  };

  const columns = [
    {
      header: 'Rule ID',
      accessor: 'id',
      width: '120px',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.id}</span>,
    },
    {
      header: 'Tax Name / Jurisdiction',
      accessor: 'name',
      render: (row) => (
        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{row.name}</div>
      ),
    },
    {
      header: 'Tax Rate (%)',
      accessor: 'rate',
      align: 'right',
      width: '140px',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{row.rate}%</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'active',
      width: '130px',
      render: (row) => (
        <Badge variant={row.active ? 'success' : 'neutral'}>
          {row.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Tax Rules Configuration</h1>
          <p className="page-header-subtitle">
            Admin configuration for jurisdictional tax rates snapshot on generated invoices.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
            New Tax Rule
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={taxRules}
        loading={loading}
        searchPlaceholder="Search tax rules by name..."
        searchFields={['id', 'name']}
        emptyTitle="No tax rules configured"
        emptyDescription="Create tax rules to apply percentage taxation on invoices."
      />

      <CreateTaxRuleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreateTax}
        showToast={showToast}
      />
    </div>
  );
}

export default TaxRulesPage;
