import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Shield, ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('admin@subscriptiq.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    const res = await login({ email, password });
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  const handleDemoFill = (demoEmail, demoPassword = 'Password@123') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-app)',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--color-bg-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '32px 32px 24px',
            backgroundColor: 'var(--sidebar-bg)',
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 12px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
            }}
          >
            <Building2 size={26} color="#ffffff" />
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 6px',
            }}
          >
            Subscript<span style={{ color: 'var(--sidebar-accent)' }}>IQ</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--sidebar-text)', margin: 0 }}>
            Enterprise Subscription & Recurring Billing Management
          </p>
        </div>

        {/* Login Form */}
        <div style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--color-danger-subtle)',
                  border: '1px solid var(--color-danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-danger-dark)',
                  fontSize: '0.825rem',
                  marginBottom: '20px',
                  lineHeight: 1.4,
                }}
              >
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Work Email <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-subtle)',
                  }}
                />
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@subscriptiq.io"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="password">
                  Password <span className="required">*</span>
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-subtle)',
                  }}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingLeft: '38px', paddingRight: '38px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-subtle)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              style={{ width: '100%', padding: '12px' }}
            >
              Sign In to SubscriptIQ
            </Button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-muted)',
                marginBottom: '10px',
                textAlign: 'center',
              }}
            >
              Demo Hackathon Quick Logins
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleDemoFill('admin@subscriptiq.com', 'Admin@123')}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', width: '100%' }}
              >
                <span>
                  <strong>Admin:</strong> admin@subscriptiq.com
                </span>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                  ADMIN
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('staff@subscriptiq.com', 'Staff@123')}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', width: '100%' }}
              >
                <span>
                  <strong>Staff:</strong> staff@subscriptiq.com
                </span>
                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                  STAFF
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('user@subscriptiq.com', 'User@123')}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', width: '100%' }}
              >
                <span>
                  <strong>User:</strong> user@subscriptiq.com
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                  CUSTOMER
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
