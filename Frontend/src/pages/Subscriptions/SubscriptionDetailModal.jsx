import React, { useState } from 'react';
import {
  PauseCircle,
  PlayCircle,
  XCircle,
  RotateCw,
  Calendar,
  Building,
  Layers,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  formatCurrency,
  formatDate,
  formatLifecycleRule,
  formatInterval,
} from '../../utils/formatters';
import subscriptionService from '../../services/subscriptionService';

export function SubscriptionDetailModal({
  isOpen,
  onClose,
  subscription,
  onActionComplete,
  showToast,
  isCustomer = false,
}) {
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    action: null,
    title: '',
    message: '',
    confirmText: '',
    confirmVariant: 'danger',
  });

  if (!subscription) return null;

  const handleTriggerAction = (action, title, message, confirmText, confirmVariant) => {
    setConfirmDialog({
      isOpen: true,
      action,
      title,
      message,
      confirmText,
      confirmVariant,
    });
  };

  const executeAction = async () => {
    const { action } = confirmDialog;
    setActionLoading(true);
    try {
      if (action === 'confirm') {
        await subscriptionService.confirmSubscription(subscription.id);
        showToast(`Subscription ${subscription.number} confirmed.`, 'success');
      } else if (action === 'activate') {
        await subscriptionService.activateSubscription(subscription.id);
        showToast(`Subscription ${subscription.number} activated.`, 'success');
      } else if (action === 'pause') {
        await subscriptionService.pauseSubscription(subscription.id);
        showToast(`Subscription ${subscription.number} paused. Future billing is suspended.`, 'warning');
      } else if (action === 'resume') {
        await subscriptionService.resumeSubscription(subscription.id);
        showToast(`Subscription ${subscription.number} resumed to ACTIVE status.`, 'success');
      } else if (action === 'close') {
        await subscriptionService.closeSubscription(subscription.id);
        showToast(`Subscription ${subscription.number} closed.`, 'info');
      } else if (action === 'renew') {
        await subscriptionService.renewSubscription(subscription.id);
        showToast(`Subscription ${subscription.number} renewed for next cycle.`, 'success');
      }
      setConfirmDialog({ ...confirmDialog, isOpen: false });
      onActionComplete();
      onClose();
    } catch (err) {
      showToast(err.message || `Failed to execute ${action} on subscription`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const status = subscription.status?.toUpperCase() || 'DRAFT';

  // Allowed lifecycle action logic per backend:
  const canConfirm = !isCustomer && (status === 'DRAFT' || status === 'QUOTATION');
  const canActivate = !isCustomer && (status === 'CONFIRMED' || status === 'DRAFT');
  const canPause = !isCustomer && (status === 'ACTIVE' || status === 'CONFIRMED');
  const canResume = !isCustomer && status === 'PAUSED';
  const canClose = !isCustomer && status !== 'CLOSED';
  const canRenew = !isCustomer && (status === 'ACTIVE' || status === 'CLOSED');

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Subscription Details — ${subscription.number}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {canConfirm && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={FileCheck}
                  onClick={() =>
                    handleTriggerAction(
                      'confirm',
                      'Confirm Subscription',
                      'Transition subscription from Draft / Quotation to Confirmed status.',
                      'Confirm Subscription',
                      'primary'
                    )
                  }
                >
                  Confirm
                </Button>
              )}

              {canActivate && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={PlayCircle}
                  onClick={() =>
                    handleTriggerAction(
                      'activate',
                      'Activate Subscription',
                      'Activate subscription to begin scheduled billing runs and invoice generation.',
                      'Activate Subscription',
                      'primary'
                    )
                  }
                >
                  Activate
                </Button>
              )}

              {canPause && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={PauseCircle}
                  onClick={() =>
                    handleTriggerAction(
                      'pause',
                      'Pause Recurring Subscription',
                      'Pausing will suspend future automated billing cycles. The next billing date will be shifted upon resumption.',
                      'Pause Subscription',
                      'secondary'
                    )
                  }
                >
                  Pause
                </Button>
              )}

              {canResume && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={PlayCircle}
                  onClick={() =>
                    handleTriggerAction(
                      'resume',
                      'Resume Subscription',
                      'Resuming will return subscription to Active state and advance the billing date according to the paused duration.',
                      'Resume Subscription',
                      'primary'
                    )
                  }
                >
                  Resume
                </Button>
              )}

              {canRenew && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={RotateCw}
                  onClick={() =>
                    handleTriggerAction(
                      'renew',
                      'Renew Subscription Cycle',
                      'Renew will extend contract end date per plan lifecycle rule.',
                      'Renew Subscription',
                      'primary'
                    )
                  }
                >
                  Renew
                </Button>
              )}

              {canClose && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={XCircle}
                  onClick={() =>
                    handleTriggerAction(
                      'close',
                      'Close Subscription',
                      'Closing stops all future billing runs. Note: Unpaid historical invoices are NOT cancelled automatically per business rules.',
                      'Close Subscription',
                      'danger'
                    )
                  }
                >
                  Close
                </Button>
              )}
            </div>

            <Button variant="secondary" onClick={onClose}>
              Dismiss
            </Button>
          </div>
        }
      >
        {/* Top Summary Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            marginBottom: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                {subscription.number}
              </span>
              <Badge status={subscription.status} />
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Customer: <strong>{subscription.customerName}</strong> ({subscription.customerEmail})
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Agreed Total / Cycle</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {formatCurrency(subscription.agreedTotal)}
            </div>
          </div>
        </div>

        {/* Contract Schedule & Dates */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Assigned Plan
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>
              {subscription.planName}
            </div>
          </div>

          <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Contract Duration
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '2px' }}>
              {formatDate(subscription.startDate)} – {formatDate(subscription.endDate)}
            </div>
          </div>

          <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Next Scheduled Billing
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)', marginTop: '2px' }}>
              {formatDate(subscription.nextBillingDate)}
            </div>
          </div>

          <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Payment Terms
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>
              {subscription.paymentTerms || 'NET_30'}
            </div>
          </div>
        </div>

        {/* Line Items Snapshot */}
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
            Agreed Line-Item Snapshot (Locked at Confirmation)
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description / Product</th>
                  <th className="text-center">Quantity</th>
                  <th className="text-right">Unit Price Snapshot</th>
                  <th className="text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {(subscription.lines || []).map((line, idx) => (
                  <tr key={line.id || idx}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{line.productName || line.description}</div>
                      {line.variantName && (
                        <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                          Variant: {line.variantName}
                        </div>
                      )}
                    </td>
                    <td className="text-center">{line.quantity}</td>
                    <td className="text-right">{formatCurrency(line.unitPriceSnapshot)}</td>
                    <td className="text-right" style={{ fontWeight: 600 }}>
                      {formatCurrency(line.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            * Note: In accordance with core data integrity rules, price snapshots are preserved permanently.
            Subsequent plan price changes will only apply to future subscriptions.
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog for Lifecycle Actions */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={executeAction}
        loading={actionLoading}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmVariant={confirmDialog.confirmVariant}
      />
    </>
  );
}

export default SubscriptionDetailModal;
