import React, { useEffect } from 'react';

interface UiModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  variant?: 'light' | 'dark';
  className?: string;
}

export function UiModal({ 
  isOpen,
  onClose,
  children,
  variant = 'dark',
  className = ''
}: UiModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const variants = {
    light: 'bg-white text-ink-inverse',
    dark: 'bg-bg-surface text-ink-base'
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-xl shadow-elev ${variants[variant]} ${className}`}>
        {children}
      </div>
    </div>
  );
}






