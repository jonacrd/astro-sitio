import React from 'react';

interface UiCardProps {
  variant?: 'paper' | 'surface';
  children: React.ReactNode;
  className?: string;
}

export function UiCard({ 
  variant = 'surface',
  children,
  className = '' 
}: UiCardProps) {
  const base = 'ui-card rounded-xl shadow-elev';
  
  const variants = {
    paper: 'bg-bg-paper text-ink-inverse border border-stroke-soft',
    surface: 'bg-bg-surface text-ink-base border border-white/10'
  };
  
  return (
    <div className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}







