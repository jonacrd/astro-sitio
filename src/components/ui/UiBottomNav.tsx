import React from 'react';

interface UiBottomNavProps {
  children: React.ReactNode;
  className?: string;
}

export function UiBottomNav({ children, className = '' }: UiBottomNavProps) {
  console.log('🔍 UiBottomNav renderizando...');
  
  return (
    <nav 
      className={`ui-navbar-bottom bg-bg-app border-t border-white/10 ${className}`}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderTop: '1px solid #334155',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div style={{ padding: '0.5rem' }}>
        {children}
      </div>
    </nav>
  );
}


