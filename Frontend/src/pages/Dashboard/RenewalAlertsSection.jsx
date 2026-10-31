import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  Clock,
  Calendar,
  RefreshCw,
  CheckCircle2,
  ArrowUpRight,
  Info,
  PauseCircle,
  AlertCircle,
} from 'lucide-react';
import subscriptionService from '../../services/subscriptionService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export function RenewalAlertsSection({ daysAhead = 7, onSubscriptionClick }) {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDays, setSelectedDays] = useState(daysAhead);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await subscriptionService.getRenewalAlerts({ daysAhead: selectedDays });
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load renewal alerts:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load upcoming renewal alerts');
    } finally {
      setLoading(false);
    }
  }, [selectedDays]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleRowClick = (subId) => {
    if (onSubscriptionClick) {
      onSubscriptionClick(subId);
    } else {
      navigate('/subscriptions');
    }
  };

  const getAlertBadge = (alert) => {
    if (alert.status === 'PAUSED') {
      return (
        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <PauseCircle size={12} /> Paused
        </span>
      );
    }
    if (alert.alertLevel === 'URGENT') {
      return (
        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle size={12} /> {alert.daysRemaining === 0 ? 'Due Today' : `${alert.daysRemaining}d remaining`}
        </span>
      );
    }
    if (alert.alertLevel === 'WARNING') {
      return (
        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> In {alert.daysRemaining} days
        </span>
      );
    }
    return (
      <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Calendar size={12} /> In {alert.daysRemaining} days
      </span>
    );
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                Subscription Renewal & Expiration Alerts
              </h3>
              {!loading && !error && alerts.length > 0 && (
                <span
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {alerts.length} Due Soon
                </span>
              )}
            </div>
            <p className="card-description" style={{ margin: '2px 0 0' }}>
              Subscriptions reaching next billing cycle or term expiration within the selected window
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Days window toggle */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--color-bg-subtle, #f1f5f9)',
              padding: '3px',
              borderRadius: '6px',
              fontSize: '0.75rem',
            }}
          >
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setSelectedDays(days)}
                style={{
                  border: 'none',
                  background: selectedDays === days ? 'var(--color-surface, #ffffff)' : 'transparent',
                  color: selectedDays === days ? 'var(--color-text, #0f172a)' : 'var(--color-text-muted, #64748b)',
                  fontWeight: selectedDays === days ? 600 : 500,
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  boxShadow: selectedDays === days ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {days} Days
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchAlerts}
            disabled={loading}
            title="Refresh alerts"
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="card-body" style={{ padding: 0 }}>
        {/* Loading State */}
        {loading && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <div
              style={{
                display: 'inline-block',
                width: '24px',
                height: '24px',
                border: '3px solid var(--color-border)',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '8px',
              }}
            />
            <div style={{ fontSize: '0.875rem' }}>Evaluating renewal horizons and lifecycle rules...</div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            style={{
              padding: '24px',
              margin: '16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#991b1b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} color="#dc2626" />
              <div>
                <strong style={{ fontSize: '0.875rem' }}>Unable to load renewal alerts</strong>
                <p style={{ margin: '2px 0 0', fontSize: '0.8125rem' }}>{error}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAlerts}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && alerts.length === 0 && (
          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                color: '#16a34a',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.9375rem', fontWeight: 600 }}>
              No Upcoming Renewals in Next {selectedDays} Days
            </h4>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              All customer agreements are active and no subscriptions are scheduled for immediate renewal or expiration.
            </p>
          </div>
        )}

        {/* Populated Alerts Table */}
        {!loading && !error && alerts.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subscription</th>
                  <th>Customer</th>
                  <th>Plan & Billing Interval</th>
                  <th>Upcoming Date</th>
                  <th>Urgency</th>
                  <th>Lifecycle / Action</th>
                  <th className="text-right">Amount</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => {
                  const isUrgent = alert.alertLevel === 'URGENT';
                  return (
                    <tr
                      key={alert.subscriptionId}
                      onClick={() => handleRowClick(alert.subscriptionId)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isUrgent ? 'rgba(254, 242, 242, 0.4)' : 'transparent',
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {alert.subscriptionNumber}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {alert.productName}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{alert.customerName}</div>
                        {alert.customerEmail && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {alert.customerEmail}
                          </div>
                        )}
                      </td>
                      <td>
                        <div>{alert.planName}</div>
                        <span
                          className="badge badge-neutral"
                          style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}
                        >
                          {alert.billingInterval?.toLowerCase() || 'monthly'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: isUrgent ? '#dc2626' : 'inherit' }}>
                          {formatDate(alert.relevantDate)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          {alert.dateType === 'EXPIRATION_DATE' ? 'Term Expiration' : 'Next Billing'}
                        </div>
                      </td>
                      <td>{getAlertBadge(alert)}</td>
                      <td>
                        {alert.autoRenew ? (
                          <span
                            className="badge badge-success"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                            title="Will charge and renew automatically"
                          >
                            <CheckCircle2 size={11} /> Auto-Renewing
                          </span>
                        ) : alert.status === 'PAUSED' ? (
                          <span
                            className="badge badge-warning"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                            title="Requires manual resume before billing can run"
                          >
                            <PauseCircle size={11} /> Action: Resume
                          </span>
                        ) : (
                          <span
                            className="badge badge-warning"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                            title="Action required: Non-renewing agreement"
                          >
                            <AlertTriangle size={11} /> Action Required
                          </span>
                        )}
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {alert.alertMessage}
                        </div>
                      </td>
                      <td className="text-right" style={{ fontWeight: 600 }}>
                        {formatCurrency(alert.amount)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <ArrowUpRight size={16} color="var(--color-text-muted)" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default RenewalAlertsSection;
