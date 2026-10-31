import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import FormTextarea from '../../components/forms/FormTextarea';
import { formatCurrency } from '../../utils/formatters';
import paymentService from '../../services/paymentService';

export function RecordPaymentModal({
  isOpen,
  onClose,
  invoice,
  onPaymentRecorded,
  showToast,
}) {
  const [formData, setFormData] = useState({
    amount: '',
    method: 'BANK_TRANSFER',
    paidAt: '',
    note: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoice) {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      setFormData({
        amount: String(invoice.outstandingBalance || invoice.total || ''),
        method: 'BANK_TRANSFER',
        paidAt: now,
        note: '',
      });
      setError('');
    }
  }, [invoice, isOpen]);

  if (!invoice) return null;

  const outstanding = Number(invoice.outstandingBalance) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amt = Number(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }

    if (amt > outstanding + 0.01) {
      setError(`Payment amount cannot exceed outstanding balance (${formatCurrency(outstanding)}).`);
      return;
    }

    setLoading(true);
    try {
      await paymentService.recordPayment(invoice.id, {
        amount: amt,
        method: formData.method,
        paidAt: formData.paidAt,
        note: formData.note,
      });

      const isFull = Math.abs(amt - outstanding) < 0.01;
      showToast(
        isFull
          ? `Full payment of ${formatCurrency(amt)} recorded. Invoice is now settled (PAID).`
          : `Partial payment of ${formatCurrency(amt)} recorded. Remaining balance: ${formatCurrency(outstanding - amt)}.`,
        'success'
      );
      onPaymentRecorded();
      onClose();
    } catch (err) {
      setError(err.message || 'Payment recording failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment — Invoice ${invoice.number}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Submit Payment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {/* Outstanding Balance Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            border: '1px solid var(--color-border)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Customer</div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{invoice.customerName}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Outstanding Balance
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-warning-dark)' }}>
              {formatCurrency(outstanding)}
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--color-danger-subtle)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger-dark)',
              fontSize: '0.8125rem',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <div className="form-row">
          <FormInput
            label="Payment Amount (₹)"
            name="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            hint="Supports full or partial payment amounts"
          />

          <FormSelect
            label="Payment Method"
            name="method"
            value={formData.method}
            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
            options={[
              { value: 'BANK_TRANSFER', label: 'Direct Bank Wire (NEFT/RTGS)' },
              { value: 'CREDIT_CARD', label: 'Corporate Credit Card' },
              { value: 'UPI', label: 'UPI / Immediate Payment' },
              { value: 'NET_BANKING', label: 'Corporate Net Banking' },
              { value: 'CASH', label: 'Cash / Manual Receipt' },
            ]}
          />
        </div>

        <FormInput
          label="Payment Timestamp"
          name="paidAt"
          value={formData.paidAt}
          onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
          required
        />

        <FormTextarea
          label="Transaction Note & Reference"
          name="note"
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          placeholder="e.g. Wire transfer UTR #HDFC00192841"
          rows={2}
        />
      </form>
    </Modal>
  );
}

export default RecordPaymentModal;
