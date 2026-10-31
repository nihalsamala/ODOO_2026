import React, { useState, useEffect } from 'react';
import { Plus, Eye, Repeat, Calendar, CheckCircle, Clock } from 'lucide-react';
import subscriptionService from '../../services/subscriptionService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import CreateSubscriptionModal from './CreateSubscriptionModal';
import SubscriptionDetailModal from './SubscriptionDetailModal';

export function SubscriptionsPage() {
  const { showToast } = useToast();
  const { user, isCustomer } = useAuth();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.getSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  const handleCreateSubscription = async (payload) => {
    try {
      await subscriptionService.createSubscription(payload);
      showToast('Subscription created & agreed snapshot locked.', 'success');
      fetchSubscriptions();
    } catch (err) {
      showToast(err.message || 'Failed to create subscription', 'error');
      throw err;
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (statusFilter === 'ALL') return true;
    return sub.status?.toUpperCase() === statusFilter;
  });

  const columns = [
    {
      header: 'Subscription #',
      accessor: 'number',
      width: '160px',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{row.number}</div>
          <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
            {row.paymentTerms || 'NET_30'}
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{row.customerName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {row.customerEmail}
          </div>
        </div>
      ),
    },
    {
      header: 'Plan',
      accessor: 'planName',
      render: (row) => (
        <span className="badge badge-info" style={{ fontSize: '0.725rem' }}>
          {row.planName}
        </span>
      ),
    },
    {
      header: 'Next Billing',
      accessor: 'nextBillingDate',
      width: '130px',
      render: (row) => (
        <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>
          {formatDate(row.nextBillingDate)}
        </div>
      ),
    },
    {
      header: 'Agreed Price',
      accessor: 'agreedTotal',
      align: 'right',
      width: '140px',
      render: (row) => (
        <span style={{ fontWeight: 700 }}>{formatCurrency(row.agreedTotal)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '120px',
      render: (row) => <Badge status={row.status} />,
    },
    {
      header: 'Actions',
      width: '110px',
      align: 'right',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          icon={Eye}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSub(row);
          }}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Subscriptions Management</h1>
          <p className="page-header-subtitle">
            {isCustomer
              ? 'Your active contracts, pricing snapshots, and scheduled billing renewals.'
              : 'End-to-end subscription lifecycle: Draft → Quotation → Confirmed → Active with Pause/Resume/Close.'}
          </p>
        </div>
        <div className="page-actions">
          {!isCustomer && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setCreateModalOpen(true)}
            >
              New Subscription
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {['ALL', 'ACTIVE', 'CONFIRMED', 'PAUSED', 'CLOSED'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid',
              borderColor: statusFilter === tab ? 'var(--color-primary)' : 'var(--color-border)',
              backgroundColor: statusFilter === tab ? 'var(--color-primary-subtle)' : 'var(--color-bg-surface)',
              color: statusFilter === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: '0.775rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredSubscriptions}
        loading={loading}
        searchPlaceholder="Search subscriptions by ID, customer, or plan..."
        searchFields={['number', 'customerName', 'customerEmail', 'planName']}
        emptyTitle="No subscriptions found"
        emptyDescription={
          isCustomer
            ? 'You do not have any subscriptions under this account.'
            : 'Create your first subscription or trigger billing to view generated contracts.'
        }
        onRowClick={(row) => setSelectedSub(row)}
      />

      {createModalOpen && (
        <CreateSubscriptionModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={handleCreateSubscription}
          showToast={showToast}
          currentUser={user}
        />
      )}

      {selectedSub && (
        <SubscriptionDetailModal
          isOpen={Boolean(selectedSub)}
          onClose={() => setSelectedSub(null)}
          subscription={selectedSub}
          onActionComplete={fetchSubscriptions}
          showToast={showToast}
          isCustomer={isCustomer}
        />
      )}
    </div>
  );
}

export default SubscriptionsPage;
