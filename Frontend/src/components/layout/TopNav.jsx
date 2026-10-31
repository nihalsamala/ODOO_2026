import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Server,
  Database,
  Users,
  ChevronDown,
  Shield,
  Briefcase,
  User,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isMockModeEnabled, setMockMode, API_BASE_URL } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export function TopNav() {
  const location = useLocation();
  const { user, switchDemoRole } = useAuth();
  const { showToast } = useToast();
  const [mockActive, setMockActive] = useState(isMockModeEnabled());
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    const handleModeChange = () => {
      setMockActive(isMockModeEnabled());
    };
    window.addEventListener('subscriptiq_mode_change', handleModeChange);
    return () => window.removeEventListener('subscriptiq_mode_change', handleModeChange);
  }, []);

  const handleToggleMock = () => {
    const nextVal = !mockActive;
    setMockMode(nextVal);
    setMockActive(nextVal);
    showToast(
      nextVal
        ? 'Switched to Local Mock Mode (Safe for offline demo)'
        : `Switched to Live Spring Boot Backend at ${API_BASE_URL}`,
      nextVal ? 'info' : 'warning'
    );
  };

  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/dashboard')) return user?.role === 'CUSTOMER' ? 'Customer Portal Dashboard' : 'Financial Dashboard';
    if (pathname.startsWith('/products')) return 'Product & Variant Catalog';
    if (pathname.startsWith('/plans')) return 'Subscription Plans & Intervals';
    if (pathname.startsWith('/subscriptions')) return 'Customer Subscriptions';
    if (pathname.startsWith('/invoices')) return 'Invoices & Billing';
    if (pathname.startsWith('/discount-rules')) return 'Discount Rules Configuration';
    if (pathname.startsWith('/tax-rules')) return 'Tax Rules Configuration';
    return 'SubscriptIQ Management';
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Page Title & Breadcrumb */}
      <div>
        <h2
          style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--color-text-main)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {getPageTitle(location.pathname)}
        </h2>
      </div>

      {/* Controls & User Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Mock / Live Backend Pill Switcher */}
        <div
          onClick={handleToggleMock}
          title="Click to toggle between Mock Mode and Live Spring Boot REST API"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: mockActive ? 'var(--color-purple-subtle)' : 'var(--color-success-subtle)',
            border: `1px solid ${mockActive ? 'var(--color-purple-border)' : 'var(--color-success-border)'}`,
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'all var(--transition-fast)',
          }}
        >
          {mockActive ? (
            <>
              <Database size={13} color="var(--color-purple)" />
              <span style={{ color: 'var(--color-purple)' }}>Mode: Mock Data (Demo)</span>
            </>
          ) : (
            <>
              <Server size={13} color="var(--color-success-dark)" />
              <span style={{ color: 'var(--color-success-dark)' }}>Live Backend: {API_BASE_URL}</span>
            </>
          )}
        </div>

        {/* Quick Demo Role Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-subtle)',
              fontSize: '0.775rem',
              fontWeight: 600,
              color: 'var(--color-text-main)',
              cursor: 'pointer',
            }}
          >
            <Users size={14} color="var(--color-text-muted)" />
            <span>Role: {user?.role}</span>
            <ChevronDown size={14} color="var(--color-text-subtle)" />
          </button>

          {roleMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                width: '210px',
                backgroundColor: 'var(--color-bg-surface)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-border)',
                zIndex: 100,
                overflow: 'hidden',
                animation: 'scaleUp 120ms ease-out',
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--color-text-subtle)',
                  borderBottom: '1px solid var(--color-border-subtle)',
                }}
              >
                Switch Role for Demo
              </div>
              <button
                type="button"
                onClick={() => {
                  switchDemoRole('ADMIN');
                  setRoleMenuOpen(false);
                  showToast('Switched to ADMIN view (Full CRUD & Rules)', 'info');
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 12px',
                  border: 'none',
                  background: user?.role === 'ADMIN' ? 'var(--color-primary-subtle)' : 'none',
                  color: user?.role === 'ADMIN' ? 'var(--color-primary)' : 'var(--color-text-main)',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <Shield size={14} />
                <span>ADMIN (Full Access)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  switchDemoRole('STAFF');
                  setRoleMenuOpen(false);
                  showToast('Switched to STAFF view (Operations & Invoicing)', 'info');
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 12px',
                  border: 'none',
                  background: user?.role === 'STAFF' ? 'var(--color-primary-subtle)' : 'none',
                  color: user?.role === 'STAFF' ? 'var(--color-primary)' : 'var(--color-text-main)',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <Briefcase size={14} />
                <span>STAFF (Operational)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  switchDemoRole('CUSTOMER');
                  setRoleMenuOpen(false);
                  showToast('Switched to CUSTOMER view (Isolated records)', 'info');
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 12px',
                  border: 'none',
                  background: user?.role === 'CUSTOMER' ? 'var(--color-primary-subtle)' : 'none',
                  color: user?.role === 'CUSTOMER' ? 'var(--color-primary)' : 'var(--color-text-main)',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <User size={14} />
                <span>CUSTOMER (Isolated)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopNav;
