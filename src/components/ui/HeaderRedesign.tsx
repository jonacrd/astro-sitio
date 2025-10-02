import React from 'react';
import Header from '../react/Header';

export function HeaderRedesign() {
  return (
    <div className="bg-dark-secondary border-b border-border-default sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <Header />
      </div>
    </div>
  );
}


