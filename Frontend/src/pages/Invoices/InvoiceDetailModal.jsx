import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  CreditCard,
  CheckCircle,
  Calendar,
  AlertCircle,
  Clock,
  Printer,
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RecordPaymentModal from './RecordPaymentModal';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPaymentMethod,
} from '../../utils/formatters';
import invoiceService from '../../services/invoiceService';
import paymentService from '../../services/paymentService';

export function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
  onInvoiceUpdated,
  showToast,
  isCustomer = false,
}) {
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmingInvoice, setConfirmingInvoice] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!invoice?.id) return;
    setLoadingPayments(true);
    try {
      const list = await paymentService.getPaymentsForInvoice(invoice.id);
      setPayments(list);
    } catch {
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  }, [invoice]);

  useEffect(() => {
    if (isOpen && invoice) {
      fetchPayments();
    }
  }, [isOpen, invoice, fetchPayments]);

  if (!invoice) return null;

  const handleConfirmInvoice = async () => {
    setConfirmingInvoice(true);
    try {
      await invoiceService.confirmInvoice(invoice.id);
      showToast(`Invoice ${invoice.number} confirmed.`, 'success');
      onInvoiceUpdated();
    } catch (err) {
      showToast(err.message || 'Failed to confirm invoice', 'error');
    } finally {
      setConfirmingInvoice(false);
    }
  };

  const isDraft = invoice.status === 'DRAFT';
  const outstanding = Number(invoice.outstandingBalance) || 0;
  const canPay = outstanding > 0 && invoice.status !== 'CANCELLED' && !isDraft;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Invoice Breakdown — ${invoice.number}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {isDraft && !isCustomer && (
                <Button
                  variant="primary"
                  icon={CheckCircle}
                  size="sm"
                  onClick={handleConfirmInvoice}
                  loading={confirmingInvoice}
                >
                  Confirm Invoice
                </Button>
              )}

              {canPay && (
                <Button
                  variant="primary"
                  icon={CreditCard}
                  size="sm"
                  onClick={() => setPaymentModalOpen(true)}
                >
                  Record Payment
                </Button>
              )}
            </div>

            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        {/* Header Summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '16px 20px',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            marginBottom: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{invoice.number}</span>
              <Badge status={invoice.status} />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', marginTop: '4px' }}>
              Customer: <strong>{invoice.customerName}</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Billing Period: {formatDate(invoice.billingPeriodStart)} – {formatDate(invoice.billingPeriodEnd)}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Outstanding Balance</div>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: outstanding > 0 ? 'var(--color-warning-dark)' : 'var(--color-success)',
              }}
            >
              {formatCurrency(outstanding)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Due: {formatDate(invoice.dueDate)}
            </div>
          </div>
        </div>

        {/* Itemized Lines */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
            Line Items & Tax / Discount Snapshots
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Tax Rate</th>
                  <th className="text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.lines || []).map((line, idx) => (
                  <tr key={line.id || idx}>
                    <td style={{ fontWeight: 600 }}>{line.description || line.product}</td>
                    <td className="text-center">{line.quantity}</td>
                    <td className="text-right">{formatCurrency(line.unitPrice)}</td>
                    <td className="text-right">
                      {line.taxRate !== undefined && line.taxRate !== null
                        ? `${line.taxRate}%`
                        : (line.taxRateSnapshot ? `${line.taxRateSnapshot}%` : '0%')}
                    </td>
                    <td className="text-right" style={{ fontWeight: 600 }}>
                      {formatCurrency(line.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Calculation Summary Breakdown */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '280px',
              backgroundColor: 'var(--color-bg-subtle)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: '0.825rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {Number(invoice.discountAmount ?? invoice.discountTotal) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success-dark)' }}>
                <span>Discount Applied:</span>
                <span>-{formatCurrency(invoice.discountAmount ?? invoice.discountTotal)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Tax (GST):</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(invoice.taxAmount ?? invoice.taxTotal ?? 0)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--color-text-main)',
              }}
            >
              <span>Total Invoice:</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
              <span>Total Paid:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: outstanding > 0 ? 'var(--color-warning-dark)' : 'var(--color-text-muted)',
                fontWeight: 700,
              }}
            >
              <span>Balance Due:</span>
              <span>{formatCurrency(outstanding)}</span>
            </div>
          </div>
        </div>

        {/* Payment History Table */}
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
            Payment History & Receipts
          </div>
          {loadingPayments ? (
            <LoadingSpinner text="Loading payment log..." />
          ) : payments.length === 0 ? (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-muted)',
              }}
            >
              No payments recorded against this invoice yet.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Payment Ref</th>
                    <th>Date & Time</th>
                    <th>Method</th>
                    <th>Note</th>
                    <th className="text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.id}</td>
                      <td>{formatDateTime(p.paidAt)}</td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                          {formatPaymentMethod(p.method)}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {p.note || '—'}
                      </td>
                      <td className="text-right" style={{ fontWeight: 700, color: 'var(--color-success-dark)' }}>
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Record Payment Sub-Modal */}
      {paymentModalOpen && (
        <RecordPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          invoice={invoice}
          onPaymentRecorded={() => {
            fetchPayments();
            onInvoiceUpdated();
          }}
          showToast={showToast}
        />
      )}
    </>
  );
}

export default InvoiceDetailModal;
