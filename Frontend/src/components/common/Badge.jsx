import React from 'react';
import { getStatusBadgeVariant } from '../../utils/formatters';

export function Badge({ variant, status, children, className = '' }) {
  const finalVariant = variant || (status ? getStatusBadgeVariant(status) : 'neutral');

  return (
    <span className={`badge badge-${finalVariant} ${className}`}>
      <span className="badge-dot" />
      {children || status}
    </span>
  );
}

export default Badge;
