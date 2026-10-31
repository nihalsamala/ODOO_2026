import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import Button from '../../components/common/Button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-subtle)',
          marginBottom: '16px',
        }}
      >
        <AlertCircle size={32} />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px' }}>Page Not Found</h2>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 0 24px' }}>
        The requested URL does not match any route in the SubscriptIQ management portal.
      </p>
      <Button variant="primary" icon={Home} onClick={() => navigate('/dashboard')}>
        Return to Dashboard
      </Button>
    </div>
  );
}

export default NotFoundPage;
