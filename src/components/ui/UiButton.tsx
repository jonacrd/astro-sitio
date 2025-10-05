import React from 'react';

interface UiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function UiButton({ 
  variant = 'primary', 
  size = 'md',
  className = '', 
  children,
  ...props 
}: UiButtonProps) {
  const base = 'ui-btn inline-flex items-center justify-center rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-primary';
  
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary600',
    secondary: 'bg-bg-surface text-ink-base hover:bg-[#1A2029] border border-white/10',
    ghost: 'bg-transparent text-ink-base hover:bg-white/5',
    pill: 'rounded-full px-5 bg-bg-surface text-ink-base border border-white/10'
  };
  
  const sizes = {
    sm: 'px-3 h-9 text-sm',
    md: 'px-4 h-11 text-base',
    lg: 'px-6 h-12 text-lg'
  };
  
  return (
    <button 
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
}




