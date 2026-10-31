import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Repeat,
  FileText,
  Percent,
  Receipt,
  LogOut,
  ShieldCheck,
  Building2,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar() {
  const { user, logout, isAdmin, isCustomer } = useAuth();

  // Define navigation items with role visibility
  const navItems = [
    {
      label: isCustomer ? 'Customer Dashboard' : 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: 'Product Catalog',
      path: '/catalog',
      icon: ShoppingBag,
      visible: true, // Customers, Staff, and Admins all browse the catalog
    },
    {
      label: 'Products',
      path: '/products',
      icon: Package,
      visible: !isCustomer, // Admin and Staff only
    },
    {
      label: 'Plans',
      path: '/plans',
      icon: Layers,
      visible: !isCustomer, // Admin and Staff only
    },
    {
      label: 'Subscriptions',
      path: '/subscriptions',
      icon: Repeat,
      visible: true,
    },
    {
      label: 'Invoices',
      path: '/invoices',
      icon: FileText,
      visible: true,
    },
    {
      label: 'Discount Rules',
      path: '/discount-rules',
      icon: Percent,
      visible: isAdmin, // Admin only
    },
    {
      label: 'Tax Rules',
      path: '/tax-rules',
      icon: Receipt,
      visible: isAdmin, // Admin only
    },
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--sidebar-bg)',
        color: 'var(--sidebar-text)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--sidebar-border)',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand & Logo */}
      <div
        style={{
          padding: '24px 20px',
          borderBottom: '1px solid var(--sidebar-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
          }}
        >
          <Building2 size={22} />
        </div>
        <div>
          <div
            style={{
              fontSize: '1.15rem',
              fontWeight: '700',
              color: 'var(--sidebar-text-bright)',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Subscript<span style={{ color: 'var(--sidebar-accent)' }}>IQ</span>
          </div>
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--sidebar-text)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Billing Management
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div
          style={{
            fontSize: '0.675rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '8px 12px',
            color: '#64748b',
            fontWeight: 700,
          }}
        >
          {isCustomer ? 'Customer Portal' : 'Operations & Lifecycle'}
        </div>

        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#ffffff' : 'var(--sidebar-text)',
                      backgroundColor: isActive ? 'var(--sidebar-item-active)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--sidebar-accent)' : '3px solid transparent',
                      transition: 'all var(--transition-fast)',
                    })}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
        </ul>
      </nav>

      {/* User Info & Logout Footer */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--sidebar-border)',
          backgroundColor: 'var(--sidebar-header-bg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--sidebar-item-active)',
              color: 'var(--sidebar-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.825rem',
                fontWeight: 600,
                color: 'var(--sidebar-text-bright)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.name || 'User'}
            </div>
            <div
              style={{
                fontSize: '0.725rem',
                color: '#64748b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.email}
            </div>
          </div>
          <span
            style={{
              fontSize: '0.65rem',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 700,
              backgroundColor:
                user?.role === 'ADMIN'
                  ? 'rgba(37, 99, 235, 0.25)'
                  : user?.role === 'STAFF'
                  ? 'rgba(16, 185, 129, 0.25)'
                  : 'rgba(148, 163, 184, 0.2)',
              color:
                user?.role === 'ADMIN'
                  ? '#60a5fa'
                  : user?.role === 'STAFF'
                  ? '#34d399'
                  : '#cbd5e1',
            }}
          >
            {user?.role}
          </span>
        </div>

        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'transparent',
            border: '1px solid var(--sidebar-border)',
            color: 'var(--sidebar-text)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-item-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
