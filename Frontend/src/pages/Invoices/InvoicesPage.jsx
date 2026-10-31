import React, { useState, useEffect } from 'react';
import {
  Zap,
  Eye,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
} from 'lucide-react';
import invoiceService from '../../services/invoiceService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import InvoiceDetailModal from './InvoiceDetailModal';
import RecordPaymentModal from './RecordPaymentModal';

export function InvoicesPage() {
  const { showToast } = useToast();
  const { user, isCustomer } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [billingConfirmOpen, setBillingConfirmOpen] = useState(false);
  const [runningBilling, setRunningBilling] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getInvoices();
      setInvoices(data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const handleRunBilling = async () => {
    setRunningBilling(true);
    try {
      const res = await invoiceService.runBilling();
      setBillingConfirmOpen(false);
      const msg = Array.isArray(res)
        ? `Billing run completed: ${res.length} invoice(s) generated.`
        : (res?.message || 'Recurring billing completed successfully.');
      showToast(msg, 'success');
      fetchInvoices();
    } catch (err) {
      showToast(err.message || 'Failed to trigger billing run', 'error');
    } finally {
      setRunningBilling(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'OVERDUE') {
      return inv.dueDate < today && inv.outstandingBalance > 0 && inv.status !== 'CANCELLED';
    }
    return inv.status?.toUpperCase() === statusFilter;
  });

  const columns = [
    {
      header: 'Invoice #',
      accessor: 'number',
      width: '150px',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{row.number}</div>
          <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
            Issued: {formatDate(row.issueDate)}
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
            {formatDate(row.billingPeriodStart)} – {formatDate(row.billingPeriodEnd)}
          </div>
        </div>
      ),
    },
    {
      header: 'Due Date',
      accessor: 'dueDate',
      width: '130px',
      render: (row) => {
        const isOverdue = row.dueDate < today && row.outstandingBalance > 0 && row.status !== 'CANCELLED';
        return (
          <div>
            <div style={{ fontSize: '0.85rem', color: isOverdue ? 'var(--color-danger)' : 'inherit', fontWeight: isOverdue ? 700 : 500 }}>
              {formatDate(row.dueDate)}
            </div>
            {isOverdue && (
              <span style={{ fontSize: '0.675rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <AlertTriangle size={11} /> Overdue
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Total',
      accessor: 'total',
      align: 'right',
      width: '130px',
      render: (row) => (
        <span style={{ fontWeight: 700 }}>{formatCurrency(row.total)}</span>
      ),
    },
    {
      header: 'Paid',
      accessor: 'amountPaid',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span style={{ color: 'var(--color-success-dark)', fontWeight: 600 }}>
          {formatCurrency(row.amountPaid)}
        </span>
      ),
    },
    {
      header: 'Balance',
      accessor: 'outstandingBalance',
      align: 'right',
      width: '130px',
      render: (row) => {
        const bal = Number(row.outstandingBalance) || 0;
        return (
          <span style={{ fontWeight: 700, color: bal > 0 ? 'var(--color-warning-dark)' : 'var(--color-text-muted)' }}>
            {formatCurrency(bal)}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '120px',
      render: (row) => <Badge status={row.status} />,
    },
    {
      header: 'Actions',
      width: '160px',
      align: 'right',
      render: (row) => {
        const canPay = row.outstandingBalance > 0 && row.status !== 'DRAFT' && row.status !== 'CANCELLED';
        return (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={Eye}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedInvoice(row);
              }}
            >
              Details
            </Button>
            {canPay && (
              <Button
                variant="primary"
                size="sm"
                icon={CreditCard}
                onClick={(e) => {
                  e.stopPropagation();
                  setPaymentModalInvoice(row);
                }}
              >
                Pay
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Invoices & Billing</h1>
          <p className="page-header-subtitle">
            {isCustomer
              ? 'Review your billing statements, tax breakdowns, and settlement history.'
              : 'Automated invoice generation, tax snapshotting, payment tracking, and balance reconciliation.'}
          </p>
        </div>
        <div className="page-actions">
          {!isCustomer && (
            <Button
              variant="primary"
              icon={Zap}
              onClick={() => setBillingConfirmOpen(true)}
            >
              Run Billing Cycle
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
        {['ALL', 'CONFIRMED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'DRAFT'].map((tab) => (
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
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredInvoices}
        loading={loading}
        searchPlaceholder="Search invoices by number or customer..."
        searchFields={['number', 'customerName']}
        emptyTitle="No invoices found"
        emptyDescription={
          isCustomer
            ? 'No invoices are due or generated for your account.'
            : 'Click "Run Billing Cycle" to generate recurring invoices for active subscriptions.'
        }
        onRowClick={(row) => setSelectedInvoice(row)}
      />

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
          onInvoiceUpdated={fetchInvoices}
          showToast={showToast}
          isCustomer={isCustomer}
        />
      )}

      {/* Record Payment Sub-Modal */}
      {paymentModalInvoice && (
        <RecordPaymentModal
          isOpen={Boolean(paymentModalInvoice)}
          onClose={() => setPaymentModalInvoice(null)}
          invoice={paymentModalInvoice}
          onPaymentRecorded={fetchInvoices}
          showToast={showToast}
        />
      )}

      {/* Run Billing Confirmation Dialog */}
      <ConfirmDialog
        isOpen={billingConfirmOpen}
        onClose={() => setBillingConfirmOpen(false)}
        onConfirm={handleRunBilling}
        loading={runningBilling}
        title="Execute Recurring Billing Cycle"
        message="This will evaluate all active subscriptions whose next billing date is due. The backend enforces database-level duplicate prevention for the same subscription and billing period."
        confirmText="Execute Billing Now"
        confirmVariant="primary"
      />
    </div>
  );
}

export default InvoicesPage;
