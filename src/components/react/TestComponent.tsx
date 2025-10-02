import React from 'react';

export default function TestComponent() {
  console.log('🧪 TestComponent renderizando');
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: 'lime',
      color: 'black',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 99999,
      fontSize: '14px',
      fontWeight: 'bold'
    }}>
      🧪 TEST COMPONENT ACTIVE
    </div>
  );
}
