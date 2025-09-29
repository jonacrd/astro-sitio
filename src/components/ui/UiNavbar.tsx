import React from 'react';

interface UiNavbarProps {
  children: React.ReactNode;
  className?: string;
}

export function UiNavbar({ children, className = '' }: UiNavbarProps) {
  return (
    <nav className={`ui-navbar-top bg-bg-app border-b border-white/10 ${className}`}>
      <div className="ui-container">
        {children}
      </div>
    </nav>
  );
}
