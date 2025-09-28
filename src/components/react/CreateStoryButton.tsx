import React from 'react';

interface CreateStoryButtonProps {
  onClick: () => void;
  className?: string;
}

export default function CreateStoryButton({ onClick, className = '' }: CreateStoryButtonProps) {
  const handleClick = () => {
    console.log('🔘 CreateStoryButton clickeado');
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${className}`}
    >
      <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <span className="font-medium">Crear Historia</span>
    </button>
  );
}
