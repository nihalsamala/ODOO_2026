import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ text = 'Loading data...', size = 24 }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        color: 'var(--color-text-muted)',
        gap: '12px',
      }}
    >
      <Loader2 size={size} className="spinner" color="var(--color-primary)" />
      {text && <span style={{ fontSize: '0.875rem' }}>{text}</span>}
    </div>
  );
}

export default LoadingSpinner;
