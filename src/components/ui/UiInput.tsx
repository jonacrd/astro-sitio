import React from 'react';

interface UiInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'light' | 'dark';
  error?: boolean;
  label?: string;
}

export function UiInput({ 
  variant = 'light',
  error = false,
  label,
  className = '', 
  ...props 
}: UiInputProps) {
  const base = 'w-full rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-brand-primary';
  
  const variants = {
    light: 'ui-input bg-white text-ink-inverse placeholder-ink-muted border-stroke-soft',
    dark: 'ui-input-dark bg-bg-surface text-ink-base placeholder-ink-muted border-white/10'
  };
  
  const errorStyles = error ? 'border-state-danger focus:ring-state-danger' : '';
  
  const input = (
    <input 
      className={`${base} ${variants[variant]} ${errorStyles} ${className}`} 
      {...props}
    />
  );
  
  if (label) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-ink-base">
          {label}
        </label>
        {input}
      </div>
    );
  }
  
  return input;
}


