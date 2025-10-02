import React from 'react';

interface SimpleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleLoginModal({ isOpen, onClose }: SimpleLoginModalProps) {
  console.log('🧪 SimpleLoginModal - isOpen:', isOpen);
  
  if (!isOpen) {
    console.log('🧪 SimpleLoginModal - NO RENDERIZANDO');
    return null;
  }

  console.log('🧪 SimpleLoginModal - RENDERIZANDO');

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center'
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'black' }}>
          🧪 MODAL DE PRUEBA
        </h2>
        <p style={{ marginBottom: '1.5rem', color: 'black' }}>
          Si ves esto, el modal funciona correctamente.
        </p>
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
