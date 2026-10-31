import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Repeat,
  DollarSign,
  AlertOctagon,
  Clock,
  Calendar,
  Zap,
  ArrowUpRight,
  TrendingUp,
  FileText,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import invoiceService from '../../services/invoiceService';
import subscriptionService from '../../services/subscriptionService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import RenewalAlertsSection from './RenewalAlertsSection';

export function DashboardPage() {
  const navigate = useNavigate();
  const { isCustomer } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-12-31');

  // Billing Run modal state
  const [billingConfirmOpen, setBillingConfirmOpen] = useState(false);
  const [runningBilling, setRunningBilling] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [summary, invoices, subscriptions] = await Promise.all([
        dashboardService.getDashboardSummary({
          from: fromDate,
          to: toDate,
        }),
        invoiceService.getInvoices().catch(() => []),
        subscriptionService.getSubscriptions().catch(() => []),
      ]);

      const subList = Array.isArray(subscriptions) ? subscriptions : [];
      const invList = Array.isArray(invoices) ? invoices : [];

      const statusCounts = subList.reduce((acc, sub) => {
        const st = (sub.status || 'DRAFT').toUpperCase();
        acc[st] = (acc[st] || 0) + 1;
        return acc;
      }, {});

      // Build monthly overview from real invoice totals
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyBuckets = {};
      monthNames.forEach((m) => {
        monthlyBuckets[m] = { month: m, collected: 0, outstanding: 0 };
      });

      invList.forEach((inv) => {
        const dateStr = inv.issueDate || inv.createdAt;
        if (dateStr) {
          const mIdx = new Date(dateStr).getMonth();
          const mName = monthNames[mIdx];
          if (mName && monthlyBuckets[mName]) {
            monthlyBuckets[mName].collected += Number(inv.amountPaid || 0);
            monthlyBuckets[mName].outstanding += Number(inv.outstandingBalance || 0);
          }
        }
      });

      const currentMonthIdx = new Date().getMonth();
      const recentMonths = [];
      for (let i = 5; i >= 0; i--) {
        const idx = (currentMonthIdx - i + 12) % 12;
        recentMonths.push(monthlyBuckets[monthNames[idx]]);
      }

      setData({
        ...summary,
        subscriptionsByStatus: statusCounts,
        recentInvoices: invList.slice(0, 5),
        recentSubscriptions: subList.slice(0, 5),
        monthlyOverview: recentMonths,
      });
    } catch (err) {
      showToast(err.message || 'Failed to fetch dashboard summary', 'error');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, showToast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRunBilling = async () => {
    setRunningBilling(true);
    try {
      const res = await invoiceService.runBilling();
      setBillingConfirmOpen(false);
      const msg = Array.isArray(res)
        ? `Billing run completed: ${res.length} invoice(s) generated.`
        : (res?.message || 'Billing run executed successfully.');
      showToast(msg, 'success');
      fetchDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to trigger billing run', 'error');
    } finally {
      setRunningBilling(false);
    }
  };

  if (loading && !data) {
    return <LoadingSpinner text="Computing metrics and revenue aggregates..." />;
  }

  const {
    activeSubscriptions = 0,
    paymentsReceived = 0,
    outstandingBalance = 0,
    overdueInvoices = 0,
    monthlyOverview = [],
    subscriptionsByStatus = {},
    recentInvoices = [],
    recentSubscriptions = [],
  } = data || {};

  const totalBilled = paymentsReceived + outstandingBalance;
  const collectionRate = totalBilled > 0 ? Math.round((paymentsReceived / totalBilled) * 100) : 100;

  return (
    <div>
      {/* Header & Filter Controls */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">
            {isCustomer ? 'Customer Portal Dashboard' : 'Revenue & Operations Dashboard'}
          </h1>
          <p className="page-header-subtitle">
            {isCustomer
              ? 'Your active subscriptions, payment history, and outstanding invoices.'
              : 'Real-time financial telemetry, recurring revenue velocity, and invoice settlement metrics.'}
          </p>
        </div>

        <div className="page-actions">
          {/* Date range filter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 8px',
            }}
          >
            <Calendar size={14} color="var(--color-text-subtle)" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '0.775rem',
                color: 'var(--color-text-main)',
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '0.775rem',
                color: 'var(--color-text-main)',
              }}
            />
            <button
              type="button"
              onClick={fetchDashboard}
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: '0.725rem' }}
            >
              Filter
            </button>
          </div>

          {!isCustomer && (
            <Button
              variant="primary"
              icon={Zap}
              onClick={() => setBillingConfirmOpen(true)}
            >
              Run Recurring Billing
            </Button>
          )}
        </div>
      </div>

      {/* Four Primary Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-label">{isCustomer ? 'My Subscriptions' : 'Active Subscriptions'}</span>
            <div className="metric-icon-wrap blue">
              <Repeat size={18} />
            </div>
          </div>
          <div className="metric-value">{activeSubscriptions}</div>
          <div className="metric-footer">
            <TrendingUp size={13} color="var(--color-success)" />
            <span>{isCustomer ? 'Active agreements' : 'Active & confirmed subscriptions'}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-label">{isCustomer ? 'Total Paid' : 'Payments Received'}</span>
            <div className="metric-icon-wrap green">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="metric-value">{formatCurrency(paymentsReceived)}</div>
          <div className="metric-footer">
            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{collectionRate}%</span>
            <span>{isCustomer ? 'settled' : 'collection efficiency'}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-label">{isCustomer ? 'Balance Due' : 'Outstanding Balance'}</span>
            <div className="metric-icon-wrap amber">
              <Clock size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: outstandingBalance > 0 ? '#b45309' : 'inherit' }}>
            {formatCurrency(outstandingBalance)}
          </div>
          <div className="metric-footer">
            <span>{isCustomer ? 'Awaiting your payment' : 'Awaiting customer settlement'}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-label">Overdue Invoices</span>
            <div className="metric-icon-wrap red">
              <AlertOctagon size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: overdueInvoices > 0 ? '#dc2626' : 'inherit' }}>
            {overdueInvoices}
          </div>
          <div className="metric-footer">
            <span>{isCustomer ? 'Immediate attention needed' : 'Past due date & uncollected'}</span>
          </div>
        </div>
      </div>

      {/* Subscription Renewal & Expiration Alerts */}
      <RenewalAlertsSection daysAhead={7} />

      {/* Visual Aggregation: Revenue Velocity & Collections Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Monthly Billed vs Collected Overview */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">{isCustomer ? 'Billing & Payment Trajectory' : 'Recurring Revenue Trajectory'}</h3>
              <p className="card-description">{isCustomer ? 'Billed invoices vs. settled payments' : 'Billed invoices vs. settled payments over recent periods'}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--color-primary)' }} />
                Collected
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--color-warning)' }} />
                Outstanding
              </span>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', padding: '10px 0' }}>
              {monthlyOverview.map((item, idx) => {
                const maxVal = 80000;
                const collectedHeight = Math.max(12, (item.collected / maxVal) * 150);
                const outstandingHeight = Math.max(0, (item.outstanding / maxVal) * 150);

                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                      <div
                        title={`Collected: ${formatCurrency(item.collected)}`}
                        style={{
                          width: '18px',
                          height: `${collectedHeight}px`,
                          backgroundColor: 'var(--color-primary)',
                          borderRadius: '3px 3px 0 0',
                          transition: 'height 0.3s ease',
                        }}
                      />
                      {item.outstanding > 0 && (
                        <div
                          title={`Outstanding: ${formatCurrency(item.outstanding)}`}
                          style={{
                            width: '18px',
                            height: `${outstandingHeight}px`,
                            backgroundColor: 'var(--color-warning)',
                            borderRadius: '3px 3px 0 0',
                            transition: 'height 0.3s ease',
                          }}
                        />
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Collection Efficiency & Subscription Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Collection Health & Subscriptions</h3>
              <p className="card-description">Settlement status and subscription lifecycle breakdown</p>
            </div>
          </div>
          <div className="card-body">
            {/* Settlement Progress Bar */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>Total Billed: {formatCurrency(totalBilled)}</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>{collectionRate}% Paid</span>
              </div>
              <div style={{ height: '10px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${collectionRate}%`, backgroundColor: 'var(--color-success)' }} />
                <div style={{ width: `${100 - collectionRate}%`, backgroundColor: 'var(--color-warning)' }} />
              </div>
            </div>

            {/* Lifecycle Status Counts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
              <div style={{ padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success-dark)' }}>
                  {subscriptionsByStatus.ACTIVE || 0}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>Active</div>
              </div>
              <div style={{ padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-warning-dark)' }}>
                  {subscriptionsByStatus.PAUSED || 0}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>Paused</div>
              </div>
              <div style={{ padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-purple)' }}>
                  {subscriptionsByStatus.CONFIRMED || 0}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>Confirmed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Invoices</h3>
              <p className="card-description">Latest invoices generated across customer subscriptions</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={ArrowUpRight}
              onClick={() => navigate('/invoices')}
            >
              View Invoices
            </Button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Due Date</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/invoices`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 600 }}>{inv.number}</td>
                    <td>{inv.customerName}</td>
                    <td>{formatDate(inv.dueDate)}</td>
                    <td className="text-right" style={{ fontWeight: 600 }}>
                      {formatCurrency(inv.total)}
                    </td>
                    <td>
                      <Badge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Subscriptions</h3>
              <p className="card-description">Active agreements and scheduled next billing dates</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={ArrowUpRight}
              onClick={() => navigate('/subscriptions')}
            >
              View Subscriptions
            </Button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subscription</th>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Next Billing</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSubscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => navigate('/subscriptions')}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 600 }}>{sub.number}</td>
                    <td>{sub.customerName}</td>
                    <td>{sub.planName}</td>
                    <td>{formatDate(sub.nextBillingDate)}</td>
                    <td>
                      <Badge status={sub.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Run Billing Confirmation Dialog */}
      <ConfirmDialog
        isOpen={billingConfirmOpen}
        onClose={() => setBillingConfirmOpen(false)}
        onConfirm={handleRunBilling}
        loading={runningBilling}
        title="Execute Recurring Billing Cycle"
        message="This will evaluate all active subscriptions whose next billing date is due. The backend enforces database-level duplicate prevention for the same subscription and billing period."
        confirmText="Trigger Billing Run"
        confirmVariant="primary"
      />
    </div>
  );
}

export default DashboardPage;
