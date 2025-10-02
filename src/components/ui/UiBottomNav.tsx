import React from 'react';

interface UiBottomNavProps {
  children: React.ReactNode;
  className?: string;
}

export function UiBottomNav({ children, className = '' }: UiBottomNavProps) {
  return (
    <nav className={`ui-navbar-bottom bg-bg-app border-t border-white/10 ${className}`}>
      <div className="ui-container">
        {children}
      </div>
    </nav>
  );
}


