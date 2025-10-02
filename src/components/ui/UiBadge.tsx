import React from 'react';

interface UiBadgeProps {
  variant?: 'accent' | 'success' | 'danger' | 'warning' | 'muted';
  children: React.ReactNode;
  className?: string;
}

export function UiBadge({ 
  variant = 'muted',
  children,
  className = '' 
}: UiBadgeProps) {
  const base = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
  
  const variants = {
    accent: 'bg-brand-accent text-white',
    success: 'bg-state-success text-white',
    danger: 'bg-state-danger text-white',
    warning: 'bg-state-warn text-white',
    muted: 'bg-ink-muted text-ink-base'
  };
  
  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}


