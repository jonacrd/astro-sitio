import React from 'react';

console.warn('[DEPRECATED] CartTable.tsx has been moved to trash. Please use CartSheet.tsx instead.');

interface CartTableProps {
  className?: string;
}

export default function CartTable({ className = "" }: CartTableProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">
          [DEPRECATED] CartTable component has been removed.
        </p>
        <p className="text-sm text-gray-400">
          Please use CartSheet.tsx or redirect to /checkout for cart functionality.
        </p>
      </div>
    </div>
  );
}